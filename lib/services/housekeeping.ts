import { createClient } from '@/lib/supabase/client'
import type { HousekeepingLog, RoomStatus } from '@/types'

export async function getHousekeepingLog(roomId?: string): Promise<HousekeepingLog[]> {
  const supabase = createClient()
  let query = supabase
    .from('housekeeping_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (roomId) {
    query = query.eq('room_id', roomId)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function logStatusChange(
  roomId: string,
  propertyId: string,
  oldStatus: RoomStatus,
  newStatus: RoomStatus,
  notes?: string
): Promise<void> {
  const supabase = createClient()
  await supabase.from('housekeeping_log').insert({
    room_id: roomId,
    property_id: propertyId,
    old_status: oldStatus,
    new_status: newStatus,
    notes,
  })
}
