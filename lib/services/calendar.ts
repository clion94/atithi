import { createClient } from '@/lib/supabase/client'
import type { Room } from '@/types'
import { toError } from '@/lib/utils/errors'
import { addDaysISO } from '@/lib/utils/dates'
import { CALENDAR_DAYS, type CalendarStay } from '@/lib/utils/calendar'

export interface CalendarReservation extends CalendarStay {
  guest: { first_name: string; last_name: string } | null
}

export interface CalendarData {
  rooms: Room[]
  stays: CalendarReservation[]
}

/**
 * Every room plus the stays that touch [start, start + days). Also fetches guests who
 * are still checked in after their check-out date, because they are still in the room
 * and the rack has to show it.
 */
export async function getCalendar(start: string, today: string, days = CALENDAR_DAYS): Promise<CalendarData> {
  const supabase = createClient()
  const end = addDaysISO(start, days)

  const [rooms, stays] = await Promise.all([
    supabase.from('rooms').select('*').order('number'),
    supabase
      .from('reservations')
      .select('id, room_id, check_in_date, check_out_date, status, guest:guests(first_name, last_name)')
      .in('status', ['confirmed', 'checked_in', 'checked_out'])
      .or(
        `and(check_in_date.lt.${end},check_out_date.gt.${start}),and(status.eq.checked_in,check_out_date.lt.${today})`
      ),
  ])
  if (rooms.error) throw toError(rooms.error)
  if (stays.error) throw toError(stays.error)

  return { rooms: rooms.data, stays: stays.data as unknown as CalendarReservation[] }
}
