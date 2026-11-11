'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Clock } from 'lucide-react'
import { getRooms, updateRoomStatus } from '@/lib/services/rooms'
import { RoomStatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import type { Room, RoomStatus } from '@/types'
import { cn } from '@/lib/utils/cn'
import { formatDateTime } from '@/lib/utils/dates'

type FilterType = 'all' | 'dirty' | 'inspected' | 'clean'

export default function HousekeepingPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadRooms = useCallback(async () => {
    try {
      const data = await getRooms()
      setRooms(data)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadRooms() }, [loadRooms])

  const handleStatusChange = async (room: Room, status: RoomStatus) => {
    setUpdatingId(room.id)
    try {
      await updateRoomStatus(room.id, status)
      toast.success(`Room ${room.number} marked as ${status}`)
      setRooms((prev) => prev.map((r) => r.id === room.id ? { ...r, status } : r))
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = rooms.filter((r) => {
    if (r.status === 'out_of_order') return false
    if (filter === 'all') return true
    return r.status === filter
  })

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('housekeeping.allRooms') },
    { key: 'dirty', label: t('housekeeping.dirtyOnly') },
    { key: 'inspected', label: t('housekeeping.inspectedOnly') },
    { key: 'clean', label: t('room.status.clean') },
  ]

  const nextStatus: Partial<Record<RoomStatus, RoomStatus>> = {
    dirty: 'inspected',
    inspected: 'clean',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[28px] md:text-[34px] leading-tight font-bold tracking-tight text-secondary">{t('housekeeping.title')}</h1>
        <span className="text-sm text-gray-500">{filtered.length} rooms</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filterButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'px-4 min-h-9 rounded-full text-sm font-medium transition active:scale-[0.97]',
              filter === key
                ? 'bg-secondary text-white shadow-sm'
                : 'bg-white ring-1 ring-black/5 text-secondary hover:bg-black/[0.03]'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Room cards - optimized for phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((room) => (
          <div
            key={room.id}
            className="bg-white rounded-2xl shadow-card ring-1 ring-black/5 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-bold text-secondary text-xl">Room {room.number}</span>
                <p className="text-xs text-gray-500 capitalize">{room.room_type}</p>
              </div>
              <RoomStatusBadge status={room.status} />
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
              <Clock className="h-3 w-3" />
              <span>{formatDateTime(room.updated_at)}</span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              {room.status === 'dirty' && (
                <Button
                  size="sm"
                  variant="outline"
                  loading={updatingId === room.id}
                  onClick={() => handleStatusChange(room, 'inspected')}
                  className="flex-1"
                >
                  Mark Inspected
                </Button>
              )}
              {room.status === 'inspected' && (
                <Button
                  size="sm"
                  loading={updatingId === room.id}
                  onClick={() => handleStatusChange(room, 'clean')}
                  className="flex-1"
                >
                  Mark Clean
                </Button>
              )}
              {room.status === 'clean' && (
                <Button
                  size="sm"
                  variant="outline"
                  loading={updatingId === room.id}
                  onClick={() => handleStatusChange(room, 'dirty')}
                  className="flex-1 text-amber-700 ring-amber-400/50 hover:bg-amber-50"
                >
                  Mark Dirty
                </Button>
              )}
              {room.status === 'do_not_disturb' && (
                <Button
                  size="sm"
                  variant="ghost"
                  loading={updatingId === room.id}
                  onClick={() => handleStatusChange(room, 'clean')}
                  className="flex-1"
                >
                  Clear DND
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>All rooms are up to date!</p>
        </div>
      )}
    </div>
  )
}
