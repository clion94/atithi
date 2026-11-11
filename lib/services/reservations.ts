import { createClient } from '@/lib/supabase/client'
import type { Reservation, ReservationStatus } from '@/types'
import type { ReservationFormData } from '@/lib/validations/reservation'
import { todayISO } from '@/lib/utils/dates'

export async function getReservations(filter?: string): Promise<Reservation[]> {
  const supabase = createClient()
  const today = todayISO()

  let query = supabase
    .from('reservations')
    .select('*, room:rooms(*), guest:guests(*)')
    .order('check_in_date', { ascending: false })

  switch (filter) {
    case 'today':
      query = query.or(`check_in_date.eq.${today},check_out_date.eq.${today}`)
      break
    case 'arrivals':
      query = query.eq('check_in_date', today).in('status', ['confirmed'])
      break
    case 'departures':
      query = query.eq('check_out_date', today).in('status', ['checked_in'])
      break
    case 'inhouse':
      query = query.eq('status', 'checked_in')
      break
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getReservation(id: string): Promise<Reservation> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reservations')
    .select('*, room:rooms(*), guest:guests(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getGuestReservations(guestId: string): Promise<Reservation[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reservations')
    .select('*, room:rooms(*)')
    .eq('guest_id', guestId)
    .order('check_in_date', { ascending: false })
  if (error) throw error
  return data
}

export async function createReservation(
  input: ReservationFormData & { property_id: string }
): Promise<Reservation> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reservations')
    .insert({ ...input, status: 'confirmed' })
    .select('*, room:rooms(*), guest:guests(*)')
    .single()
  if (error) throw error
  return data
}

export async function walkInCheckIn(
  input: ReservationFormData & { property_id: string }
): Promise<Reservation> {
  const supabase = createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('reservations')
    .insert({ ...input, status: 'checked_in', actual_check_in: now })
    .select('*, room:rooms(*), guest:guests(*)')
    .single()
  if (error) throw error

  // Occupancy is derived from reservations; rooms.status is housekeeping state only
  // (clean/dirty/inspected/...) and has no 'occupied' value, so it is left unchanged here.
  return data
}

export async function checkIn(id: string): Promise<Reservation> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reservations')
    .update({ status: 'checked_in', actual_check_in: new Date().toISOString() })
    .eq('id', id)
    .select('*, room:rooms(*), guest:guests(*)')
    .single()
  if (error) throw error

  // Room status is housekeeping state only, so check-in leaves it unchanged.
  return data
}

export async function checkOut(id: string): Promise<Reservation> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reservations')
    .update({ status: 'checked_out', actual_check_out: new Date().toISOString() })
    .eq('id', id)
    .select('*, room:rooms(*), guest:guests(*)')
    .single()
  if (error) throw error

  // Mark room as dirty on checkout
  await supabase.from('rooms').update({ status: 'dirty' }).eq('id', data.room_id)

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
    .select('*, room:rooms(*), guest:guests(*)')
    .single()
  if (error) throw error
  return data
}

export async function getDashboardStats(propertyId: string) {
  const supabase = createClient()
  const today = todayISO()

  const [rooms, arrivals, departures, inhouse] = await Promise.all([
    supabase.from('rooms').select('id, status'),
    supabase
      .from('reservations')
      .select('*, room:rooms(*), guest:guests(*)')
      .eq('check_in_date', today)
      .eq('status', 'confirmed'),
    supabase
      .from('reservations')
      .select('*, room:rooms(*), guest:guests(*)')
      .eq('check_out_date', today)
      .eq('status', 'checked_in'),
    supabase.from('reservations').select('id').eq('status', 'checked_in'),
  ])

  if (rooms.error) throw rooms.error

  const totalRooms = rooms.data?.length ?? 0
  const occupied = inhouse.data?.length ?? 0
  const available = totalRooms - occupied

  return {
    occupied,
    available,
    checkins_today: arrivals.data?.length ?? 0,
    checkouts_today: departures.data?.length ?? 0,
    arrivals: arrivals.data ?? [],
    departures: departures.data ?? [],
  }
}

export async function getDailyReport(date: string) {
  const supabase = createClient()

  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('*, room:rooms(*), guest:guests(*)')
    .or(`check_in_date.eq.${date},check_out_date.eq.${date},and(check_in_date.lte.${date},check_out_date.gt.${date})`)
    .in('status', ['confirmed', 'checked_in', 'checked_out'])

  if (error) throw error

  const inhouse = reservations?.filter(
    (r) => r.check_in_date <= date && r.check_out_date > date
  ) ?? []
  const arrivals = reservations?.filter((r) => r.check_in_date === date) ?? []
  const departures = reservations?.filter((r) => r.check_out_date === date) ?? []

  const revenue = inhouse.reduce((sum, r) => sum + Number(r.rate_per_night), 0)
  const adr = inhouse.length > 0 ? revenue / inhouse.length : 0

  const { data: rooms } = await supabase.from('rooms').select('id')
  const totalRooms = rooms?.length ?? 1

  return {
    date,
    occupancy: Math.round((inhouse.length / totalRooms) * 100),
    rooms_sold: inhouse.length,
    revenue,
    adr,
    arrivals_count: arrivals.length,
    departures_count: departures.length,
    inhouse_count: inhouse.length,
    reservations,
  }
}
