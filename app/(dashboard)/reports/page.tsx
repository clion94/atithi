'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, TrendingUp } from 'lucide-react'
import { useDailyReport } from '@/hooks/useReports'
import { usePropertyToday } from '@/hooks/usePropertyToday'
import ErrorState from '@/components/ui/ErrorState'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import { ReservationStatusBadge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/dates'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/currency'

export default function ReportsPage() {
  const { t } = useTranslation()
  const today = usePropertyToday()
  const [pickedDate, setDate] = useState<string>()
  const date = pickedDate ?? today ?? ''
  const { data: report, isPending, error, refetch } = useDailyReport(date)
  const loading = isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[28px] md:text-[34px] leading-tight font-bold tracking-tight text-secondary">{t('reports.daily')}</h1>
        <div className="w-44">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={today}
          />
        </div>
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : loading ? (
        <div className="flex items-center justify-center h-48">
          <Spinner size="lg" />
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ReportCard
              label={t('reports.occupancy')}
              value={`${report.occupancy}%`}
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
            />
            <ReportCard
              label={t('reports.roomsSold')}
              value={String(report.rooms_sold)}
              icon={<BarChart3 className="h-5 w-5 text-accent" />}
            />
            <ReportCard
              label={t('reports.revenue')}
              value={formatCurrencyCompact(report.revenue)}
              icon={<span className="text-success font-bold text-lg">$</span>}
            />
            <ReportCard
              label={t('reports.adr')}
              value={formatCurrencyCompact(report.adr)}
              icon={<span className="text-secondary font-bold text-lg">∅</span>}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card padding="sm">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('reports.arrivals')}</p>
              <p className="text-2xl font-bold text-secondary">{report.arrivals_count}</p>
            </Card>
            <Card padding="sm">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('reports.departures')}</p>
              <p className="text-2xl font-bold text-secondary">{report.departures_count}</p>
            </Card>
            <Card padding="sm">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('reports.inHouse')}</p>
              <p className="text-2xl font-bold text-secondary">{report.inhouse_count}</p>
            </Card>
          </div>

          {/* Transactions table */}
          <Card padding="none">
            <div className="px-6 py-4 border-b border-black/5">
              <h2 className="text-[17px] font-semibold tracking-tight text-secondary">{t('reports.allReservations', { date: formatDate(date) })}</h2>
            </div>
            {report.reservations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">{t('reports.noActivity')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-black/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('reservation.guest')}</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('reservation.room')}</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('reservation.checkIn')}</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('reservation.checkOut')}</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('reservation.rate')}</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('reservation.status.label')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {report.reservations.map((r) => {
                      return (
                        <tr key={r.id} className="hover:bg-black/[0.03]">
                          <td className="px-4 py-3 text-sm font-medium text-secondary">
                            {r.guest?.first_name} {r.guest?.last_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{r.room?.number}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(r.check_in_date)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(r.check_out_date)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-secondary">
                            {formatCurrency(r.rate_per_night)}
                          </td>
                          <td className="px-4 py-3">
                            <ReservationStatusBadge status={r.status} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  )
}

function ReportCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card padding="sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-secondary">{value}</p>
        </div>
        <div className="p-2.5 bg-black/[0.04] rounded-xl">{icon}</div>
      </div>
    </Card>
  )
}
