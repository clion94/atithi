import { createClient } from '@/lib/supabase/client'
import type { Guest } from '@/types'
import type { GuestFormData } from '@/lib/validations/guest'
import { toError } from '@/lib/utils/errors'
import { sanitizeSearch } from '@/lib/utils/search'

export const GUEST_PAGE_SIZE = 50

export interface GuestPage {
  rows: Guest[]
  hasMore: boolean
}

export async function getGuests(search?: string, page = 0): Promise<GuestPage> {
  const supabase = createClient()
  let query = supabase
    .from('guests')
    .select('*')
    .order('last_name')
    .order('first_name')
    .range(page * GUEST_PAGE_SIZE, page * GUEST_PAGE_SIZE + GUEST_PAGE_SIZE) // +1 row to detect a next page

  const term = sanitizeSearch(search)
  if (term) {
    query = query.or(`last_name.ilike.%${term}%,first_name.ilike.%${term}%,phone.ilike.%${term}%`)
  }

  const { data, error } = await query
  if (error) throw toError(error)
  return { rows: data.slice(0, GUEST_PAGE_SIZE), hasMore: data.length > GUEST_PAGE_SIZE }
}

export async function getGuest(id: string): Promise<Guest> {
  const supabase = createClient()
  const { data, error } = await supabase.from('guests').select('*').eq('id', id).single()
  if (error) throw toError(error)
  return data
}

export async function createGuest(input: GuestFormData & { property_id: string }): Promise<Guest> {
  const supabase = createClient()
  const { data, error } = await supabase.from('guests').insert(input).select().single()
  if (error) throw toError(error)
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
  if (error) throw toError(error)
  return data
}

// Only owners and managers may ban; the database enforces it.
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
  if (error) throw toError(error)
  return data
}
