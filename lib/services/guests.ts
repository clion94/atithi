import { createClient } from '@/lib/supabase/client'
import type { Guest } from '@/types'
import type { GuestFormData } from '@/lib/validations/guest'

export async function getGuests(search?: string): Promise<Guest[]> {
  const supabase = createClient()
  let query = supabase.from('guests').select('*').order('last_name').order('first_name')

  if (search) {
    query = query.or(`last_name.ilike.%${search}%,first_name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getGuest(id: string): Promise<Guest> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createGuest(input: GuestFormData & { property_id: string }): Promise<Guest> {
  const supabase = createClient()
  const { data, error } = await supabase.from('guests').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateGuest(id: string, input: Partial<GuestFormData>): Promise<Guest> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('guests')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function setBanStatus(
  id: string,
  isBanned: boolean,
  banReason?: string
): Promise<Guest> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('guests')
    .update({ is_banned: isBanned, ban_reason: isBanned ? banReason : null })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
