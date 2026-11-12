import { describe, expect, it } from 'vitest'
import { normalizePlate } from './plate'

describe('normalizePlate', () => {
  it('trims, upper-cases and collapses spaces', () => {
    expect(normalizePlate('  tx   1234 ')).toBe('TX 1234')
    expect(normalizePlate('abc-123')).toBe('ABC-123')
  })
  it('turns empty or missing input into null', () => {
    expect(normalizePlate('')).toBeNull()
    expect(normalizePlate('   ')).toBeNull()
    expect(normalizePlate(undefined)).toBeNull()
    expect(normalizePlate(null)).toBeNull()
  })
})
