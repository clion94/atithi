import type { Reservation, ReservationStatus, RoomStatus } from '@/types'

type RoomLike = { status: RoomStatus | string }
type StayLike = Pick<Reservation, 'check_in_date' | 'check_out_date' | 'status' | 'rate_per_night'>

/**
 * Rooms that can actually be sold: out-of-order rooms are excluded from
 * availability and from the occupancy denominator.
 */
export function computeAvailability(rooms: RoomLike[], inHouse: number) {
  const sellable = rooms.filter((r) => r.status !== 'out_of_order').length
  return {
    sellable,
    occupied: inHouse,
    available: Math.max(sellable - inHouse, 0),
  }
}

const SETTLED: ReservationStatus[] = ['checked_in', 'checked_out']

/**
 * Does this reservation count as a real stay on `date`?
 * - checked in / checked out always count;
 * - confirmed counts only for today and later (a past date that still says
 *   "confirmed" never arrived, so it must not inflate occupancy or revenue);
 * - cancelled and no-show never count.
 */
export function countsOn(r: Pick<StayLike, 'status'>, date: string, today: string): boolean {
  if (SETTLED.includes(r.status)) return true
  return r.status === 'confirmed' && date >= today
}

export function computeDailyReport<T extends StayLike>(
  date: string,
  today: string,
  reservations: T[],
  totalRooms: number
) {
  const counted = reservations.filter((r) => countsOn(r, date, today))

  const inhouse = counted.filter((r) => r.check_in_date <= date && r.check_out_date > date)
  const arrivals = counted.filter((r) => r.check_in_date === date)
  const departures = counted.filter(
    (r) => r.check_out_date === date && SETTLED.includes(r.status)
  )

  const revenue = inhouse.reduce((sum, r) => sum + Number(r.rate_per_night), 0)

  return {
    date,
    occupancy: totalRooms > 0 ? Math.round((inhouse.length / totalRooms) * 100) : 0,
    rooms_sold: inhouse.length,
    revenue,
    adr: inhouse.length > 0 ? revenue / inhouse.length : 0,
    arrivals_count: arrivals.length,
    departures_count: departures.length,
    inhouse_count: inhouse.length,
    reservations: counted,
  }
}
