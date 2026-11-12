'use client'

import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Sheet from '@/components/documents/Sheet'
import ErrorState from '@/components/ui/ErrorState'
import Spinner from '@/components/ui/Spinner'
import { useReservation } from '@/hooks/useReservations'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate, nightsBetween, todayISO } from '@/lib/utils/dates'
import { computeInvoice, invoiceNumber } from '@/lib/utils/invoice'

export default function InvoicePage() {
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

  // Nothing is owed on a cancelled or no-show booking, so there is nothing to invoice.
  if (r.status === 'cancelled' || r.status === 'no_show') {
    return <p className="py-12 text-center text-gray-400">{t('documents.noInvoice')}</p>
  }

  const g = r.guest
  const nights = nightsBetween(r.check_in_date, r.check_out_date)
  const inv = computeInvoice({ nights, ratePerNight: r.rate_per_night, taxRate: Number(property?.tax_rate ?? 0) })
  const isEstimate = r.status === 'confirmed'
  const cityLine = [g?.city, [g?.state, g?.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')

  return (
    <Sheet
      title={t(isEstimate ? 'documents.estimate' : 'documents.invoice')}
      backHref={`/reservations/${r.id}`}
      subtitle={
        <>
          <p>{invoiceNumber(r.id)}</p>
          <p>{formatDate(todayISO(property?.timezone))}</p>
        </>
      }
    >
      <div className="space-y-8">
        <section className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{t('documents.billTo')}</p>
            <p className="mt-1 font-semibold">{g ? `${g.first_name} ${g.last_name}` : ''}</p>
            {g?.address && <p className="text-gray-600">{g.address}</p>}
            {cityLine && <p className="text-gray-600">{cityLine}</p>}
            {g?.email && <p className="text-gray-600">{g.email}</p>}
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{t('documents.stay')}</p>
            <p className="mt-1">
              {formatDate(r.check_in_date)} → {formatDate(r.check_out_date)}
            </p>
            <p className="text-gray-600">
              {t('reservation.room')} {r.room?.number}
            </p>
          </div>
        </section>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-secondary text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              <th className="py-2 pr-2">{t('documents.description')}</th>
              <th className="py-2 px-2 text-right">{t('documents.qty')}</th>
              <th className="py-2 px-2 text-right">{t('reservation.rate')}</th>
              <th className="py-2 pl-2 text-right">{t('documents.amount')}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-3 pr-2">
                {t('documents.roomCharge', {
                  room: r.room?.number,
                  type: r.room?.room_type ? t(`room.type_options.${r.room.room_type}`) : '',
                })}
              </td>
              <td className="py-3 px-2 text-right tabular-nums">{t('reservation.nightsCount', { count: inv.nights })}</td>
              <td className="py-3 px-2 text-right tabular-nums">{formatCurrency(inv.ratePerNight)}</td>
              <td className="py-3 pl-2 text-right tabular-nums">{formatCurrency(inv.subtotal)}</td>
            </tr>
          </tbody>
        </table>

        <dl className="ml-auto w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">{t('documents.subtotal')}</dt>
            <dd className="tabular-nums">{formatCurrency(inv.subtotal)}</dd>
          </div>
          {inv.taxRate > 0 && (
            <div className="flex justify-between">
              <dt className="text-gray-600">{t('documents.tax', { rate: inv.taxRate })}</dt>
              <dd className="tabular-nums">{formatCurrency(inv.tax)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-secondary pt-2 text-base font-bold">
            <dt>{t('reservation.total')}</dt>
            <dd className="tabular-nums">{formatCurrency(inv.total)}</dd>
          </div>
        </dl>

        <p className="border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
          {isEstimate ? t('documents.estimateNote') : t('documents.thanks', { name: property?.name })}
        </p>
      </div>
    </Sheet>
  )
}
