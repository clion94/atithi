export type RoomStatus = 'clean' | 'dirty' | 'inspected' | 'out_of_order' | 'do_not_disturb'
export type RoomType = 'standard' | 'double' | 'suite' | 'king' | 'smoking' | 'accessible'
export type ReservationStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'
export type ReservationSource = 'walk_in' | 'phone' | 'booking_com' | 'expedia' | 'direct_web' | 'other'
export type UserRole = 'owner' | 'manager' | 'staff'
export type Language = 'en' | 'gu' | 'hi'
export type FolioItemType = 'room_charge' | 'tax' | 'fee' | 'payment' | 'credit' | 'other'

export interface Property {
  id: string
  name: string
  address?: string
  city?: string
  state?: string
  zip?: string
  phone?: string
  email?: string
  timezone: string
  check_in_time: string
  check_out_time: string
  /** Occupancy/sales tax percentage applied on invoices (0-100). */
  tax_rate: number
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  property_id: string
  full_name?: string
  email?: string
  role: UserRole
  /** Deactivated accounts keep their history but have no access. */
  active: boolean
  language: Language
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  property_id: string
  number: string
  room_type: RoomType
  floor?: number
  capacity: number
  base_rate: number
  status: RoomStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface Guest {
  id: string
  property_id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  id_type?: string
  id_number?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  is_banned: boolean
  ban_reason?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Reservation {
  id: string
  property_id: string
  room_id: string
  guest_id: string
  check_in_date: string
  check_out_date: string
  actual_check_in?: string
  actual_check_out?: string
  status: ReservationStatus
  rate_per_night: number
  adults: number
  children: number
  source: ReservationSource
  special_requests?: string
  vehicle_plate?: string
  notes?: string
  created_at: string
  updated_at: string
  room?: Room
  guest?: Guest
}

export interface FolioItem {
  id: string
  reservation_id: string
  property_id: string
  description: string
  amount: number
  item_type: FolioItemType
  posted_at: string
  created_at: string
}

export interface HousekeepingLog {
  id: string
  property_id: string
  room_id: string
  old_status?: string
  new_status: string
  changed_by?: string
  notes?: string
  created_at: string
}

export interface DashboardStats {
  occupied: number
  available: number
  /** Rooms that can be sold (out-of-order rooms excluded). */
  total_rooms: number
  checkins_today: number
  checkouts_today: number
  arrivals: Reservation[]
  departures: Reservation[]
}

export interface ActivityLogEntry {
  id: string
  property_id: string
  actor_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  summary: Record<string, unknown>
  created_at: string
  actor?: { full_name: string | null; email: string | null } | null
}

export interface GuestDocument {
  id: string
  property_id: string
  guest_id: string
  storage_path: string
  kind: 'id_front' | 'id_back' | 'other'
  uploaded_by: string | null
  created_at: string
}
