import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ACTIVITY_ACTIONS } from '../utils/activity'
import { ERROR_CODES } from '../team/types'

const ROOT = path.resolve(__dirname, '../..')
const LOCALES = ['en', 'hi', 'gu'] as const

type Tree = { [key: string]: string | Tree }

function load(locale: string): Tree {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'public/locales', locale, 'common.json'), 'utf8'))
}

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(tree)) {
    if (typeof v === 'string') out[prefix + k] = v
    else Object.assign(out, flatten(v, `${prefix}${k}.`))
  }
  return out
}

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'node_modules' || e.name === '.next' ? [] : sourceFiles(p)
    return /\.(tsx?|jsx?)$/.test(e.name) && !/\.test\./.test(e.name) ? [p] : []
  })
}

const en = flatten(load('en'))

describe('locales', () => {
  it.each(LOCALES.filter((l) => l !== 'en'))('%s has exactly the same keys as en', (locale) => {
    const keys = Object.keys(flatten(load(locale)))
    const enKeys = Object.keys(en)
    // Plural suffixes legitimately differ between languages, so compare the base keys.
    const base = (k: string) => k.replace(/_(zero|one|two|few|many|other)$/, '')
    expect(new Set(keys.map(base))).toEqual(new Set(enKeys.map(base)))
  })

  it.each(LOCALES)('%s has no empty or placeholder-only values', (locale) => {
    for (const [key, value] of Object.entries(flatten(load(locale)))) {
      expect(value.trim().length, key).toBeGreaterThan(0)
    }
  })

  it.each(LOCALES.filter((l) => l !== 'en'))('%s keeps every {{placeholder}} and <tag> from en', (locale) => {
    const tr = flatten(load(locale))
    const tokens = (s: string) => (s.match(/\{\{\s*\w+\s*\}\}|<\/?\w+>/g) ?? []).sort()
    for (const [key, value] of Object.entries(tr)) {
      expect(tokens(value), key).toEqual(tokens(en[key]))
    }
  })

  it.each(LOCALES)('%s translates every key the app builds dynamically', (locale) => {
    const tr = flatten(load(locale))
    const dynamic = [
      'activity.unknown',
      'activity.system',
      ...ACTIVITY_ACTIONS.map((a) => `activity.${a}`),
      ...ERROR_CODES.map((c) => `team.errors.${c}`),
      ...['owner', 'manager', 'staff'].map((r) => `team.roles.${r}`),
      ...['id_front', 'id_back', 'other'].map((k) => `documents.kinds.${k}`),
      ...['drivers_license', 'passport', 'state_id', 'other'].map((k) => `guest.idTypes.${k}`),
      ...['clean', 'dirty', 'inspected', 'out_of_order', 'do_not_disturb'].map((s) => `room.status.${s}`),
      ...['standard', 'double', 'suite', 'king', 'smoking', 'accessible'].map((s) => `room.type_options.${s}`),
      ...['walk_in', 'phone', 'booking_com', 'expedia', 'direct_web', 'other'].map((s) => `reservation.source_options.${s}`),
    ]
    expect(dynamic.filter((k) => !(k in tr))).toEqual([])
  })

  it('every literal t("key") used in the app exists in en', () => {
    const used = new Set<string>()
    for (const dir of ['app', 'components', 'lib']) {
      for (const file of sourceFiles(path.join(ROOT, dir))) {
        const src = fs.readFileSync(file, 'utf8')
        for (const m of src.matchAll(/\bt\(\s*['"]([\w.]+)['"]/g)) used.add(m[1])
        for (const m of src.matchAll(/i18nKey=["']([\w.]+)["']/g)) used.add(m[1])
      }
    }
    const has = (k: string) => k in en || `${k}_one` in en || `${k}_other` in en
    expect([...used].filter((k) => !has(k)).sort()).toEqual([])
  })
})
