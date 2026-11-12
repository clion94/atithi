import type { UserRole } from '@/types'

export type TeamAction = 'add' | 'change_role' | 'deactivate' | 'reactivate' | 'reset_password'

export interface Actor {
  id: string
  role: UserRole
  active: boolean
}

export interface Target {
  id: string
  role: UserRole
  active: boolean
}

export type Denial = 'forbidden' | 'self' | 'role_not_allowed'
export type Decision = { ok: true } | { ok: false; reason: Denial }

export const ROLES: UserRole[] = ['owner', 'manager', 'staff']

export function isManager(role: UserRole | undefined | null): boolean {
  return role === 'owner' || role === 'manager'
}

/** Roles an actor may hand out when adding someone: owners anything, managers only staff. */
export function assignableRoles(actorRole: UserRole): UserRole[] {
  if (actorRole === 'owner') return ['owner', 'manager', 'staff']
  if (actorRole === 'manager') return ['staff']
  return []
}

/**
 * Who may do what to whom. This is the single source of truth for the Server Actions;
 * the database separately guarantees a property keeps at least one active owner.
 *
 * - Owners manage everyone else. Managers manage staff only.
 * - Roles can only be changed by an owner.
 * - Nobody can change, deactivate or reset themselves (use Settings for their own password).
 */
export function decide(
  action: TeamAction,
  actor: Actor,
  target?: Target,
  newRole?: UserRole
): Decision {
  if (!actor.active || !isManager(actor.role)) return { ok: false, reason: 'forbidden' }

  if (action === 'add') {
    return newRole && assignableRoles(actor.role).includes(newRole)
      ? { ok: true }
      : { ok: false, reason: 'role_not_allowed' }
  }

  if (!target) return { ok: false, reason: 'forbidden' }
  if (target.id === actor.id) return { ok: false, reason: 'self' }

  if (action === 'change_role') {
    if (actor.role !== 'owner') return { ok: false, reason: 'forbidden' }
    return newRole && ROLES.includes(newRole) ? { ok: true } : { ok: false, reason: 'role_not_allowed' }
  }

  // deactivate / reactivate / reset_password
  if (actor.role === 'owner') return { ok: true }
  return target.role === 'staff' ? { ok: true } : { ok: false, reason: 'forbidden' }
}
