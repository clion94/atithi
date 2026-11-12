'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useTranslation, Trans } from 'react-i18next'
import { ArrowLeft, UserCheck, LogOut, X, BedDouble, UserX } from 'lucide-react'
import {
  getReservation,
  checkIn as doCheckIn,
  checkOut as doCheckOut,
  cancelReservation,
  markNoShow,
} from '@/lib/services/reservations'
import { ReservationStatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { formatDate, formatDateTime, nightsBetween, todayISO } from '@/lib/utils/dates'
import { useAppStore } from '@/store/useAppStore'
import { errorMessage } from '@/lib/utils/errors'
import { formatCurrency } from '@/lib/utils/currency'
import type { Reservation } from '@/types'

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const property = useAppStore((s) => s.property)
  const toast = useToast()
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)

  useEffect(() => {
    getReservation(id)
      .then(setReservation)
      .catch((e) => toast.error(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [id, toast])

  const handleCheckIn = async () => {
    if (!reservation) return
    setActionLoading(true)
    try {
      const updated = await doCheckIn(reservation.id)
      setReservation(updated)
      await queryClient.invalidateQueries()
      toast.success(t('reservation.checkedInTo', { name: reservation.guest?.first_name, room: reservation.room?.number }))
    } catch (e: unknown) {
      toast.error(errorMessage(e))
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
      await queryClient.invalidateQueries()
      toast.success(t('reservation.checkedOutName', { name: reservation.guest?.first_name }))
    } catch (e: unknown) {
      toast.error(errorMessage(e))
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!reservation) return
    setActionLoading(true)
    try {
      const updated = await cancelReservation(reservation.id)
      setReservation(updated)
      await queryClient.invalidateQueries()
      toast.success(t('reservation.cancelled'))
      setCancelModal(false)
    } catch (e: unknown) {
      toast.error(errorMessage(e))
    } finally {
      setActionLoading(false)
    }
  }

  const handleNoShow = async () => {
    if (!reservation) return
    setActionLoading(true)
    try {
      const updated = await markNoShow(reservation.id)
      setReservation(updated)
      await queryClient.invalidateQueries()
      toast.success(t('reservation.markedNoShow'))
    } catch (e: unknown) {
      toast.error(errorMessage(e))
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
    return <div className="text-center py-12 text-gray-400">{t('reservation.notFound')}</div>
  }

  const nights = nightsBetween(reservation.check_in_date, reservation.check_out_date)
  const total = nights * reservation.rate_per_night

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/reservations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            {t('actions.back')}
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-[28px] md:text-[34px] leading-tight font-bold tracking-tight text-secondary">{t('reservation.title')}</h1>
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
              {t('actions.cancel')}
            </Button>
            {reservation.check_in_date <= todayISO(property?.timezone) && (
              <Button variant="outline" onClick={handleNoShow} disabled={actionLoading}>
                <UserX className="h-4 w-4" />
                {t('actions.noShow')}
              </Button>
            )}
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
            {t('reservation.roomStay')}
          </h2>
          <dl className="space-y-3 text-sm">
            <InfoRow label={t('reservation.room')} value={`${reservation.room?.number} (${reservation.room?.room_type ? t(`room.type_options.${reservation.room.room_type}`) : ''})`} />
            <InfoRow label={t('reservation.checkIn')} value={formatDate(reservation.check_in_date)} />
            <InfoRow label={t('reservation.checkOut')} value={formatDate(reservation.check_out_date)} />
            <InfoRow label={t('reservation.nights')} value={String(nights)} />
            <InfoRow label={t('reservation.rate')} value={formatCurrency(reservation.rate_per_night)} />
            <InfoRow label={t('reservation.total')} value={formatCurrency(total)} highlight />
            <InfoRow label={t('reservation.adults')} value={String(reservation.adults)} />
            <InfoRow label={t('reservation.children')} value={String(reservation.children)} />
            <InfoRow label={t('reservation.source')} value={t(`reservation.source_options.${reservation.source}`)} />
            {reservation.special_requests && (
              <InfoRow label={t('reservation.specialRequests')} value={reservation.special_requests} />
            )}
          </dl>
        </Card>

        <Card>
          <h2 className="text-[17px] font-semibold tracking-tight text-secondary mb-4">{t('reservation.guestInfo')}</h2>
          {reservation.guest ? (
            <dl className="space-y-3 text-sm">
              <InfoRow
                label={t('reservation.name')}
                value={`${reservation.guest.first_name} ${reservation.guest.last_name}`}
              />
              {reservation.guest.phone && (
                <InfoRow label={t('guest.phone')} value={reservation.guest.phone} />
              )}
              {reservation.guest.email && (
                <InfoRow label={t('guest.email')} value={reservation.guest.email} />
              )}
              {reservation.guest.is_banned && (
                <div className="flex items-center gap-2 p-2.5 bg-red-500/10 rounded-xl text-error">
                  <span className="text-xs font-medium">⚠️ This guest is banned: {reservation.guest.ban_reason}</span>
                </div>
              )}
              <div className="pt-2">
                <Link href={`/guests/${reservation.guest_id}`}>
                  <Button variant="outline" size="sm">{t('reservation.viewGuest')}</Button>
                </Link>
              </div>
            </dl>
          ) : (
            <p className="text-gray-400 text-sm">{t('reservation.noGuestInfo')}</p>
          )}
        </Card>
      </div>

      {/* Timestamps */}
      {(reservation.actual_check_in || reservation.actual_check_out) && (
        <Card>
          <h2 className="text-[17px] font-semibold tracking-tight text-secondary mb-4">{t('reservation.activity')}</h2>
          <dl className="space-y-3 text-sm">
            {reservation.actual_check_in && (
              <InfoRow label={t('reservation.status.checked_in')} value={formatDateTime(reservation.actual_check_in)} />
            )}
            {reservation.actual_check_out && (
              <InfoRow label={t('reservation.status.checked_out')} value={formatDateTime(reservation.actual_check_out)} />
            )}
          </dl>
        </Card>
      )}

      {/* Cancel confirmation */}
      <Modal
        open={cancelModal}
        onClose={() => setCancelModal(false)}
        title={t('reservation.cancelTitle')}
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">
          <Trans
            i18nKey="reservation.cancelConfirm"
            values={{ name: `${reservation.guest?.first_name} ${reservation.guest?.last_name}` }}
            components={{ strong: <strong /> }}
          />
        </p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={handleCancel} loading={actionLoading} className="flex-1">
            {t('actions.yesCancel')}
          </Button>
          <Button variant="outline" onClick={() => setCancelModal(false)}>
            {t('actions.keepIt')}
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
