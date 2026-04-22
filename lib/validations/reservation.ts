import { z } from 'zod'

export const reservationSchema = z.object({
  room_id: z.string().uuid('Please select a room'),
  guest_id: z.string().uuid('Please select a guest'),
  check_in_date: z.string().min(1, 'Check-in date is required'),
  check_out_date: z.string().min(1, 'Check-out date is required'),
  rate_per_night: z.number().positive('Rate must be greater than 0'),
  adults: z.number().int().min(1).max(10),
  children: z.number().int().min(0).max(10),
  source: z.enum(['walk_in', 'phone', 'booking_com', 'expedia', 'direct_web', 'other']),
  special_requests: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => data.check_out_date > data.check_in_date,
  { message: 'Check-out must be after check-in', path: ['check_out_date'] }
)

export type ReservationFormData = z.infer<typeof reservationSchema>
