import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { roomSchema } from '@/lib/validations/room'

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase.from('rooms').select('*').order('number')
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

    const body = await request.json()
    const { data: profile } = await supabase
      .from('profiles')
      .select('property_id')
      .eq('id', user.id)
      .single()

    if (!profile?.property_id) {
      return Response.json({ error: 'No property associated with user' }, { status: 400 })
    }

    const parsed = roomSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('rooms')
      .insert({ ...parsed.data, property_id: profile.property_id })
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data, { status: 201 })
  } catch (e: unknown) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
