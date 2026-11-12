'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation, Trans } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, AlertTriangle, ShieldCheck } from 'lucide-react'
import { getGuest, updateGuest, setBanStatus } from '@/lib/services/guests'
import { getGuestReservations } from '@/lib/services/reservations'
import { guestSchema, type GuestFormData } from '@/lib/validations/guest'
import { ReservationStatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { useAppStore } from '@/store/useAppStore'
import { formatDate, nightsBetween } from '@/lib/utils/dates'
import { formatCurrency } from '@/lib/utils/currency'
import type { Guest, Reservation } from '@/types'

export default function GuestProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const toast = useToast()
  const profile = useAppStore((s) => s.profile)
  const [guest, setGuest] = useState<Guest | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [banModal, setBanModal] = useState(false)
  const [banReason, setBanReason] = useState('')
  const [banning, setBanning] = useState(false)

  const canBan = profile?.role === 'owner' || profile?.role === 'manager'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GuestFormData>({ resolver: zodResolver(guestSchema) })

  useEffect(() => {
    Promise.all([getGuest(id), getGuestReservations(id)])
      .then(([g, r]) => {
        setGuest(g)
        setReservations(r)
        reset({
          first_name: g.first_name,
          last_name: g.last_name,
          email: g.email ?? '',
          phone: g.phone ?? '',
          address: g.address ?? '',
          city: g.city ?? '',
          state: g.state ?? '',
          zip: g.zip ?? '',
          notes: g.notes ?? '',
        })
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [id, reset, toast])

  const onSave = async (data: GuestFormData) => {
    if (!guest) return
    setSaving(true)
    try {
      const updated = await updateGuest(guest.id, data)
      setGuest(updated)
      setEditing(false)
      toast.success(t('guest.updated'))
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleBan = async () => {
    if (!guest) return
    setBanning(true)
    try {
      const updated = await setBanStatus(guest.id, true, banReason)
      setGuest(updated)
      setBanModal(false)
      toast.success(t('guest.banApplied'))
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setBanning(false)
    }
  }

  const handleUnban = async () => {
    if (!guest) return
    setBanning(true)
    try {
      const updated = await setBanStatus(guest.id, false)
      setGuest(updated)
      toast.success(t('guest.banRemoved'))
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setBanning(false)
    }
  }

  const idTypeOptions = [
    { value: 'drivers_license', label: t('guest.idTypes.drivers_license') },
    { value: 'passport', label: t('guest.idTypes.passport') },
    { value: 'state_id', label: t('guest.idTypes.state_id') },
    { value: 'other', label: t('guest.idTypes.other') },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!guest) {
    return <div className="text-center py-12 text-gray-400">{t('guest.notFound')}</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/guests">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            {t('actions.back')}
          </Button>
        </Link>
        <h1 className="font-display text-[28px] md:text-[34px] leading-tight font-bold tracking-tight text-secondary">
          {guest.first_name} {guest.last_name}
        </h1>
        {guest.is_banned && (
          <span className="flex items-center gap-1 text-xs font-semibold text-error bg-red-500/10 px-2.5 py-1 rounded-full">
            <AlertTriangle className="h-3 w-3" />
            {t('guest.bannedBadge')}
          </span>
        )}
      </div>

      {/* Ban warning */}
      {guest.is_banned && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-2xl">
          <AlertTriangle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-error">{t('guest.isBanned')}</p>
            {guest.ban_reason && (
              <p className="text-sm text-red-600 mt-1">{guest.ban_reason}</p>
            )}
          </div>
        </div>
      )}

      {/* Guest Info */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-semibold tracking-tight text-secondary">{t('guest.information')}</h2>
          <div className="flex gap-2">
            {canBan && (
              guest.is_banned ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUnban}
                  loading={banning}
                >
                  <ShieldCheck className="h-4 w-4" />
                  {t('actions.unbanGuest')}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setBanModal(true)}
                >
                  <AlertTriangle className="h-4 w-4" />
                  {t('actions.banGuest')}
                </Button>
              )
            )}
            <Button
              size="sm"
              variant={editing ? 'outline' : 'ghost'}
              onClick={() => setEditing(!editing)}
            >
              {editing ? t('actions.cancel') : t('actions.edit')}
            </Button>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('guest.firstName')}
                error={errors.first_name?.message}
                {...register('first_name')}
              />
              <Input
                label={t('guest.lastName')}
                error={errors.last_name?.message}
                {...register('last_name')}
              />
            </div>
            <Input label={t('guest.phone')} type="tel" {...register('phone')} />
            <Input label={t('guest.email')} type="email" error={errors.email?.message} {...register('email')} />
            <Select
              label={t('guest.idType')}
              options={idTypeOptions}
              placeholder={t('guest.selectIdType')}
              {...register('id_type')}
            />
            <Input label={t('guest.idNumber')} {...register('id_number')} />
            <Input label={t('guest.address')} {...register('address')} />
            <div className="grid grid-cols-3 gap-3">
              <Input label={t('settings.city')} {...register('city')} />
              <Input label={t('settings.state')} {...register('state')} />
              <Input label={t('settings.zip')} {...register('zip')} />
            </div>
            <Textarea label={t('guest.notes')} rows={3}
                {...register('notes')}
              />
            <div className="flex gap-3">
              <Button type="submit" loading={saving} className="flex-1">
                {t('actions.save')}
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                {t('actions.cancel')}
              </Button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <GuestField label={t('guest.phone')} value={guest.phone} />
            <GuestField label={t('guest.email')} value={guest.email} />
            <GuestField label={t('guest.idType')} value={guest.id_type?.replace(/_/g, ' ')} />
            <GuestField label={t('guest.idNumber')} value={guest.id_number} />
            <GuestField label={t('guest.address')} value={[guest.address, guest.city, guest.state, guest.zip].filter(Boolean).join(', ')} />
            <GuestField label={t('guest.memberSince')} value={formatDate(guest.created_at)} />
            {guest.notes && (
              <div className="col-span-2">
                <dt className="text-gray-500 mb-1">{t('guest.notes')}</dt>
                <dd className="text-secondary bg-black/[0.03] rounded-xl p-3 text-sm">{guest.notes}</dd>
              </div>
            )}
          </dl>
        )}
      </Card>

      {/* Stay History */}
      <Card>
        <h2 className="text-[17px] font-semibold tracking-tight text-secondary mb-4">{t('guest.stayHistory')}</h2>
        {reservations.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">{t('common.noResults')}</p>
        ) : (
          <div className="space-y-3">
            {reservations.map((r) => {
              const nights = nightsBetween(r.check_in_date, r.check_out_date)
              return (
                <Link key={r.id} href={`/reservations/${r.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-black/[0.03] transition-colors cursor-pointer ring-1 ring-black/5">
                    <div>
                      <p className="font-medium text-secondary text-sm">
                        Room {r.room?.number}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(r.check_in_date)} → {formatDate(r.check_out_date)} · {nights} nights
                      </p>
                    </div>
                    <div className="text-right">
                      <ReservationStatusBadge status={r.status} />
                      <p className="text-sm font-medium text-secondary mt-1">
                        {formatCurrency(nights * r.rate_per_night)}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </Card>

      {/* Ban modal */}
      <Modal
        open={banModal}
        onClose={() => setBanModal(false)}
        title={t('actions.banGuest')}
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          <Trans
            i18nKey="guest.banIntro"
            values={{ name: `${guest.first_name} ${guest.last_name}` }}
            components={{ strong: <strong /> }}
          />
        </p>
        <Textarea label={t('guest.banReasonLabel')} className="mb-6" rows={3}
            placeholder={t('guest.banReasonPlaceholder')}
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
          />
        <div className="flex gap-3">
          <Button
            variant="danger"
            onClick={handleBan}
            loading={banning}
            disabled={!banReason.trim()}
            className="flex-1"
          >
            {t('actions.banGuest')}
          </Button>
          <Button variant="outline" onClick={() => setBanModal(false)}>
            {t('actions.cancel')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function GuestField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-gray-500 text-xs">{label}</dt>
      <dd className="font-medium text-secondary mt-0.5">{value}</dd>
    </div>
  )
}
