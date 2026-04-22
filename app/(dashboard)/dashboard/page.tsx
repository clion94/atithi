'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { ReservationStatusBadge } from '@/components/ui/Badge'
import { getDashboardStats } from '@/lib/services/reservations'
import { formatDate } from '@/lib/utils/dates'
import type { DashboardStats } from '@/types'

export default function DashboardPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getDashboardStats('')
      .then(setStats)
      .catch((e: { message: string }) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-error">
        <p>{t('common.error')}: {error}</p>
      </div>
    )
  }

  const totalRooms = (stats?.occupied ?? 0) + (stats?.available ?? 0)
  const occupancyRate = totalRooms > 0
    ? Math.round(((stats?.occupied ?? 0) / totalRooms) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-secondary">
          {t('nav.dashboard')}
        </h1>
        <Link href="/reservations/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            {t('actions.newReservation')}
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label={t('dashboard.occupied')}
          value={stats?.occupied ?? 0}
          icon="occupancy"
          sub={`${occupancyRate}% ${t('dashboard.occupancyRate').toLowerCase()}`}
        />
        <StatCard
          label={t('dashboard.available')}
          value={stats?.available ?? 0}
          icon="rooms"
          sub={`of ${totalRooms} total rooms`}
        />
        <StatCard
          label={t('dashboard.arrivalsToday')}
          value={stats?.checkins_today ?? 0}
          icon="checkin"
        />
        <StatCard
          label={t('dashboard.departuresToday')}
          value={stats?.checkouts_today ?? 0}
          icon="checkout"
        />
      </div>

      {/* Today lists */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-secondary">{t('dashboard.todayArrivals')}</h2>
            <Link href="/reservations?filter=arrivals" className="text-xs text-primary hover:underline">
              {t('actions.viewAll')}
            </Link>
          </div>
          {(stats?.arrivals.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">{t('common.noResults')}</p>
          ) : (
            <div className="space-y-3">
              {stats?.arrivals.slice(0, 5).map((r) => (
                <Link key={r.id} href={`/reservations/${r.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-secondary">
                        {r.guest?.first_name} {r.guest?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">Room {r.room?.number}</p>
                    </div>
                    <div className="text-right">
                      <ReservationStatusBadge status={r.status} />
                      <p className="text-xs text-gray-400 mt-1">{formatDate(r.check_in_date)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-secondary">{t('dashboard.todayDepartures')}</h2>
            <Link href="/reservations?filter=departures" className="text-xs text-primary hover:underline">
              {t('actions.viewAll')}
            </Link>
          </div>
          {(stats?.departures.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">{t('common.noResults')}</p>
          ) : (
            <div className="space-y-3">
              {stats?.departures.slice(0, 5).map((r) => (
                <Link key={r.id} href={`/reservations/${r.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-secondary">
                        {r.guest?.first_name} {r.guest?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">Room {r.room?.number}</p>
                    </div>
                    <div className="text-right">
                      <ReservationStatusBadge status={r.status} />
                      <p className="text-xs text-gray-400 mt-1">{formatDate(r.check_out_date)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="font-semibold text-secondary mb-4">{t('dashboard.quickActions')}</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/reservations/walkin">
            <Button variant="primary">
              <Image src="/filled/checkin.svg" alt="" width={16} height={16} />
              Walk-in Check-in
            </Button>
          </Link>
          <Link href="/reservations/new">
            <Button variant="outline">
              <Plus className="h-4 w-4" />
              {t('reservation.new')}
            </Button>
          </Link>
          <Link href="/rooms">
            <Button variant="outline">
              {t('nav.rooms')}
            </Button>
          </Link>
          <Link href="/housekeeping">
            <Button variant="outline">{t('nav.housekeeping')}</Button>
          </Link>
          <Link href="/reports">
            <Button variant="outline">{t('nav.reports')}</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  sub,
}: {
  label: string
  value: number
  icon: string
  sub?: string
}) {
  return (
    <Card padding="sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-secondary mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className="p-2 bg-amber-50 rounded-lg">
          <Image src={`/duotone/${icon}.svg`} alt="" width={28} height={28} />
        </div>
      </div>
    </Card>
  )
}
