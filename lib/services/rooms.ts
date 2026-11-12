import { createClient } from '@/lib/supabase/client'
import type { Room, RoomStatus } from '@/types'
import type { RoomFormData } from '@/lib/validations/room'
import { toError } from '@/lib/utils/errors'

export async function getRooms(): Promise<Room[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('rooms').select('*').order('number')
  if (error) throw toError(error)
  return data
}

export async function getRoom(id: string): Promise<Room> {
  const supabase = createClient()
  const { data, error } = await supabase.from('rooms').select('*').eq('id', id).single()
  if (error) throw toError(error)
  return data
}

/**
 * Rooms that can be booked for [checkIn, checkOut). This is a convenience for
 * the picker only: the database's exclusion constraint is what actually
 * prevents two clerks booking the same room at the same moment.
 */
export async function getAvailableRooms(checkIn: string, checkOut: string): Promise<Room[]> {
  const supabase = createClient()

  const { data: conflicts, error: conflictError } = await supabase
    .from('reservations')
    .select('room_id')
    .in('status', ['confirmed', 'checked_in'])
    .lt('check_in_date', checkOut)
    .gt('check_out_date', checkIn)
  if (conflictError) throw toError(conflictError)

  let query = supabase
    .from('rooms')
    .select('*')
    .neq('status', 'out_of_order')
    .order('number')

  const unavailableIds = conflicts.map((r) => r.room_id)
  if (unavailableIds.length > 0) {
    query = query.not('id', 'in', `(${unavailableIds.join(',')})`)
  }

  const { data, error } = await query
  if (error) throw toError(error)
  return data
}

// A database trigger writes the housekeeping_log row (with who and when) in the
// same transaction as the status change, so the app no longer logs separately.
export async function updateRoomStatus(
  id: string,
  status: RoomStatus,
  notes?: string
): Promise<Room> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rooms')
    .update({ status, notes: notes ?? null })
    .eq('id', id)
    .select()
    .single()
  if (error) throw toError(error)
  return data
}

export async function createRoom(input: RoomFormData & { property_id: string }): Promise<Room> {
  const supabase = createClient()
  const { data, error } = await supabase.from('rooms').insert(input).select().single()
  if (error) throw toError(error)
  return data
}

export async function updateRoom(id: string, input: Partial<RoomFormData>): Promise<Room> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rooms')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw toError(error)
  return data
}
