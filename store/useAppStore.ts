'use client'

import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react'
import { createStore, useStore, type StoreApi } from 'zustand'
import type { Profile, Property } from '@/types'

interface AppState {
  profile: Profile | null
  property: Property | null
  setProfile: (profile: Profile | null) => void
  setProperty: (property: Property | null) => void
}

const AppStoreContext = createContext<StoreApi<AppState> | null>(null)

/**
 * Holds the signed-in profile and property for the dashboard.
 *
 * The store is created per provider instance (i.e. per request on the server,
 * per tab in the browser) from the server-fetched props. A module-level store
 * would be shared by every request on the server and could leak one user's
 * profile/property into another user's rendered HTML.
 */
export function AppStoreProvider({
  profile,
  property,
  children,
}: {
  profile: Profile | null
  property: Property | null
  children: ReactNode
}) {
  const [store] = useState(() =>
    createStore<AppState>()((set) => ({
      profile,
      property,
      setProfile: (profile) => set({ profile }),
      setProperty: (property) => set({ property }),
    }))
  )

  // Pick up fresh server data (e.g. after router.refresh()).
  useEffect(() => {
    store.setState({ profile, property })
  }, [store, profile, property])

  return createElement(AppStoreContext.Provider, { value: store }, children)
}

export function useAppStore<T>(selector: (state: AppState) => T): T {
  const store = useContext(AppStoreContext)
  if (!store) throw new Error('useAppStore must be used inside <AppStoreProvider>')
  return useStore(store, selector)
}
