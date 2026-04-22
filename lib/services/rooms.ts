import { createClient } from '@/lib/supabase/client'
import type { Room, RoomStatus } from '@/types'
import type { RoomFormData } from '@/lib/validations/room'

export async function getRooms(): Promise<Room[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('number')
  if (error) throw error
  return data
}

export async function getRoom(id: string): Promise<Room> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getAvailableRooms(checkIn: string, checkOut: string): Promise<Room[]> {
  const supabase = createClient()

  // Get rooms that have conflicting reservations
  const { data: conflicts, error: conflictError } = await supabase
    .from('reservations')
    .select('room_id')
    .in('status', ['confirmed', 'checked_in'])
    .lt('check_in_date', checkOut)
    .gt('check_out_date', checkIn)

  if (conflictError) throw conflictError

  const unavailableIds = conflicts?.map((r) => r.room_id) ?? []

  const query = supabase
    .from('rooms')
    .select('*')
    .not('status', 'eq', 'out_of_order')
    .order('number')

  if (unavailableIds.length > 0) {
    query.not('id', 'in', `(${unavailableIds.join(',')})`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

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
  if (error) throw error

  // Log the change
  await supabase.from('housekeeping_log').insert({
    room_id: id,
    property_id: data.property_id,
    new_status: status,
    notes,
  })

  return data
}

export async function createRoom(input: RoomFormData & { property_id: string }): Promise<Room> {
  const supabase = createClient()
  const { data, error } = await supabase.from('rooms').insert(input).select().single()
  if (error) throw error
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
  if (error) throw error
  return data
}
