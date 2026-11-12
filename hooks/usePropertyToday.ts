'use client'

import { useAppStore } from '@/store/useAppStore'
import { todayISO } from '@/lib/utils/dates'

/**
 * "Today" in the property's time zone (yyyy-MM-dd), or undefined until the
 * property has loaded. Queries that depend on it should be `enabled: !!today`.
 */
export function usePropertyToday(): string | undefined {
  const timeZone = useAppStore((s) => s.property?.timezone)
  return timeZone ? todayISO(timeZone) : undefined
}
