'use client'

import { useQuery } from '@tanstack/react-query'
import { getDailyReport, getDashboardStats } from '@/lib/services/reservations'
import { usePropertyToday } from '@/hooks/usePropertyToday'

export function useDashboardStats() {
  const today = usePropertyToday()
  return useQuery({
    queryKey: ['dashboard', today],
    queryFn: () => getDashboardStats(today as string),
    enabled: !!today,
  })
}

export function useDailyReport(date: string) {
  const today = usePropertyToday()
  return useQuery({
    queryKey: ['daily-report', date, today],
    queryFn: () => getDailyReport(date, today as string),
    enabled: !!today && !!date,
  })
}
