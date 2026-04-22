'use client'

import { useState, useEffect, useCallback } from 'react'
import { getHousekeepingLog } from '@/lib/services/housekeeping'
import type { HousekeepingLog } from '@/types'

export function useHousekeepingLog(roomId?: string) {
  const [log, setLog] = useState<HousekeepingLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getHousekeepingLog(roomId)
      setLog(data)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [roomId])

  useEffect(() => { load() }, [load])

  return { log, loading, error, refetch: load }
}
