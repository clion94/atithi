import { addDays, differenceInCalendarDays, format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns'

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy')
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MM/dd/yy')
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy h:mm a')
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn))
}

/**
 * Today's calendar date (yyyy-MM-dd) in the given IANA time zone.
 *
 * Pass the property's time zone so "today" matches the front desk, not the
 * viewer's browser or the UTC server clock. Without a time zone it falls back
 * to the runtime's local time.
 */
export function todayISO(timeZone?: string, now: Date = new Date()): string {
  if (!timeZone) return format(now, 'yyyy-MM-dd')
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** Add (or subtract) whole days to a yyyy-MM-dd string, with no time zone drift. */
export function addDaysISO(date: string, days: number): string {
  return format(addDays(parseISO(date), days), 'yyyy-MM-dd')
}

/** Long date for headers, e.g. "Thursday, November 12, 2026", in a time zone. */
export function formatLongDate(timeZone?: string, now: Date = new Date(), locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(now)
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  if (isYesterday(d)) return 'Yesterday'
  return formatDate(d)
}

export function toInputDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'yyyy-MM-dd')
}
