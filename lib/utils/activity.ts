import type { ActivityLogEntry } from '@/types'

/** Every action the database triggers or Server Actions write to activity_log. */
export const ACTIVITY_ACTIONS = [
  'reservation_created',
  'checked_in',
  'checked_out',
  'cancelled',
  'no_show',
  'guest_banned',
  'guest_unbanned',
  'room_rate_changed',
  'id_document_added',
  'id_document_removed',
  'staff_added',
  'staff_role_changed',
  'staff_deactivated',
  'staff_reactivated',
  'staff_password_reset',
] as const

interface Formatters {
  role: (role: string) => string
  money: (amount: number) => string
  /** Used when an entry has no actor (system/admin changes). */
  system: string
}

/**
 * Turns an audit row into an i18n key plus its values, e.g.
 * { key: 'activity.checked_in', values: { actor: 'Sam', guest: 'Asha Patel', room: '101' } }.
 * Kept free of React and `t` so it is trivial to test.
 */
export function activityMessage(entry: ActivityLogEntry, fmt: Formatters) {
  const s = entry.summary ?? {}
  const text = (v: unknown) => (v === null || v === undefined ? '' : String(v))
  const actor = entry.actor?.full_name || entry.actor?.email || fmt.system

  const values: Record<string, string> = {
    actor,
    guest: text(s.guest),
    room: text(s.room),
    name: text(s.name),
    email: text(s.email),
    reason: text(s.reason),
    kind: text(s.kind),
    role: s.role ? fmt.role(text(s.role)) : '',
    from: '',
    to: '',
  }
  if (entry.action === 'staff_role_changed') {
    values.from = fmt.role(text(s.from))
    values.to = fmt.role(text(s.to))
  } else if (entry.action === 'room_rate_changed') {
    values.from = fmt.money(Number(s.from))
    values.to = fmt.money(Number(s.to))
  }

  const known = (ACTIVITY_ACTIONS as readonly string[]).includes(entry.action)
  return known
    ? { key: `activity.${entry.action}`, values }
    : { key: 'activity.unknown', values: { ...values, action: entry.action } }
}
