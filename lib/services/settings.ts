import { createClient } from '@/lib/supabase/client'
import { toError } from '@/lib/utils/errors'
import type { Property, Profile } from '@/types'

export async function updateProperty(
  id: string,
  input: Partial<Pick<Property, 'name' | 'address' | 'city' | 'state' | 'zip' | 'phone' | 'email' | 'timezone' | 'check_in_time' | 'check_out_time'>>
): Promise<Property> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('properties')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw toError(error)
  return data
}

export async function updateProfile(
  id: string,
  input: Partial<Pick<Profile, 'full_name' | 'language'>>
): Promise<Profile> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw toError(error)
  return data
}
