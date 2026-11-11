'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, TrendingUp } from 'lucide-react'
import { getDailyReport } from '@/lib/services/reservations'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import { ReservationStatusBadge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { todayISO, formatDate, nightsBetween } from '@/lib/utils/dates'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/currency'

interface DailyReport {
  date: string
  occupancy: number
  rooms_sold: number
  revenue: number
  adr: number
  arrivals_count: number
  departures_count: number
  inhouse_count: number
  reservations: unknown[]
}

export default function ReportsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [date, setDate] = useState(todayISO())
  const [report, setReport] = useState<DailyReport | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getDailyReport(date)
      setReport(data as DailyReport)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [date, toast])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[28px] md:text-[34px] leading-tight font-bold tracking-tight text-secondary">{t('reports.daily')}</h1>
        <div className="w-44">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={todayISO()}
          />
        </div>
      </div>

      {loading ? (
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
              <h2 className="text-[17px] font-semibold tracking-tight text-secondary">All Reservations — {formatDate(date)}</h2>
            </div>
            {(report.reservations as ReturnType<typeof Array>).length === 0 ? (
              <div className="text-center py-8 text-gray-400">No activity for this date</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-black/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Guest</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Room</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Check In</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Check Out</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {(report.reservations as Array<{
                      id: string
                      guest?: { first_name: string; last_name: string }
                      room?: { number: string }
                      check_in_date: string
                      check_out_date: string
                      rate_per_night: number
                      status: string
                    }>).map((r) => {
                      const nights = nightsBetween(r.check_in_date, r.check_out_date)
                      return (
                        <tr key={r.id} className="hover:bg-black/[0.03]">
                          <td className="px-4 py-3 text-sm font-medium text-secondary">
                            {r.guest?.first_name} {r.guest?.last_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{r.room?.number}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(r.check_in_date)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(r.check_out_date)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-secondary">
                            {formatCurrency(nights * r.rate_per_night)}
                          </td>
                          <td className="px-4 py-3">
                            <ReservationStatusBadge status={r.status as import('@/types').ReservationStatus} />
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
