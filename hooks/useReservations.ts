'use client'

import { useState, useEffect, useCallback } from 'react'
import { getReservations } from '@/lib/services/reservations'
import type { Reservation } from '@/types'

export function useReservations(filter?: string) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getReservations(filter)
      setReservations(data)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  return { reservations, loading, error, refetch: load }
}
