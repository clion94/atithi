import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reservationSchema } from '@/lib/validations/reservation'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = request.nextUrl
    const filter = searchParams.get('filter')

    const today = new Date().toISOString().split('T')[0]
    let query = supabase
      .from('reservations')
      .select('*, room:rooms(*), guest:guests(*)')
      .order('check_in_date', { ascending: false })

    if (filter === 'arrivals') query = query.eq('check_in_date', today).in('status', ['confirmed'])
    else if (filter === 'departures') query = query.eq('check_out_date', today).eq('status', 'checked_in')
    else if (filter === 'inhouse') query = query.eq('status', 'checked_in')
    else if (filter === 'today') query = query.or(`check_in_date.eq.${today},check_out_date.eq.${today}`)

    const { data, error } = await query
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

    const parsed = reservationSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('reservations')
      .insert({ ...parsed.data, property_id: profile.property_id, status: 'confirmed' })
      .select('*, room:rooms(*), guest:guests(*)')
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data, { status: 201 })
  } catch (e: unknown) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
