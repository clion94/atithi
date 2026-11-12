'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { getGuests } from '@/lib/services/guests'

export function useGuests(search: string) {
  return useInfiniteQuery({
    queryKey: ['guests', search],
    queryFn: ({ pageParam }) => getGuests(search, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.hasMore ? all.length : undefined),
  })
}
