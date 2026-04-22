'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'
import { Plus, Search, CalendarDays } from 'lucide-react'
import { getReservations } from '@/lib/services/reservations'
import { ReservationStatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { formatDate, nightsBetween } from '@/lib/utils/dates'
import { formatCurrency } from '@/lib/utils/currency'
import type { Reservation } from '@/types'
import { cn } from '@/lib/utils/cn'

type FilterType = 'all' | 'today' | 'arrivals' | 'departures' | 'inhouse'

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'arrivals', label: 'Arrivals' },
  { key: 'departures', label: 'Departures' },
  { key: 'inhouse', label: 'In-House' },
]

export default function ReservationsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const searchParams = useSearchParams()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>(
    (searchParams.get('filter') as FilterType) ?? 'all'
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getReservations(filter === 'all' ? undefined : filter)
      setReservations(data)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [filter, toast])

  useEffect(() => { load() }, [load])

  const filtered = search
    ? reservations.filter((r) => {
        const name = `${r.guest?.first_name} ${r.guest?.last_name}`.toLowerCase()
        return name.includes(search.toLowerCase())
      })
    : reservations

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-secondary">{t('nav.reservations')}</h1>
        <div className="flex items-center gap-2">
          <Link href="/reservations/walkin">
            <Button size="sm" variant="outline">
              <Image src="/outline/checkin.svg" alt="" width={16} height={16} />
              Walk-in
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
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filter === key
                ? 'bg-secondary text-white'
                : 'bg-white border border-gray-200 text-secondary hover:bg-gray-50'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          placeholder={`${t('actions.search')} by guest name...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>{t('common.noResults')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Guest</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Room</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Check In</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Check Out</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Nights</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => {
                  const nights = nightsBetween(r.check_in_date, r.check_out_date)
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => window.location.href = `/reservations/${r.id}`}
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
          <div className="md:hidden divide-y divide-gray-100">
            {filtered.map((r) => {
              const nights = nightsBetween(r.check_in_date, r.check_out_date)
              return (
                <Link key={r.id} href={`/reservations/${r.id}`}>
                  <div className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-secondary">
                          {r.guest?.first_name} {r.guest?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">Room {r.room?.number} · {nights} nights</p>
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
        </div>
      )}
    </div>
  )
}
