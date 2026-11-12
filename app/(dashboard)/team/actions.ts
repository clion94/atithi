'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin'
import { decide, type Actor, type Denial } from '@/lib/team/rules'
import { generateTempPassword } from '@/lib/team/password'
import type { ActionResult, Credentials, ErrorCode } from '@/lib/team/types'
import type { UserRole } from '@/types'

// Every export here is a public POST endpoint. Each one re-checks who is calling and
// whether they may act on that specific member, and only ever touches the caller's own
// property (never a property id supplied by the client).

const roleSchema = z.enum(['owner', 'manager', 'staff'])
const addSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  full_name: z.string().trim().min(1).max(100),
  role: roleSchema,
})
const idSchema = z.string().uuid()

interface Caller extends Actor {
  property_id: string
  full_name: string | null
}

async function getCaller(): Promise<Caller | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, property_id, role, active, full_name')
    .eq('id', user.id)
    .single()
  if (!profile || !profile.active || !profile.property_id) return null
  return profile as Caller
}

type Admin = ReturnType<typeof createAdminClient>

async function loadMember(admin: Admin, caller: Caller, memberId: string) {
  const { data } = await admin
    .from('profiles')
    .select('id, role, active, full_name, email')
    .eq('id', memberId)
    .eq('property_id', caller.property_id) // IDOR guard: only the caller's own team
    .maybeSingle()
  return data as { id: string; role: UserRole; active: boolean; full_name: string | null; email: string | null } | null
}

async function audit(
  admin: Admin,
  caller: Caller,
  action: string,
  memberId: string,
  summary: Record<string, unknown>
) {
  const { error } = await admin.from('activity_log').insert({
    property_id: caller.property_id,
    actor_id: caller.id,
    action,
    entity_type: 'staff',
    entity_id: memberId,
    summary,
  })
  if (error) console.error('activity log insert failed', error.message)
}

const denialCode = (reason: Denial): ErrorCode => reason

/** Common preamble: configured, signed in and (optionally) allowed to act on this member. */
async function begin(): Promise<
  { ok: false; code: ErrorCode } | { ok: true; caller: Caller; admin: Admin }
> {
  const caller = await getCaller()
  if (!caller) return { ok: false, code: 'unauthorized' }
  if (!isAdminConfigured()) return { ok: false, code: 'not_configured' }
  return { ok: true, caller, admin: createAdminClient() }
}

export async function getTeamStatus(): Promise<{ adminConfigured: boolean }> {
  const caller = await getCaller()
  if (!caller) return { adminConfigured: false }
  return { adminConfigured: isAdminConfigured() }
}

export async function addTeamMember(input: unknown): Promise<ActionResult<Credentials>> {
  const parsed = addSchema.safeParse(input)
  if (!parsed.success) return { ok: false, code: 'invalid' }
  const start = await begin()
  if (!start.ok) return start
  const { caller, admin } = start

  const decision = decide('add', caller, undefined, parsed.data.role)
  if (!decision.ok) return { ok: false, code: denialCode(decision.reason) }

  const tempPassword = generateTempPassword()
  const { data: created, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name, must_change_password: true },
  })
  if (error || !created.user) {
    const taken = error?.code === 'email_exists' || /already.*registered/i.test(error?.message ?? '')
    return { ok: false, code: taken ? 'email_taken' : 'failed' }
  }

  const { error: profileError } = await admin.from('profiles').insert({
    id: created.user.id,
    property_id: caller.property_id,
    role: parsed.data.role,
    full_name: parsed.data.full_name,
    email: parsed.data.email,
  })
  if (profileError) {
    // Do not leave a login that belongs to no property behind.
    await admin.auth.admin.deleteUser(created.user.id)
    return { ok: false, code: 'failed' }
  }

  await audit(admin, caller, 'staff_added', created.user.id, {
    name: parsed.data.full_name,
    email: parsed.data.email,
    role: parsed.data.role,
  })
  return { ok: true, data: { email: parsed.data.email, tempPassword } }
}

export async function changeMemberRole(memberId: unknown, role: unknown): Promise<ActionResult> {
  const id = idSchema.safeParse(memberId)
  const newRole = roleSchema.safeParse(role)
  if (!id.success || !newRole.success) return { ok: false, code: 'invalid' }
  const start = await begin()
  if (!start.ok) return start
  const { caller, admin } = start

  const member = await loadMember(admin, caller, id.data)
  if (!member) return { ok: false, code: 'not_found' }
  const decision = decide('change_role', caller, member, newRole.data)
  if (!decision.ok) return { ok: false, code: denialCode(decision.reason) }
  if (member.role === newRole.data) return { ok: true, data: null }

  const { error } = await admin.from('profiles').update({ role: newRole.data }).eq('id', member.id)
  if (error) {
    return { ok: false, code: /at least one active owner/i.test(error.message) ? 'last_owner' : 'failed' }
  }
  await audit(admin, caller, 'staff_role_changed', member.id, {
    name: member.full_name,
    from: member.role,
    to: newRole.data,
  })
  return { ok: true, data: null }
}

export async function setMemberActive(memberId: unknown, active: unknown): Promise<ActionResult> {
  const id = idSchema.safeParse(memberId)
  if (!id.success || typeof active !== 'boolean') return { ok: false, code: 'invalid' }
  const start = await begin()
  if (!start.ok) return start
  const { caller, admin } = start

  const member = await loadMember(admin, caller, id.data)
  if (!member) return { ok: false, code: 'not_found' }
  const decision = decide(active ? 'reactivate' : 'deactivate', caller, member)
  if (!decision.ok) return { ok: false, code: denialCode(decision.reason) }
  if (member.active === active) return { ok: true, data: null }

  // The profile flag is what locks the account out of every table immediately.
  const { error } = await admin.from('profiles').update({ active }).eq('id', member.id)
  if (error) {
    return { ok: false, code: /at least one active owner/i.test(error.message) ? 'last_owner' : 'failed' }
  }

  // Also stop new sign-ins. If this call fails the database lock above still holds.
  const { error: banError } = await admin.auth.admin.updateUserById(member.id, {
    ban_duration: active ? 'none' : '876000h',
  })
  if (banError) console.error('auth ban update failed', banError.message)

  await audit(admin, caller, active ? 'staff_reactivated' : 'staff_deactivated', member.id, {
    name: member.full_name,
  })
  return { ok: true, data: null }
}

export async function resetMemberPassword(memberId: unknown): Promise<ActionResult<Credentials>> {
  const id = idSchema.safeParse(memberId)
  if (!id.success) return { ok: false, code: 'invalid' }
  const start = await begin()
  if (!start.ok) return start
  const { caller, admin } = start

  const member = await loadMember(admin, caller, id.data)
  if (!member || !member.email) return { ok: false, code: 'not_found' }
  const decision = decide('reset_password', caller, member)
  if (!decision.ok) return { ok: false, code: denialCode(decision.reason) }

  const tempPassword = generateTempPassword()
  const { error } = await admin.auth.admin.updateUserById(member.id, {
    password: tempPassword,
    user_metadata: { must_change_password: true },
  })
  if (error) return { ok: false, code: 'failed' }

  await audit(admin, caller, 'staff_password_reset', member.id, { name: member.full_name })
  return { ok: true, data: { email: member.email, tempPassword } }
}
