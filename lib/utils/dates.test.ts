import { describe, expect, it } from 'vitest'
import { addDaysISO, nightsBetween, todayISO } from './dates'

describe('todayISO', () => {
  // 2026-11-12 02:30 UTC is still the evening of Nov 11 in Chicago (UTC-6).
  const instant = new Date('2026-11-12T02:30:00Z')

  it('uses the property time zone, not UTC', () => {
    expect(todayISO('America/Chicago', instant)).toBe('2026-11-11')
    expect(todayISO('UTC', instant)).toBe('2026-11-12')
  })

  it('is already tomorrow in time zones ahead of UTC', () => {
    expect(todayISO('Asia/Kolkata', instant)).toBe('2026-11-12')
    expect(todayISO('Pacific/Auckland', instant)).toBe('2026-11-12')
  })

  it('handles the DST change in the zone, not the browser', () => {
    // US clocks go back on 2026-11-01 at 02:00 local.
    expect(todayISO('America/New_York', new Date('2026-11-01T05:30:00Z'))).toBe('2026-11-01')
    expect(todayISO('America/New_York', new Date('2026-11-01T04:30:00Z'))).toBe('2026-11-01')
    expect(todayISO('America/New_York', new Date('2026-11-01T03:59:00Z'))).toBe('2026-10-31')
  })
})

describe('addDaysISO', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDaysISO('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDaysISO('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('does not drift across a DST change', () => {
    expect(addDaysISO('2026-10-31', 2)).toBe('2026-11-02')
    expect(addDaysISO('2026-03-07', 2)).toBe('2026-03-09')
  })

  it('subtracts days', () => {
    expect(addDaysISO('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('nightsBetween', () => {
  it('counts calendar nights', () => {
    expect(nightsBetween('2026-11-10', '2026-11-13')).toBe(3)
    expect(nightsBetween('2026-10-31', '2026-11-02')).toBe(2)
  })
})

describe('formatLongDate', () => {
  const instant = new Date('2026-11-12T02:30:00Z')
  it('formats in the property time zone', async () => {
    const { formatLongDate } = await import('./dates')
    expect(formatLongDate('America/Chicago', instant)).toBe('Wednesday, November 11, 2026')
    expect(formatLongDate('Asia/Kolkata', instant)).toBe('Thursday, November 12, 2026')
  })
  it('follows the UI language', async () => {
    const { formatLongDate } = await import('./dates')
    expect(formatLongDate('Asia/Kolkata', instant, 'hi-IN')).toContain('2026')
    expect(formatLongDate('Asia/Kolkata', instant, 'hi-IN')).not.toBe(formatLongDate('Asia/Kolkata', instant, 'en-US'))
  })
})
