import { describe, expect, it } from 'vitest'
import { generateTempPassword } from './password'

describe('generateTempPassword', () => {
  it('has the requested length and only unambiguous characters', () => {
    for (let i = 0; i < 200; i++) {
      const p = generateTempPassword()
      expect(p).toHaveLength(14)
      expect(p).toMatch(/^[A-HJ-NP-Za-km-z2-9]+$/)
    }
  })
  it('always includes upper, lower and a digit', () => {
    for (let i = 0; i < 200; i++) {
      const p = generateTempPassword(10)
      expect(p).toMatch(/[A-Z]/)
      expect(p).toMatch(/[a-z]/)
      expect(p).toMatch(/[2-9]/)
    }
  })
  it('does not repeat', () => {
    const seen = new Set(Array.from({ length: 500 }, () => generateTempPassword()))
    expect(seen.size).toBe(500)
  })
  it('uses the injected random source', () => {
    expect(generateTempPassword(8, () => 0)).toMatch(/^[A2a]{8}$/)
  })
})
