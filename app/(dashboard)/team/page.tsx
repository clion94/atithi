'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Copy, KeyRound, UserPlus } from 'lucide-react'
import { addTeamMember, changeMemberRole, resetMemberPassword, setMemberActive } from './actions'
import { useActivity, useTeam, useTeamStatus } from '@/hooks/useTeam'
import { useAppStore } from '@/store/useAppStore'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ErrorState from '@/components/ui/ErrorState'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { activityMessage } from '@/lib/utils/activity'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDateTime } from '@/lib/utils/dates'
import { assignableRoles, decide, isManager, ROLES } from '@/lib/team/rules'
import type { ActionResult, Credentials } from '@/lib/team/types'
import type { Profile, UserRole } from '@/types'

const ROLE_BADGE: Record<UserRole, 'purple' | 'blue' | 'gray'> = {
  owner: 'purple',
  manager: 'blue',
  staff: 'gray',
}

export default function TeamPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const me = useAppStore((s) => s.profile)
  const allowed = isManager(me?.role)

  const team = useTeam(allowed)
  const activity = useActivity(allowed)
  const status = useTeamStatus(allowed)

  const [addOpen, setAddOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('staff')
  const [busy, setBusy] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<(Credentials & { name: string }) | null>(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState<Profile | null>(null)

  if (!me) return null
  if (!allowed) {
    return <p className="text-center py-12 text-gray-400">{t('team.noAccess')}</p>
  }

  const adminReady = status.data?.adminConfigured !== false
  const actor = { id: me.id, role: me.role, active: me.active }
  const roleOptions = ROLES.map((r) => ({ value: r, label: t(`team.roles.${r}`) }))

  const refresh = () => queryClient.invalidateQueries({ predicate: (q) => ['team', 'activity'].includes(q.queryKey[0] as string) })

  /** Runs a Server Action, shows its error as a plain-language toast, refreshes on success. */
  async function run<T>(key: string, action: () => Promise<ActionResult<T>>): Promise<T | null> {
    setBusy(key)
    try {
      const result = await action()
      if (!result.ok) {
        toast.error(t(`team.errors.${result.code}`))
        return null
      }
      await refresh()
      return result.data
    } catch {
      toast.error(t('team.errors.failed'))
      return null
    } finally {
      setBusy(null)
    }
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault()
    const data = await run('add', () => addTeamMember({ email, full_name: fullName, role }))
    if (data) {
      setCredentials({ ...data, name: fullName })
      setAddOpen(false)
      setEmail('')
      setFullName('')
      setRole('staff')
    }
  }

  async function onResetPassword(member: Profile) {
    const data = await run(`reset-${member.id}`, () => resetMemberPassword(member.id))
    if (data) setCredentials({ ...data, name: member.full_name ?? member.email ?? '' })
  }

  async function onToggleActive(member: Profile, active: boolean) {
    const ok = await run(`active-${member.id}`, () => setMemberActive(member.id, active))
    if (ok !== null) toast.success(t(active ? 'team.reactivated' : 'team.deactivated'))
    setConfirmDeactivate(null)
  }

  async function onChangeRole(member: Profile, next: string) {
    const ok = await run(`role-${member.id}`, () => changeMemberRole(member.id, next))
    if (ok !== null) toast.success(t('team.roleChanged'))
  }

  async function copyPassword() {
    if (!credentials) return
    try {
      await navigator.clipboard.writeText(credentials.tempPassword)
      toast.success(t('team.copied'))
    } catch {
      toast.error(t('team.copyFailed'))
    }
  }

  const fmt = {
    role: (r: string) => t(`team.roles.${r}`, { defaultValue: r }),
    money: (n: number) => formatCurrency(n),
    system: t('activity.system'),
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[28px] md:text-[34px] leading-tight font-bold tracking-tight text-secondary">
          {t('team.title')}
        </h1>
        <Button size="sm" onClick={() => setAddOpen(true)} disabled={!adminReady}>
          <UserPlus className="h-4 w-4" />
          {t('team.add')}
        </Button>
      </div>

      {!adminReady && (
        <div role="note" className="rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-800">
          {t('team.notConfigured')}
        </div>
      )}

      <Card padding="none">
        {team.error ? (
          <ErrorState message={team.error.message} onRetry={() => team.refetch()} />
        ) : team.isPending ? (
          <div className="flex items-center justify-center h-32">
            <Spinner />
          </div>
        ) : (
          <ul className="divide-y divide-black/5">
            {team.data.map((member) => {
              const isMe = member.id === me.id
              const canRole = decide('change_role', actor, member, member.role).ok
              const canReset = decide('reset_password', actor, member).ok
              const canToggle = decide(member.active ? 'deactivate' : 'reactivate', actor, member).ok
              return (
                <li key={member.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Only the identity is dimmed for a deactivated member, never their action buttons. */}
                    <div className={`flex items-center gap-3 min-w-0 ${member.active ? '' : 'opacity-60'}`}>
                      <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 grid place-items-center text-sm font-semibold text-primary">
                        {(member.full_name ?? member.email ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-secondary truncate">
                          {member.full_name ?? member.email}
                          {isMe && <span className="ml-2 text-xs text-gray-400">{t('team.you')}</span>}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {!member.active && <Badge variant="red">{t('team.inactive')}</Badge>}
                      {canRole && member.active ? (
                        <Select
                          aria-label={t('team.changeRole')}
                          value={member.role}
                          disabled={busy === `role-${member.id}` || !adminReady}
                          onChange={(e) => onChangeRole(member, e.target.value)}
                          options={roleOptions}
                          className="min-h-9 py-1 text-sm"
                        />
                      ) : (
                        <Badge variant={ROLE_BADGE[member.role]}>{t(`team.roles.${member.role}`)}</Badge>
                      )}
                      {canReset && member.active && (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={busy === `reset-${member.id}`}
                          disabled={!adminReady}
                          onClick={() => onResetPassword(member)}
                        >
                          <KeyRound className="h-4 w-4" />
                          {t('team.resetPassword')}
                        </Button>
                      )}
                      {canToggle && (
                        <Button
                          size="sm"
                          variant={member.active ? 'outline' : 'primary'}
                          loading={busy === `active-${member.id}`}
                          disabled={!adminReady}
                          onClick={() => (member.active ? setConfirmDeactivate(member) : onToggleActive(member, true))}
                        >
                          {member.active ? t('team.deactivate') : t('team.reactivate')}
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <div>
        <h2 className="text-[17px] font-semibold tracking-tight text-secondary mb-3">{t('team.activity')}</h2>
        <Card padding="none">
          {activity.error ? (
            <ErrorState message={activity.error.message} onRetry={() => activity.refetch()} />
          ) : activity.isPending ? (
            <div className="flex items-center justify-center h-32">
              <Spinner />
            </div>
          ) : activity.data.length === 0 ? (
            <p className="text-center py-8 text-gray-400">{t('team.noActivity')}</p>
          ) : (
            <ul className="divide-y divide-black/5" aria-label={t('team.activity')}>
              {activity.data.map((entry) => {
                const msg = activityMessage(entry, fmt)
                return (
                  <li key={entry.id} className="flex items-start justify-between gap-4 px-4 py-3">
                    <p className="text-sm text-secondary">{t(msg.key, msg.values)}</p>
                    <time dateTime={entry.created_at} className="shrink-0 text-xs text-gray-400 tabular-nums">
                      {formatDateTime(entry.created_at)}
                    </time>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Add team member */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t('team.add')} size="sm">
        <form onSubmit={onAdd} className="space-y-4">
          <Input
            label={t('team.fullName')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            maxLength={100}
          />
          <Input
            label={t('settings.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Select
            label={t('settings.role')}
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            options={assignableRoles(me.role).map((r) => ({ value: r, label: t(`team.roles.${r}`) }))}
          />
          <p className="text-xs text-gray-500">{t('team.addHint')}</p>
          <div className="flex gap-3 pt-1">
            <Button type="submit" loading={busy === 'add'} className="flex-1">
              {t('team.createLogin')}
            </Button>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              {t('actions.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* One-time credentials */}
      <Modal open={!!credentials} onClose={() => setCredentials(null)} title={t('team.credentialsTitle')} size="sm">
        {credentials && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{t('team.credentialsIntro', { name: credentials.name })}</p>
            <dl className="rounded-2xl bg-black/[0.04] p-4 space-y-2 text-sm">
              <div>
                <dt className="text-xs text-gray-500">{t('settings.email')}</dt>
                <dd className="font-medium text-secondary break-all">{credentials.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">{t('auth.password')}</dt>
                <dd className="font-mono text-lg tracking-wide text-secondary select-all">{credentials.tempPassword}</dd>
              </div>
            </dl>
            <p className="text-xs text-amber-700">{t('team.credentialsNote')}</p>
            <div className="flex gap-3">
              <Button onClick={copyPassword} className="flex-1">
                <Copy className="h-4 w-4" />
                {t('team.copy')}
              </Button>
              <Button variant="outline" onClick={() => setCredentials(null)}>
                {t('actions.close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Deactivate confirmation */}
      <Modal
        open={!!confirmDeactivate}
        onClose={() => setConfirmDeactivate(null)}
        title={t('team.deactivate')}
        size="sm"
      >
        {confirmDeactivate && (
          <>
            <p className="text-sm text-gray-600 mb-6">
              {t('team.deactivateConfirm', { name: confirmDeactivate.full_name ?? confirmDeactivate.email })}
            </p>
            <div className="flex gap-3">
              <Button
                variant="danger"
                className="flex-1"
                loading={busy === `active-${confirmDeactivate.id}`}
                onClick={() => onToggleActive(confirmDeactivate, false)}
              >
                {t('team.deactivate')}
              </Button>
              <Button variant="outline" onClick={() => setConfirmDeactivate(null)}>
                {t('actions.cancel')}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
