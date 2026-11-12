'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCalendar } from '@/hooks/useCalendar'
import { usePropertyToday } from '@/hooks/usePropertyToday'
import Button from '@/components/ui/Button'
import ErrorState from '@/components/ui/ErrorState'
import Spinner from '@/components/ui/Spinner'
import {
  CALENDAR_DAYS,
  dateRange,
  dayLabel,
  occupancyByDay,
  stayBar,
  type StayBar,
} from '@/lib/utils/calendar'
import { addDaysISO, formatDate } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import type { RoomStatus, ReservationStatus } from '@/types'

const STATUS_DOT: Record<RoomStatus, string> = {
  clean: 'bg-success',
  dirty: 'bg-warning',
  inspected: 'bg-blue-500',
  out_of_order: 'bg-error',
  do_not_disturb: 'bg-gray-400',
}

// Same hues as the reservation status badges, so colors mean the same thing everywhere.
const BAR_STYLE: Record<ReservationStatus, string> = {
  confirmed: 'bg-blue-100 text-blue-800 ring-blue-300',
  checked_in: 'bg-green-100 text-green-800 ring-green-300',
  checked_out: 'bg-gray-100 text-gray-500 ring-gray-200',
  cancelled: 'bg-gray-100 text-gray-400 ring-gray-200',
  no_show: 'bg-gray-100 text-gray-400 ring-gray-200',
}

const ROW_HEIGHT = 52
const HEADER_HEIGHT = 64
const STEP_DAYS = 7

export default function CalendarPage() {
  const { t, i18n } = useTranslation()
  const today = usePropertyToday()
  const [offset, setOffset] = useState(0)
  const start = today ? addDaysISO(today, offset) : undefined
  const { data, isPending, error, refetch } = useCalendar(start)

  const locale = i18n.language === 'en' ? 'en-US' : `${i18n.language}-IN`
  const days = start ? dateRange(start) : []
  const lastDay = start ? addDaysISO(start, CALENDAR_DAYS - 1) : undefined

  const rooms = data?.rooms ?? []
  const stays = data?.stays ?? []
  const occupancy = start && today ? occupancyByDay(stays, start, today) : []
  const sellable = rooms.filter((r) => r.status !== 'out_of_order').length

  const barsByRoom = new Map<string, { stay: (typeof stays)[number]; bar: StayBar }[]>()
  if (start && today) {
    for (const stay of stays) {
      const bar = stayBar(stay, start, today)
      if (!bar) continue
      const list = barsByRoom.get(stay.room_id) ?? []
      list.push({ stay, bar })
      barsByRoom.set(stay.room_id, list)
    }
  }

  const legend: { label: string; className: string }[] = [
    { label: t('reservation.status.confirmed'), className: BAR_STYLE.confirmed },
    { label: t('reservation.status.checked_in'), className: BAR_STYLE.checked_in },
    { label: t('reservation.status.checked_out'), className: BAR_STYLE.checked_out },
    { label: t('calendar.overdue'), className: 'bg-red-100 text-red-800 ring-red-400' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] md:text-[34px] leading-tight font-bold tracking-tight text-secondary">
            {t('calendar.title')}
          </h1>
          {start && lastDay && (
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(start)} – {formatDate(lastDay)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setOffset((o) => o - STEP_DAYS)} aria-label={t('calendar.previous')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOffset(0)} disabled={offset === 0}>
            {t('filters.today')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOffset((o) => o + STEP_DAYS)} aria-label={t('calendar.next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600">
        {legend.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1.5">
            <span className={cn('h-3 w-5 rounded ring-1', l.className)} />
            {l.label}
          </span>
        ))}
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : isPending || !start || !today ? (
        <div className="flex items-center justify-center h-48">
          <Spinner size="lg" />
        </div>
      ) : rooms.length === 0 ? (
        <p className="text-center py-12 text-gray-400">{t('common.noResults')}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-card ring-1 ring-black/5">
          <div
            className="grid min-w-[960px]"
            style={{
              gridTemplateColumns: `116px repeat(${CALENDAR_DAYS}, minmax(56px, 1fr))`,
              gridTemplateRows: `${HEADER_HEIGHT}px`,
              gridAutoRows: `${ROW_HEIGHT}px`,
            }}
          >
            {/* Header */}
            <div
              className="sticky left-0 z-20 flex items-end bg-white px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500 border-b border-black/5"
              style={{ gridRow: 1, gridColumn: 1 }}
            >
              {t('nav.rooms')}
            </div>
            {days.map((d, i) => {
              const label = dayLabel(d, locale)
              return (
                <div
                  key={d}
                  style={{ gridRow: 1, gridColumn: i + 2 }}
                  className={cn(
                    'flex flex-col items-center justify-end gap-0.5 border-b border-l border-black/5 pb-1.5 text-center',
                    d === today && 'bg-primary/10',
                    label.isWeekend && d !== today && 'bg-black/[0.02]'
                  )}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label.weekday}</span>
                  <span className={cn('text-base font-bold', d === today ? 'text-primary' : 'text-secondary')}>{label.day}</span>
                  <span className="text-[10px] tabular-nums text-gray-400" title={t('calendar.occupied', { count: occupancy[i] })}>
                    {occupancy[i]}/{sellable}
                  </span>
                </div>
              )
            })}

            {/* Room rows */}
            {rooms.map((room, r) => {
              const row = r + 2
              const outOfOrder = room.status === 'out_of_order'
              return (
                <Fragment key={room.id}>
                  <div
                    className="sticky left-0 z-20 flex items-center gap-2 bg-white px-3 border-b border-black/5"
                    style={{ gridRow: row, gridColumn: 1 }}
                  >
                    <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', STATUS_DOT[room.status])} title={t(`room.status.${room.status}`)} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-secondary leading-tight">{room.number}</p>
                      <p className="truncate text-[11px] text-gray-400 leading-tight">{t(`room.type_options.${room.room_type}`)}</p>
                    </div>
                  </div>

                  {days.map((d, i) => {
                    const bookable = d >= today && !outOfOrder
                    const cellClass = cn(
                      'border-b border-l border-black/5',
                      d === today && 'bg-primary/5',
                      outOfOrder && 'bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,rgb(0_0_0/0.05)_6px,rgb(0_0_0/0.05)_12px)]'
                    )
                    return bookable ? (
                      <Link
                        key={d}
                        href={`/reservations/new?room=${room.id}&checkIn=${d}`}
                        style={{ gridRow: row, gridColumn: i + 2 }}
                        className={cn(cellClass, 'hover:bg-primary/10 focus-visible:bg-primary/10 focus-visible:outline-none')}
                        aria-label={t('calendar.bookRoom', { room: room.number, date: formatDate(d) })}
                      />
                    ) : (
                      <div key={d} style={{ gridRow: row, gridColumn: i + 2 }} className={cellClass} />
                    )
                  })}

                  {(barsByRoom.get(room.id) ?? []).map(({ stay, bar }) => {
                    const name = stay.guest ? `${stay.guest.last_name}, ${stay.guest.first_name.charAt(0)}.` : '—'
                    const full = stay.guest ? `${stay.guest.first_name} ${stay.guest.last_name}` : ''
                    return (
                      <Link
                        key={stay.id}
                        href={`/reservations/${stay.id}`}
                        style={{ gridRow: row, gridColumn: `${bar.startCol + 2} / span ${bar.span}` }}
                        title={`${full} · ${formatDate(stay.check_in_date)} → ${formatDate(stay.check_out_date)}${bar.overdue ? ` · ${t('calendar.overdue')}` : ''}`}
                        className={cn(
                          'z-10 my-2 mx-0.5 flex items-center truncate px-2 text-xs font-semibold ring-1 transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2',
                          bar.overdue ? 'bg-red-100 text-red-800 ring-red-400' : BAR_STYLE[stay.status],
                          bar.clippedStart ? 'rounded-l-none' : 'rounded-l-lg',
                          bar.clippedEnd ? 'rounded-r-none' : 'rounded-r-lg'
                        )}
                      >
                        <span className="truncate">{name}</span>
                      </Link>
                    )
                  })}
                </Fragment>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
