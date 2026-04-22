import { z } from 'zod'

export const roomSchema = z.object({
  number: z.string().min(1, 'Room number is required'),
  room_type: z.enum(['standard', 'double', 'suite', 'king', 'smoking', 'accessible']),
  floor: z.number().int().optional(),
  capacity: z.number().int().min(1).max(10),
  base_rate: z.number().positive('Rate must be greater than 0'),
  status: z.enum(['clean', 'dirty', 'inspected', 'out_of_order', 'do_not_disturb']),
  notes: z.string().optional(),
})

export type RoomFormData = z.infer<typeof roomSchema>

export const roomStatusSchema = z.object({
  status: z.enum(['clean', 'dirty', 'inspected', 'out_of_order', 'do_not_disturb']),
  notes: z.string().optional(),
})

export type RoomStatusFormData = z.infer<typeof roomStatusSchema>
