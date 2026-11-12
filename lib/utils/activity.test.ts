import { describe, expect, it } from 'vitest'
import { ACTIVITY_ACTIONS, activityMessage } from './activity'
import type { ActivityLogEntry } from '@/types'

const fmt = { role: (r: string) => r.toUpperCase(), money: (n: number) => `$${n}`, system: 'System' }
const entry = (
  action: string,
  summary: Record<string, unknown> = {},
  actor: ActivityLogEntry['actor'] = { full_name: 'Sam', email: 's@x.y' }
): ActivityLogEntry => ({
  id: '1',
  property_id: 'p',
  actor_id: 'a',
  action,
  entity_type: 'x',
  entity_id: null,
  summary,
  created_at: '2026-11-12T00:00:00Z',
  actor,
})

describe('activityMessage', () => {
  it('maps every known action to its own key', () => {
    for (const action of ACTIVITY_ACTIONS) expect(activityMessage(entry(action), fmt).key).toBe(`activity.${action}`)
  })
  it('falls back for an action it does not know instead of hiding it', () => {
    const m = activityMessage(entry('something_new'), fmt)
    expect(m.key).toBe('activity.unknown')
    expect(m.values.action).toBe('something_new')
  })
  it('passes guest and room through', () => {
    expect(activityMessage(entry('checked_in', { guest: 'Asha Patel', room: '101' }), fmt).values).toMatchObject({
      actor: 'Sam',
      guest: 'Asha Patel',
      room: '101',
    })
  })
  it('formats rate changes as money and role changes as roles', () => {
    expect(activityMessage(entry('room_rate_changed', { room: '1', from: 100, to: '120.00' }), fmt).values).toMatchObject({
      from: '$100',
      to: '$120',
    })
    expect(activityMessage(entry('staff_role_changed', { name: 'Mia', from: 'staff', to: 'manager' }), fmt).values).toMatchObject({
      from: 'STAFF',
      to: 'MANAGER',
    })
  })
  it('names the actor by name, then email, then "system"', () => {
    expect(activityMessage(entry('checked_in', {}, { full_name: null, email: 'a@b.c' }), fmt).values.actor).toBe('a@b.c')
    expect(activityMessage(entry('checked_in', {}, null), fmt).values.actor).toBe('System')
  })
  it('copes with missing summary fields', () => {
    expect(activityMessage(entry('guest_banned', {}), fmt).values.reason).toBe('')
  })
})
