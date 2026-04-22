'use client'

import { useState, useEffect, useCallback } from 'react'
import { getGuests } from '@/lib/services/guests'
import type { Guest } from '@/types'

export function useGuests(search?: string) {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getGuests(search)
      setGuests(data)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  return { guests, loading, error, refetch: load }
}
