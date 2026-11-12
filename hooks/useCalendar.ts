'use client'

import { useQuery } from '@tanstack/react-query'
import { getCalendar } from '@/lib/services/calendar'
import { usePropertyToday } from '@/hooks/usePropertyToday'

export function useCalendar(start: string | undefined) {
  const today = usePropertyToday()
  return useQuery({
    queryKey: ['calendar', start, today],
    queryFn: () => getCalendar(start as string, today as string),
    enabled: !!start && !!today,
  })
}
