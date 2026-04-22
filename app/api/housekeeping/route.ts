import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('housekeeping_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data)
  } catch (e: unknown) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('property_id, id')
      .eq('id', user.id)
      .single()

    if (!profile?.property_id) {
      return Response.json({ error: 'No property associated with user' }, { status: 400 })
    }

    const body = await request.json()
    const { room_id, new_status, old_status, notes } = body

    // Update room status
    await supabase.from('rooms').update({ status: new_status }).eq('id', room_id)

    // Log the change
    const { data, error } = await supabase
      .from('housekeeping_log')
      .insert({
        room_id,
        property_id: profile.property_id,
        old_status,
        new_status,
        changed_by: profile.id,
        notes,
      })
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data, { status: 201 })
  } catch (e: unknown) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
