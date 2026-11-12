import { createClient } from '@/lib/supabase/client'
import type { HousekeepingLog } from '@/types'
import { toError } from '@/lib/utils/errors'

// Read-only: rows are written by a database trigger whenever a room's status or
// notes change (see migration 003), so the log cannot be forged or skipped.
export async function getHousekeepingLog(roomId?: string): Promise<HousekeepingLog[]> {
  const supabase = createClient()
  let query = supabase
    .from('housekeeping_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (roomId) query = query.eq('room_id', roomId)

  const { data, error } = await query
  if (error) throw toError(error)
  return data
}
