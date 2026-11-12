'use client'

import { useQuery } from '@tanstack/react-query'
import { getActivity, getTeam } from '@/lib/services/team'
import { getTeamStatus } from '@/app/(dashboard)/team/actions'

export function useTeam(enabled = true) {
  return useQuery({ queryKey: ['team'], queryFn: getTeam, enabled })
}

export function useActivity(enabled = true) {
  return useQuery({ queryKey: ['activity'], queryFn: () => getActivity(), enabled })
}

export function useTeamStatus(enabled = true) {
  return useQuery({ queryKey: ['team-status'], queryFn: () => getTeamStatus(), enabled })
}
