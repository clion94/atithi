'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { Profile, Property } from '@/types'

interface AppBootstrapProps {
  profile: Profile | null
  property: Property | null
}

export default function AppBootstrap({ profile, property }: AppBootstrapProps) {
  const { setProfile, setProperty } = useAppStore()

  useEffect(() => {
    setProfile(profile)
    setProperty(property)
  }, [profile, property, setProfile, setProperty])

  return null
}
