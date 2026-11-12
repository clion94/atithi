import { createClient } from '@/lib/supabase/client'
import type { ActivityLogEntry, Profile } from '@/types'
import { toError } from '@/lib/utils/errors'

// Both tables are readable by owners and managers only (row level security).

export async function getTeam(): Promise<Profile[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('active', { ascending: false })
    .order('created_at')
  if (error) throw toError(error)
  return data
}

export async function getActivity(limit = 100): Promise<ActivityLogEntry[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('activity_log')
    .select('*, actor:profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw toError(error)
  return data as unknown as ActivityLogEntry[]
}
