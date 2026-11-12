import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (rel: string) => fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8')

// Regression guard: the registration card and invoice once printed with no margin at all
// (text touching the paper's edge) because the margin lived only in `@page`, which browsers
// and the user's own "Margins" print setting can ignore. The margin must stay on the document.
describe('printed documents keep their own margin', () => {
  it('the sheet pads itself when printing and does not zero its padding', () => {
    const sheet = read('components/documents/Sheet.tsx')
    expect(sheet).toContain('print:p-[14mm]')
    expect(sheet).not.toMatch(/print:p-0\b/)
  })

  it('@page margin is 0 so the sheet padding is the only margin (no double margin, no browser header/footer)', () => {
    const css = read('app/globals.css')
    const page = css.match(/@page\s*\{([^}]*)\}/)
    expect(page?.[1]).toMatch(/margin:\s*0\s*;/)
  })
})
