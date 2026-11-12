import { describe, expect, it } from 'vitest'
import { dateRange, dayLabel, occupancyByDay, stayBar } from './calendar'

const START = '2026-11-12' // a Thursday
const TODAY = '2026-11-12'
const stay = (id: string, i: string, o: string, status: 'confirmed' | 'checked_in' | 'checked_out' = 'confirmed') => ({
  id, room_id: 'r1', check_in_date: i, check_out_date: o, status,
})

describe('dateRange', () => {
  it('lists consecutive days across a month boundary', () => {
    const r = dateRange('2026-11-28', 5)
    expect(r).toEqual(['2026-11-28', '2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02'])
  })
  it('defaults to two weeks', () => expect(dateRange(START)).toHaveLength(14))
})

describe('stayBar', () => {
  it('covers the nights of a normal stay (check-out day stays free)', () => {
    expect(stayBar(stay('a', '2026-11-14', '2026-11-17'), START, TODAY)).toMatchObject({
      startCol: 2, span: 3, clippedStart: false, clippedEnd: false, overdue: false,
    })
  })
  it('lets back-to-back stays sit side by side without overlapping', () => {
    const a = stayBar(stay('a', '2026-11-13', '2026-11-15'), START, TODAY)!
    const b = stayBar(stay('b', '2026-11-15', '2026-11-16'), START, TODAY)!
    expect(a.startCol + a.span).toBe(b.startCol)
  })
  it('clips a stay that began before the window', () => {
    expect(stayBar(stay('a', '2026-11-09', '2026-11-14'), START, TODAY)).toMatchObject({
      startCol: 0, span: 2, clippedStart: true, clippedEnd: false,
    })
  })
  it('clips a stay that runs past the window', () => {
    expect(stayBar(stay('a', '2026-11-24', '2026-12-05'), START, TODAY)).toMatchObject({
      startCol: 12, span: 2, clippedStart: false, clippedEnd: true,
    })
  })
  it('hides stays outside the window, including one that checks out on day one', () => {
    expect(stayBar(stay('a', '2026-11-01', '2026-11-12'), START, TODAY)).toBeNull()
    expect(stayBar(stay('a', '2026-11-26', '2026-11-28'), START, TODAY)).toBeNull()
  })
  it('draws a guest who should have left but is still checked in through today, flagged overdue', () => {
    expect(stayBar(stay('a', '2026-11-09', '2026-11-11', 'checked_in'), START, TODAY)).toMatchObject({
      startCol: 0, span: 1, clippedStart: true, overdue: true,
    })
  })
  it('does not flag a guest who is due out today as overdue', () => {
    const bar = stayBar(stay('a', '2026-11-10', '2026-11-12', 'checked_in'), START, TODAY)
    expect(bar).toBeNull() // today is their check-out day, so no night is drawn from today
    expect(stayBar(stay('a', '2026-11-10', '2026-11-12', 'checked_in'), '2026-11-09', TODAY)).toMatchObject({
      overdue: false, startCol: 1, span: 2,
    })
  })
  it('does not mark checked-out or future stays overdue', () => {
    expect(stayBar(stay('a', '2026-11-09', '2026-11-11', 'checked_out'), START, TODAY)).toBeNull()
    expect(stayBar(stay('a', '2026-11-13', '2026-11-14'), START, TODAY)!.overdue).toBe(false)
  })
  it('works when the window starts in the past', () => {
    expect(stayBar(stay('a', '2026-11-10', '2026-11-13', 'checked_out'), '2026-11-05', TODAY)).toMatchObject({
      startCol: 5, span: 3,
    })
  })
})

describe('occupancyByDay', () => {
  it('counts rooms per day and ignores cancelled / no-show', () => {
    const counts = occupancyByDay(
      [
        stay('a', '2026-11-12', '2026-11-14'),
        { ...stay('b', '2026-11-13', '2026-11-15'), room_id: 'r2' },
        { ...stay('c', '2026-11-12', '2026-11-20'), room_id: 'r3', status: 'cancelled' as never },
      ],
      START, TODAY, 4
    )
    expect(counts).toEqual([1, 2, 1, 0])
  })
})

describe('dayLabel', () => {
  it('is stable regardless of the viewer time zone and follows the locale', () => {
    expect(dayLabel('2026-11-14')).toMatchObject({ weekday: 'Sat', day: '14', month: 'Nov', isWeekend: true })
    expect(dayLabel('2026-11-12').isWeekend).toBe(false)
    expect(dayLabel('2026-11-14', 'hi-IN').weekday).not.toBe('Sat')
  })
})
