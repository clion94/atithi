import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('reservations')
      .select('*, room:rooms(*), guest:guests(*)')
      .eq('id', id)
      .single()

    if (error) return Response.json({ error: error.message }, { status: 404 })
    return Response.json(data)
  } catch (e: unknown) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const { data, error } = await supabase
      .from('reservations')
      .update(body)
      .eq('id', id)
      .select('*, room:rooms(*), guest:guests(*)')
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data)
  } catch (e: unknown) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase.from('reservations').delete().eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return new Response(null, { status: 204 })
  } catch (e: unknown) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
