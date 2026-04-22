import { differenceInCalendarDays, format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns'

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

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
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
