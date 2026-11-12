'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  getReservation,
  getReservations,
  type ReservationFilter,
} from '@/lib/services/reservations'
import { usePropertyToday } from '@/hooks/usePropertyToday'

export function useReservations(filter: ReservationFilter, search: string) {
  const today = usePropertyToday()
  return useInfiniteQuery({
    queryKey: ['reservations', filter, search, today],
    queryFn: ({ pageParam }) =>
      getReservations({ filter, search, today: today as string, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.hasMore ? all.length : undefined),
    enabled: !!today,
  })
}

export function useReservation(id: string) {
  return useQuery({ queryKey: ['reservation', id], queryFn: () => getReservation(id) })
}
