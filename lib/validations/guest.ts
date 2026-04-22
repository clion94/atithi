import { z } from 'zod'

export const guestSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  id_type: z.enum(['drivers_license', 'passport', 'state_id', 'other']).optional(),
  id_number: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  notes: z.string().optional(),
})

export type GuestFormData = z.infer<typeof guestSchema>

export const guestBanSchema = z.object({
  is_banned: z.boolean(),
  ban_reason: z.string().min(1, 'Ban reason is required').optional(),
})

export type GuestBanFormData = z.infer<typeof guestBanSchema>
