'use client'

import { create } from 'zustand'
import type { Profile, Property } from '@/types'

interface AppState {
  profile: Profile | null
  property: Property | null
  setProfile: (profile: Profile | null) => void
  setProperty: (property: Property | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  property: null,
  setProfile: (profile) => set({ profile }),
  setProperty: (property) => set({ property }),
}))
