import { describe, expect, it } from 'vitest'
import { bookingRow } from './reservations'

const base = {
  property_id: 'p1',
  room_id: 'r1',
  guest_id: 'g1',
  check_in_date: '2026-11-12',
  check_out_date: '2026-11-14',
  rate_per_night: 100,
  adults: 2,
  children: 0,
  source: 'phone' as const,
}

describe('bookingRow', () => {
  it('does not send vehicle_plate at all when there is none (works before migration 004)', () => {
    for (const plate of [undefined, '', '   ']) {
      const row = bookingRow({ ...base, vehicle_plate: plate }, 'confirmed')
      expect('vehicle_plate' in row).toBe(false)
    }
  })

  it('sends a normalised plate when there is one', () => {
    expect(bookingRow({ ...base, vehicle_plate: '  tx  12 ab ' }, 'checked_in')).toMatchObject({
      vehicle_plate: 'TX 12 AB',
      status: 'checked_in',
    })
  })

  it('keeps every other field and sets the status', () => {
    expect(bookingRow(base, 'confirmed')).toEqual({ ...base, status: 'confirmed' })
  })
})
