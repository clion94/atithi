'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BedDouble } from 'lucide-react'
import { getRooms, updateRoomStatus } from '@/lib/services/rooms'
import { roomStatusSchema, type RoomStatusFormData } from '@/lib/validations/room'
import { RoomStatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import type { Room, RoomStatus } from '@/types'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/currency'

const STATUS_COLORS: Record<RoomStatus, string> = {
  clean: 'border-t-4 border-t-success',
  dirty: 'border-t-4 border-t-warning',
  inspected: 'border-t-4 border-t-blue-500',
  out_of_order: 'border-t-4 border-t-error',
  do_not_disturb: 'border-t-4 border-t-gray-400',
}

type FilterStatus = 'all' | RoomStatus

export default function RoomsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [updating, setUpdating] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoomStatusFormData>({
    resolver: zodResolver(roomStatusSchema),
  })

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

  const handleStatusUpdate = async (data: RoomStatusFormData) => {
    if (!selectedRoom) return
    setUpdating(true)
    try {
      await updateRoomStatus(selectedRoom.id, data.status, data.notes)
      toast.success('Room status updated')
      setSelectedRoom(null)
      reset()
      loadRooms()
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setUpdating(false)
    }
  }

  const filtered = rooms.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false
    if (typeFilter !== 'all' && r.room_type !== typeFilter) return false
    return true
  })

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'clean', label: t('room.status.clean') },
    { value: 'dirty', label: t('room.status.dirty') },
    { value: 'inspected', label: t('room.status.inspected') },
    { value: 'out_of_order', label: t('room.status.out_of_order') },
    { value: 'do_not_disturb', label: t('room.status.do_not_disturb') },
  ]

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'standard', label: t('room.type_options.standard') },
    { value: 'double', label: t('room.type_options.double') },
    { value: 'suite', label: t('room.type_options.suite') },
    { value: 'king', label: t('room.type_options.king') },
    { value: 'smoking', label: t('room.type_options.smoking') },
    { value: 'accessible', label: t('room.type_options.accessible') },
  ]

  const updateStatusOptions = [
    { value: 'clean', label: t('room.status.clean') },
    { value: 'dirty', label: t('room.status.dirty') },
    { value: 'inspected', label: t('room.status.inspected') },
    { value: 'out_of_order', label: t('room.status.out_of_order') },
    { value: 'do_not_disturb', label: t('room.status.do_not_disturb') },
  ]

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
        <h1 className="font-display text-2xl font-bold text-secondary">{t('nav.rooms')}</h1>
        <span className="text-sm text-gray-500">{filtered.length} rooms</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="w-44">
          <Select
            options={statusOptions}
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterStatus)}
          />
        </div>
        <div className="w-44">
          <Select
            options={typeOptions}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filtered.map((room) => (
          <button
            key={room.id}
            onClick={() => {
              setSelectedRoom(room)
              reset({ status: room.status, notes: room.notes ?? '' })
            }}
            className={cn(
              'bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md transition-shadow cursor-pointer',
              STATUS_COLORS[room.status]
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <BedDouble className="h-4 w-4 text-gray-400" />
              <span className="font-bold text-secondary text-lg">{room.number}</span>
            </div>
            <p className="text-xs text-gray-500 capitalize mb-2">{room.room_type}</p>
            <RoomStatusBadge status={room.status} />
            <p className="text-xs text-gray-400 mt-2">{formatCurrency(room.base_rate)}/night</p>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <BedDouble className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>{t('common.noResults')}</p>
        </div>
      )}

      {/* Update Status Modal */}
      <Modal
        open={!!selectedRoom}
        onClose={() => { setSelectedRoom(null); reset() }}
        title={`Room ${selectedRoom?.number} — Update Status`}
        size="sm"
      >
        <form onSubmit={handleSubmit(handleStatusUpdate)} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <RoomStatusBadge status={selectedRoom?.status ?? 'clean'} />
            <span className="text-sm text-gray-500 capitalize">{selectedRoom?.room_type} · Floor {selectedRoom?.floor ?? '—'}</span>
          </div>
          <Select
            label="New Status"
            options={updateStatusOptions}
            error={errors.status?.message}
            {...register('status')}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-secondary">Notes (optional)</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={3}
              {...register('notes')}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={updating} className="flex-1">
              Update Status
            </Button>
            <Button type="button" variant="outline" onClick={() => { setSelectedRoom(null); reset() }}>
              {t('actions.cancel')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
