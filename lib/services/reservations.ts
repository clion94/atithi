import { createClient } from '@/lib/supabase/client'
import type { Reservation, ReservationStatus } from '@/types'
import type { ReservationFormData } from '@/lib/validations/reservation'
import { toError } from '@/lib/utils/errors'
import { sanitizeSearch } from '@/lib/utils/search'
import { normalizePlate } from '@/lib/utils/plate'
import { computeAvailability, computeDailyReport } from '@/lib/utils/stats'

export const PAGE_SIZE = 50

export type ReservationFilter = 'all' | 'today' | 'arrivals' | 'departures' | 'inhouse'

const WITH_RELATIONS = '*, room:rooms(*), guest:guests(*)'

export interface ReservationPage {
  rows: Reservation[]
  hasMore: boolean
}

/**
 * One page of reservations, newest check-in first.
 * `today` must be the property's local date (see usePropertyToday).
 * Guest-name search is resolved server-side so it covers every reservation,
 * not just the page that happens to be loaded.
 */
export async function getReservations(opts: {
  filter?: ReservationFilter
  search?: string
  today: string
  page?: number
}): Promise<ReservationPage> {
  const supabase = createClient()
  const { filter = 'all', today, page = 0 } = opts

  let guestIds: string[] | undefined
  const term = sanitizeSearch(opts.search)
  if (term) {
    const { data: guests, error } = await supabase
      .from('guests')
      .select('id')
      .or(`last_name.ilike.%${term}%,first_name.ilike.%${term}%,phone.ilike.%${term}%`)
      .limit(200)
    if (error) throw toError(error)
    guestIds = guests.map((g) => g.id)
    if (guestIds.length === 0) return { rows: [], hasMore: false }
  }

  let query = supabase
    .from('reservations')
    .select(WITH_RELATIONS)
    .order('check_in_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE) // one extra row tells us if there is a next page

  switch (filter) {
    case 'today':
      query = query.or(`check_in_date.eq.${today},check_out_date.eq.${today}`)
      break
    case 'arrivals':
      query = query.eq('check_in_date', today).eq('status', 'confirmed')
      break
    case 'departures':
      query = query.eq('check_out_date', today).eq('status', 'checked_in')
      break
    case 'inhouse':
      query = query.eq('status', 'checked_in')
      break
  }
  if (guestIds) query = query.in('guest_id', guestIds)

  const { data, error } = await query
  if (error) throw toError(error)
  return { rows: data.slice(0, PAGE_SIZE), hasMore: data.length > PAGE_SIZE }
}

export async function getReservation(id: string): Promise<Reservation> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reservations')
    .select(WITH_RELATIONS)
    .eq('id', id)
    .single()
  if (error) throw toError(error)
  return data
}

export async function getGuestReservations(guestId: string): Promise<Reservation[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reservations')
    .select('*, room:rooms(*)')
    .eq('guest_id', guestId)
    .order('check_in_date', { ascending: false })
  if (error) throw toError(error)
  return data
}

// The database enforces the booking rules (no double booking, no banned guests,
// no out-of-order rooms, valid status changes) and sets check-in/out times, so
// these are plain single-statement writes and are atomic.

export async function createReservation(
  input: ReservationFormData & { property_id: string }
): Promise<Reservation> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reservations')
    .insert({ ...input, vehicle_plate: normalizePlate(input.vehicle_plate), status: 'confirmed' })
    .select(WITH_RELATIONS)
    .single()
  if (error) throw toError(error)
  return data
}

export async function walkInCheckIn(
  input: ReservationFormData & { property_id: string }
): Promise<Reservation> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reservations')
    .insert({ ...input, vehicle_plate: normalizePlate(input.vehicle_plate), status: 'checked_in' })
    .select(WITH_RELATIONS)
    .single()
  if (error) throw toError(error)
  return data
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus
): Promise<Reservation> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', id)
    .select(WITH_RELATIONS)
    .single()
  if (error) throw toError(error)
  return data
}

export async function updateVehiclePlate(id: string, plate: string): Promise<Reservation> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reservations')
    .update({ vehicle_plate: normalizePlate(plate) })
    .eq('id', id)
    .select(WITH_RELATIONS)
    .single()
  if (error) throw toError(error)
  return data
}

export const checkIn = (id: string) => updateReservationStatus(id, 'checked_in')
// The database marks the room dirty in the same transaction.
export const checkOut = (id: string) => updateReservationStatus(id, 'checked_out')
export const cancelReservation = (id: string) => updateReservationStatus(id, 'cancelled')
export const markNoShow = (id: string) => updateReservationStatus(id, 'no_show')

export async function getDashboardStats(today: string) {
  const supabase = createClient()

  const [rooms, arrivals, departures, inhouse] = await Promise.all([
    supabase.from('rooms').select('id, status'),
    supabase
      .from('reservations')
      .select(WITH_RELATIONS)
      .eq('check_in_date', today)
      .eq('status', 'confirmed'),
    supabase
      .from('reservations')
      .select(WITH_RELATIONS)
      .eq('check_out_date', today)
      .eq('status', 'checked_in'),
    supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('status', 'checked_in'),
  ])

  // Previously only `rooms` was checked, so a failed arrivals/departures query
  // silently showed zeros on the dashboard.
  for (const res of [rooms, arrivals, departures, inhouse]) {
    if (res.error) throw toError(res.error)
  }

  const { sellable, occupied, available } = computeAvailability(rooms.data ?? [], inhouse.count ?? 0)

  return {
    occupied,
    available,
    total_rooms: sellable,
    checkins_today: arrivals.data?.length ?? 0,
    checkouts_today: departures.data?.length ?? 0,
    arrivals: arrivals.data ?? [],
    departures: departures.data ?? [],
  }
}

export async function getDailyReport(date: string, today: string) {
  const supabase = createClient()

  const [reservations, rooms] = await Promise.all([
    supabase
      .from('reservations')
      .select(WITH_RELATIONS)
      .or(
        `check_in_date.eq.${date},check_out_date.eq.${date},and(check_in_date.lte.${date},check_out_date.gt.${date})`
      )
      .in('status', ['confirmed', 'checked_in', 'checked_out']),
    supabase.from('rooms').select('id', { count: 'exact', head: true }),
  ])
  if (reservations.error) throw toError(reservations.error)
  if (rooms.error) throw toError(rooms.error)

  return computeDailyReport(date, today, reservations.data as Reservation[], rooms.count ?? 0)
}
