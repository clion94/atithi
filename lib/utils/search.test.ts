import { describe, expect, it } from 'vitest'
import { sanitizeSearch } from './search'
import { toError } from './errors'

describe('sanitizeSearch', () => {
  it('strips characters that would break a PostgREST or() filter', () => {
    expect(sanitizeSearch('smith),is_banned.eq.true,(x')).toBe('smith is_banned.eq.true x')
    expect(sanitizeSearch('50%')).toBe('50')
  })
  it('returns undefined for empty or punctuation-only input', () => {
    expect(sanitizeSearch('')).toBeUndefined()
    expect(sanitizeSearch('  ,() ')).toBeUndefined()
    expect(sanitizeSearch(undefined)).toBeUndefined()
  })
  it('keeps normal names and phone numbers', () => {
    expect(sanitizeSearch("  O'Brien ")).toBe("O'Brien")
    expect(sanitizeSearch('512-555-0142')).toBe('512-555-0142')
  })
})

describe('toError', () => {
  it('explains a double booking in plain language', () => {
    expect(toError({ code: '23P01', message: 'conflicting key value violates exclusion constraint' }).message)
      .toMatch(/already booked/)
  })
  it('explains a row-level security refusal', () => {
    expect(toError({ code: '42501', message: 'new row violates row-level security policy for table "rooms"' }).message)
      .toBe("You don't have permission to do that.")
  })
  it('passes through messages our database rules raise on purpose', () => {
    expect(toError({ code: '23514', message: 'Room 102 is out of order' }).message).toBe('Room 102 is out of order')
    expect(toError({ code: '42501', message: 'Only an owner or manager can ban or unban a guest' }).message)
      .toBe('Only an owner or manager can ban or unban a guest')
  })
})
