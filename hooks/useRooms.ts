'use client'

import { useQuery } from '@tanstack/react-query'
import { getRooms } from '@/lib/services/rooms'

export function useRooms() {
  return useQuery({ queryKey: ['rooms'], queryFn: getRooms })
}
