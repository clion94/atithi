'use client'

import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Sheet, { Field } from '@/components/documents/Sheet'
import ErrorState from '@/components/ui/ErrorState'
import Spinner from '@/components/ui/Spinner'
import { useReservation } from '@/hooks/useReservations'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate, nightsBetween } from '@/lib/utils/dates'

export default function RegistrationCardPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const property = useAppStore((s) => s.property)
  const { data: r, isPending, error, refetch } = useReservation(id)

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />
  if (isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  const g = r.guest
  const nights = nightsBetween(r.check_in_date, r.check_out_date)
  const cityLine = [g?.city, [g?.state, g?.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  const checkOutTime = property?.check_out_time?.slice(0, 5)

  return (
    <Sheet title={t('documents.registrationCard')} backHref={`/reservations/${r.id}`}>
      <div className="space-y-7">
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider">{t('documents.guestDetails')}</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Field label={t('documents.fullName')} value={g ? `${g.first_name} ${g.last_name}` : ''} className="col-span-2" />
            <Field label={t('guest.address')} value={g?.address} className="col-span-2" />
            <Field label={t('documents.cityStateZip')} value={cityLine} />
            <Field label={t('guest.phone')} value={g?.phone} />
            <Field label={t('guest.email')} value={g?.email} className="col-span-2" />
            <Field label={t('guest.idType')} value={g?.id_type ? t(`guest.idTypes.${g.id_type}`, { defaultValue: g.id_type }) : ''} />
            <Field label={t('guest.idNumber')} value={g?.id_number} />
            <Field label={t('reservation.vehiclePlate')} value={r.vehicle_plate} className="col-span-2" />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider">{t('documents.stayDetails')}</h2>
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <Field
              label={t('reservation.room')}
              value={`${r.room?.number ?? ''} ${r.room?.room_type ? `(${t(`room.type_options.${r.room.room_type}`)})` : ''}`}
            />
            <Field label={t('reservation.checkIn')} value={formatDate(r.check_in_date)} />
            <Field label={t('reservation.checkOut')} value={formatDate(r.check_out_date)} />
            <Field label={t('reservation.nights')} value={String(nights)} />
            <Field label={`${t('reservation.adults')} / ${t('reservation.children')}`} value={`${r.adults} / ${r.children}`} />
            <Field label={t('reservation.rate')} value={formatCurrency(r.rate_per_night)} />
          </div>
        </section>

        <section className="text-sm leading-relaxed text-gray-700">
          <p>{t('documents.registrationTerms')}</p>
          {checkOutTime && <p className="mt-2">{t('documents.checkOutTime', { time: checkOutTime })}</p>}
        </section>

        <section className="grid grid-cols-3 gap-x-6 pt-6">
          <Field label={t('documents.guestSignature')} className="col-span-2" />
          <Field label={t('documents.date')} />
          <Field label={t('documents.staffInitials')} className="mt-6" />
        </section>
      </div>
    </Sheet>
  )
}
