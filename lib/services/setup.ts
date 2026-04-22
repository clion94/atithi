import { createClient } from '@/lib/supabase/client'
import type { Property } from '@/types'

export async function createPropertyForUser(input: {
  name: string
  timezone: string
  check_in_time: string
  check_out_time: string
  full_name?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zip?: string
}): Promise<Property> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('create_property_for_user', {
    p_name:           input.name,
    p_timezone:       input.timezone,
    p_check_in_time:  input.check_in_time,
    p_check_out_time: input.check_out_time,
    p_full_name:      input.full_name ?? null,
    p_phone:          input.phone ?? null,
    p_email:          input.email ?? null,
    p_address:        input.address ?? null,
    p_city:           input.city ?? null,
    p_state:          input.state ?? null,
    p_zip:            input.zip ?? null,
  })
  if (error) throw error
  // rpc returns setof → array
  const property = Array.isArray(data) ? data[0] : data
  if (!property) throw new Error('Property creation failed')
  return property as Property
}
