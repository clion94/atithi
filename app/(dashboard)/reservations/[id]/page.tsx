'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, UserCheck, LogOut, X, BedDouble } from 'lucide-react'
import {
  getReservation,
  checkIn as doCheckIn,
  checkOut as doCheckOut,
  updateReservationStatus,
} from '@/lib/services/reservations'
import { ReservationStatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { formatDate, formatDateTime, nightsBetween } from '@/lib/utils/dates'
import { formatCurrency } from '@/lib/utils/currency'
import type { Reservation } from '@/types'

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const router = useRouter()
  const toast = useToast()
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)

  useEffect(() => {
    getReservation(id)
      .then(setReservation)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [id, toast])

  const handleCheckIn = async () => {
    if (!reservation) return
    setActionLoading(true)
    try {
      const updated = await doCheckIn(reservation.id)
      setReservation(updated)
      toast.success(`${reservation.guest?.first_name} checked in to Room ${reservation.room?.number}`)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!reservation) return
    setActionLoading(true)
    try {
      const updated = await doCheckOut(reservation.id)
      setReservation(updated)
      toast.success(`${reservation.guest?.first_name} checked out`)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!reservation) return
    setActionLoading(true)
    try {
      const updated = await updateReservationStatus(reservation.id, 'cancelled')
      setReservation(updated)
      toast.success('Reservation cancelled')
      setCancelModal(false)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!reservation) {
    return <div className="text-center py-12 text-gray-400">Reservation not found</div>
  }

  const nights = nightsBetween(reservation.check_in_date, reservation.check_out_date)
  const total = nights * reservation.rate_per_night

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/reservations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-[28px] md:text-[34px] leading-tight font-bold tracking-tight text-secondary">Reservation</h1>
          <ReservationStatusBadge status={reservation.status} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {reservation.status === 'confirmed' && (
          <>
            <Button onClick={handleCheckIn} loading={actionLoading}>
              <UserCheck className="h-4 w-4" />
              {t('actions.checkIn')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setCancelModal(true)}
              disabled={actionLoading}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </>
        )}
        {reservation.status === 'checked_in' && (
          <Button onClick={handleCheckOut} loading={actionLoading}>
            <LogOut className="h-4 w-4" />
            {t('actions.checkOut')}
          </Button>
        )}
      </div>

      {/* Reservation details */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-[17px] font-semibold tracking-tight text-secondary mb-4 flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-primary" />
            Room & Stay
          </h2>
          <dl className="space-y-3 text-sm">
            <InfoRow label="Room" value={`${reservation.room?.number} (${reservation.room?.room_type})`} />
            <InfoRow label={t('reservation.checkIn')} value={formatDate(reservation.check_in_date)} />
            <InfoRow label={t('reservation.checkOut')} value={formatDate(reservation.check_out_date)} />
            <InfoRow label="Nights" value={String(nights)} />
            <InfoRow label="Rate / Night" value={formatCurrency(reservation.rate_per_night)} />
            <InfoRow label="Total" value={formatCurrency(total)} highlight />
            <InfoRow label="Adults" value={String(reservation.adults)} />
            <InfoRow label="Children" value={String(reservation.children)} />
            <InfoRow label="Source" value={reservation.source.replace(/_/g, ' ')} />
            {reservation.special_requests && (
              <InfoRow label="Special Requests" value={reservation.special_requests} />
            )}
          </dl>
        </Card>

        <Card>
          <h2 className="text-[17px] font-semibold tracking-tight text-secondary mb-4">Guest Information</h2>
          {reservation.guest ? (
            <dl className="space-y-3 text-sm">
              <InfoRow
                label="Name"
                value={`${reservation.guest.first_name} ${reservation.guest.last_name}`}
              />
              {reservation.guest.phone && (
                <InfoRow label="Phone" value={reservation.guest.phone} />
              )}
              {reservation.guest.email && (
                <InfoRow label="Email" value={reservation.guest.email} />
              )}
              {reservation.guest.is_banned && (
                <div className="flex items-center gap-2 p-2.5 bg-red-500/10 rounded-xl text-error">
                  <span className="text-xs font-medium">⚠️ This guest is banned: {reservation.guest.ban_reason}</span>
                </div>
              )}
              <div className="pt-2">
                <Link href={`/guests/${reservation.guest_id}`}>
                  <Button variant="outline" size="sm">View Guest Profile</Button>
                </Link>
              </div>
            </dl>
          ) : (
            <p className="text-gray-400 text-sm">No guest information</p>
          )}
        </Card>
      </div>

      {/* Timestamps */}
      {(reservation.actual_check_in || reservation.actual_check_out) && (
        <Card>
          <h2 className="text-[17px] font-semibold tracking-tight text-secondary mb-4">Activity</h2>
          <dl className="space-y-3 text-sm">
            {reservation.actual_check_in && (
              <InfoRow label="Checked In" value={formatDateTime(reservation.actual_check_in)} />
            )}
            {reservation.actual_check_out && (
              <InfoRow label="Checked Out" value={formatDateTime(reservation.actual_check_out)} />
            )}
          </dl>
        </Card>
      )}

      {/* Cancel confirmation */}
      <Modal
        open={cancelModal}
        onClose={() => setCancelModal(false)}
        title="Cancel Reservation"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to cancel this reservation for{' '}
          <strong>{reservation.guest?.first_name} {reservation.guest?.last_name}</strong>?
          This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={handleCancel} loading={actionLoading} className="flex-1">
            Yes, Cancel
          </Button>
          <Button variant="outline" onClick={() => setCancelModal(false)}>
            Keep It
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className={highlight ? 'font-semibold text-primary' : 'font-medium text-secondary'}>{value}</dd>
    </div>
  )
}
