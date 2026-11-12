'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'
import { Plus, CalendarDays } from 'lucide-react'
import type { ReservationFilter } from '@/lib/services/reservations'
import { useReservations } from '@/hooks/useReservations'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import ErrorState from '@/components/ui/ErrorState'
import { ReservationStatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import { formatDate, nightsBetween } from '@/lib/utils/dates'
import { formatCurrency } from '@/lib/utils/currency'
import { cn } from '@/lib/utils/cn'

const FILTER_KEYS: ReservationFilter[] = ['all', 'today', 'arrivals', 'departures', 'inhouse']

function parseFilter(value: string | null): ReservationFilter {
  return FILTER_KEYS.includes(value as ReservationFilter) ? (value as ReservationFilter) : 'all'
}

export default function ReservationsPage() {
  // useSearchParams needs a Suspense boundary for the page to build/prerender.
  return (
    <Suspense fallback={null}>
      <ReservationsList />
    </Suspense>
  )
}

function ReservationsList() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ReservationFilter>(parseFilter(searchParams.get('filter')))
  const debouncedSearch = useDebouncedValue(search)

  const { data, isPending, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useReservations(filter, debouncedSearch)
  const filtered = data?.pages.flatMap((p) => p.rows) ?? []
  const loading = isPending

  const FILTERS: { key: ReservationFilter; label: string }[] = [
    { key: 'all', label: t('filters.all') },
    { key: 'today', label: t('filters.today') },
    { key: 'arrivals', label: t('filters.arrivals') },
    { key: 'departures', label: t('filters.departures') },
    { key: 'inhouse', label: t('filters.inhouse') },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[28px] md:text-[34px] leading-tight font-bold tracking-tight text-secondary">{t('nav.reservations')}</h1>
        <div className="flex items-center gap-2">
          <Link href="/reservations/walkin">
            <Button size="sm" variant="outline">
              <Image src="/outline/checkin.svg" alt="" width={16} height={16} />
              {t('reservation.walkIn')}
            </Button>
          </Link>
          <Link href="/reservations/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              {t('reservation.new')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ key, label }) => (
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

      {/* Search */}
      <div className="max-w-sm">
        <Input
          placeholder={t('reservation.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : loading ? (
        <div className="flex items-center justify-center h-48">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>{t('common.noResults')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card ring-1 ring-black/5 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-black/5">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('reservation.guest')}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('reservation.room')}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('reservation.checkIn')}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('reservation.checkOut')}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('reservation.nights')}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('reservation.total')}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('reservation.status.label')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.map((r) => {
                  const nights = nightsBetween(r.check_in_date, r.check_out_date)
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-black/[0.03] cursor-pointer transition-colors"
                      onClick={() => router.push(`/reservations/${r.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-sm text-secondary">
                            {r.guest?.first_name} {r.guest?.last_name}
                          </p>
                          <p className="text-xs text-gray-400">{r.guest?.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-secondary font-medium">{r.room?.number}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(r.check_in_date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(r.check_out_date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{nights}</td>
                      <td className="px-4 py-3 text-sm font-medium text-secondary">
                        {formatCurrency(nights * r.rate_per_night)}
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

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-black/5">
            {filtered.map((r) => {
              const nights = nightsBetween(r.check_in_date, r.check_out_date)
              return (
                <Link key={r.id} href={`/reservations/${r.id}`}>
                  <div className="p-4 hover:bg-black/[0.03] transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-secondary">
                          {r.guest?.first_name} {r.guest?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{t('reservation.room')} {r.room?.number} · {t('reservation.nightsCount', { count: nights })}</p>
                      </div>
                      <ReservationStatusBadge status={r.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{formatDate(r.check_in_date)} → {formatDate(r.check_out_date)}</span>
                      <span className="font-medium text-secondary">
                        {formatCurrency(nights * r.rate_per_night)}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
          {hasNextPage && (
            <div className="p-3 border-t border-black/5 text-center">
              <Button variant="ghost" size="sm" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
                {t('actions.loadMore')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
