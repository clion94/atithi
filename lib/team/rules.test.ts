import { describe, expect, it } from 'vitest'
import { assignableRoles, decide, type Actor, type Target } from './rules'

const owner: Actor = { id: 'o', role: 'owner', active: true }
const manager: Actor = { id: 'm', role: 'manager', active: true }
const staff: Actor = { id: 's', role: 'staff', active: true }
const staffTarget: Target = { id: 't1', role: 'staff', active: true }
const managerTarget: Target = { id: 't2', role: 'manager', active: true }
const ownerTarget: Target = { id: 't3', role: 'owner', active: true }

describe('assignableRoles', () => {
  it('owners can add anyone, managers only staff, staff no one', () => {
    expect(assignableRoles('owner')).toEqual(['owner', 'manager', 'staff'])
    expect(assignableRoles('manager')).toEqual(['staff'])
    expect(assignableRoles('staff')).toEqual([])
  })
})

describe('decide: add', () => {
  it('lets an owner add a manager but not a manager add a manager or owner', () => {
    expect(decide('add', owner, undefined, 'manager')).toEqual({ ok: true })
    expect(decide('add', manager, undefined, 'staff')).toEqual({ ok: true })
    expect(decide('add', manager, undefined, 'manager')).toEqual({ ok: false, reason: 'role_not_allowed' })
    expect(decide('add', manager, undefined, 'owner')).toEqual({ ok: false, reason: 'role_not_allowed' })
  })
  it('rejects a missing role', () => {
    expect(decide('add', owner)).toEqual({ ok: false, reason: 'role_not_allowed' })
  })
})

describe('decide: staff and deactivated accounts can do nothing', () => {
  it.each(['add', 'change_role', 'deactivate', 'reactivate', 'reset_password'] as const)('%s is forbidden', (action) => {
    expect(decide(action, staff, staffTarget, 'staff')).toEqual({ ok: false, reason: 'forbidden' })
    expect(decide(action, { ...owner, active: false }, staffTarget, 'staff')).toEqual({ ok: false, reason: 'forbidden' })
  })
})

describe('decide: role changes', () => {
  it('only owners change roles, and never their own', () => {
    expect(decide('change_role', owner, staffTarget, 'manager')).toEqual({ ok: true })
    expect(decide('change_role', manager, staffTarget, 'manager')).toEqual({ ok: false, reason: 'forbidden' })
    expect(decide('change_role', owner, { ...ownerTarget, id: 'o' }, 'staff')).toEqual({ ok: false, reason: 'self' })
  })
  it('rejects an unknown role', () => {
    expect(decide('change_role', owner, staffTarget, 'admin' as never)).toEqual({ ok: false, reason: 'role_not_allowed' })
  })
})

describe('decide: deactivate / reactivate / reset password', () => {
  it.each(['deactivate', 'reactivate', 'reset_password'] as const)('%s: owner may act on anyone else', (action) => {
    expect(decide(action, owner, managerTarget)).toEqual({ ok: true })
    expect(decide(action, owner, ownerTarget)).toEqual({ ok: true })
  })
  it.each(['deactivate', 'reactivate', 'reset_password'] as const)('%s: manager may act on staff only', (action) => {
    expect(decide(action, manager, staffTarget)).toEqual({ ok: true })
    expect(decide(action, manager, managerTarget)).toEqual({ ok: false, reason: 'forbidden' })
    expect(decide(action, manager, ownerTarget)).toEqual({ ok: false, reason: 'forbidden' })
  })
  it.each(['deactivate', 'reactivate', 'reset_password'] as const)('%s: nobody acts on themselves', (action) => {
    expect(decide(action, owner, { ...ownerTarget, id: 'o' })).toEqual({ ok: false, reason: 'self' })
    expect(decide(action, manager, { ...staffTarget, id: 'm' })).toEqual({ ok: false, reason: 'self' })
  })
  it('a target is required', () => {
    expect(decide('deactivate', owner)).toEqual({ ok: false, reason: 'forbidden' })
  })
})
