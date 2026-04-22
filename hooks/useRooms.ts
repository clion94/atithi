'use client'

import { useState, useEffect, useCallback } from 'react'
import { getRooms } from '@/lib/services/rooms'
import type { Room } from '@/types'

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getRooms()
      setRooms(data)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { rooms, loading, error, refetch: load }
}
