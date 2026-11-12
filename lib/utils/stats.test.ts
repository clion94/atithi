import { describe, expect, it } from 'vitest'
import { computeAvailability, computeDailyReport, countsOn } from './stats'

const stay = (
  check_in_date: string,
  check_out_date: string,
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show',
  rate_per_night = 100
) => ({ check_in_date, check_out_date, status, rate_per_night })

describe('computeAvailability', () => {
  it('excludes out-of-order rooms from what can be sold', () => {
    const rooms = [
      { status: 'clean' },
      { status: 'dirty' },
      { status: 'out_of_order' },
      { status: 'do_not_disturb' },
    ]
    expect(computeAvailability(rooms, 1)).toEqual({ sellable: 3, occupied: 1, available: 2 })
  })

  it('never goes negative', () => {
    expect(computeAvailability([{ status: 'clean' }], 3).available).toBe(0)
  })

  it('handles a property with no rooms', () => {
    expect(computeAvailability([], 0)).toEqual({ sellable: 0, occupied: 0, available: 0 })
  })
})

describe('countsOn', () => {
  const today = '2026-11-12'
  it('counts settled stays on any date', () => {
    expect(countsOn({ status: 'checked_out' }, '2026-11-01', today)).toBe(true)
    expect(countsOn({ status: 'checked_in' }, today, today)).toBe(true)
  })
  it('counts confirmed only from today onwards', () => {
    expect(countsOn({ status: 'confirmed' }, '2026-11-10', today)).toBe(false)
    expect(countsOn({ status: 'confirmed' }, today, today)).toBe(true)
    expect(countsOn({ status: 'confirmed' }, '2026-11-20', today)).toBe(true)
  })
  it('never counts cancelled or no-show', () => {
    expect(countsOn({ status: 'cancelled' }, today, today)).toBe(false)
    expect(countsOn({ status: 'no_show' }, today, today)).toBe(false)
  })
})

describe('computeDailyReport', () => {
  const today = '2026-11-12'

  it('computes occupancy, revenue and ADR from sold rooms', () => {
    const r = computeDailyReport(
      today,
      today,
      [
        stay('2026-11-10', '2026-11-14', 'checked_in', 100),
        stay('2026-11-12', '2026-11-13', 'confirmed', 200),
        stay('2026-11-12', '2026-11-13', 'cancelled', 999),
      ],
      4
    )
    expect(r.rooms_sold).toBe(2)
    expect(r.occupancy).toBe(50)
    expect(r.revenue).toBe(300)
    expect(r.adr).toBe(150)
    expect(r.arrivals_count).toBe(1)
  })

  it('does not count a past reservation that was never checked in', () => {
    const r = computeDailyReport(
      '2026-11-05',
      today,
      [stay('2026-11-04', '2026-11-06', 'confirmed'), stay('2026-11-04', '2026-11-06', 'checked_out')],
      10
    )
    expect(r.rooms_sold).toBe(1)
    expect(r.occupancy).toBe(10)
  })

  it('treats the check-out day as a departure, not an occupied night', () => {
    const r = computeDailyReport(
      '2026-11-14',
      today,
      [stay('2026-11-10', '2026-11-14', 'checked_out')],
      5
    )
    expect(r.rooms_sold).toBe(0)
    expect(r.departures_count).toBe(1)
  })

  it('does not report a departure for a booking that never checked in', () => {
    const r = computeDailyReport(
      today,
      today,
      [stay('2026-11-10', '2026-11-12', 'confirmed')],
      5
    )
    expect(r.departures_count).toBe(0)
  })

  it('returns zeros for an empty day and for a property with no rooms', () => {
    expect(computeDailyReport(today, today, [], 5)).toMatchObject({
      occupancy: 0,
      adr: 0,
      revenue: 0,
    })
    expect(computeDailyReport(today, today, [stay(today, '2026-11-13', 'confirmed')], 0).occupancy).toBe(0)
  })
})
