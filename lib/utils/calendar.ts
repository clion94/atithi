import { differenceInCalendarDays, parseISO } from 'date-fns'
import { addDaysISO } from '@/lib/utils/dates'
import type { ReservationStatus } from '@/types'

export const CALENDAR_DAYS = 14

/** The ISO dates shown as columns, starting at `start`. */
export function dateRange(start: string, days: number = CALENDAR_DAYS): string[] {
  return Array.from({ length: days }, (_, i) => addDaysISO(start, i))
}

export interface CalendarStay {
  id: string
  room_id: string
  check_in_date: string
  check_out_date: string
  status: ReservationStatus
}

export interface StayBar {
  id: string
  /** 0-based first visible day column. */
  startCol: number
  /** Number of day columns the bar covers. */
  span: number
  /** The stay began before the first visible day / continues past the last. */
  clippedStart: boolean
  clippedEnd: boolean
  /** Guest is still checked in although their check-out date has passed. */
  overdue: boolean
}

/**
 * Where a stay is drawn on a `days`-wide rack starting at `start`.
 *
 * A stay occupies the nights [check_in, check_out), so a guest leaving on the 5th
 * does not block the column for the 5th: the next guest can arrive that day.
 * A guest who is still checked in after their check-out date has passed is drawn
 * through `today` and flagged overdue, because that room is not actually free. (On
 * the check-out day itself they are simply departing, not overdue.)
 * Returns null when the stay is entirely outside the visible window.
 */
export function stayBar(
  stay: Pick<CalendarStay, 'id' | 'check_in_date' | 'check_out_date' | 'status'>,
  start: string,
  today: string,
  days: number = CALENDAR_DAYS
): StayBar | null {
  const overdue = stay.status === 'checked_in' && stay.check_out_date < today
  const lastNightExclusive = overdue ? addDaysISO(today, 1) : stay.check_out_date

  const first = differenceInCalendarDays(parseISO(stay.check_in_date), parseISO(start))
  const lastNight = differenceInCalendarDays(parseISO(lastNightExclusive), parseISO(start)) - 1

  const startCol = Math.max(first, 0)
  const endCol = Math.min(lastNight, days - 1)
  if (endCol < startCol) return null

  return {
    id: stay.id,
    startCol,
    span: endCol - startCol + 1,
    clippedStart: first < 0,
    clippedEnd: lastNight > days - 1,
    overdue,
  }
}

/** How many rooms are occupied on each visible day (for the totals row). */
export function occupancyByDay(
  stays: Pick<CalendarStay, 'id' | 'room_id' | 'check_in_date' | 'check_out_date' | 'status'>[],
  start: string,
  today: string,
  days: number = CALENDAR_DAYS
): number[] {
  const counts = Array<number>(days).fill(0)
  for (const stay of stays) {
    if (stay.status === 'cancelled' || stay.status === 'no_show') continue
    const bar = stayBar(stay, start, today, days)
    if (!bar) continue
    for (let c = bar.startCol; c < bar.startCol + bar.span; c++) counts[c] += 1
  }
  return counts
}

/** Short weekday, day-of-month and month for a column header, in the UI language. */
export function dayLabel(iso: string, locale = 'en-US') {
  // Noon UTC + timeZone UTC keeps the calendar date stable in every viewer time zone.
  const d = new Date(`${iso}T12:00:00Z`)
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...opts, timeZone: 'UTC' }).format(d)
  return {
    weekday: fmt({ weekday: 'short' }),
    day: fmt({ day: 'numeric' }),
    month: fmt({ month: 'short' }),
    isWeekend: [0, 6].includes(d.getUTCDay()),
  }
}
