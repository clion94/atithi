'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { createI18n, getStoredLanguage, isLanguage, setStoredLanguage } from '@/lib/i18n/client'

interface I18nProviderProps {
  /** The signed-in user's language (profile.language). Omit on signed-out pages. */
  language?: string
  children: ReactNode
}

export default function I18nProvider({ language, children }: I18nProviderProps) {
  // Server and first client render both start from the same language, so hydration matches.
  const [i18n] = useState(() => createI18n(isLanguage(language) ? language : 'en'))

  useEffect(() => {
    if (isLanguage(language)) {
      // Signed in: the profile is the source of truth; remember it for the login page.
      setStoredLanguage(language)
      if (i18n.language !== language) i18n.changeLanguage(language)
    } else {
      // Signed out: fall back to the language remembered in this browser.
      const stored = getStoredLanguage()
      if (i18n.language !== stored) i18n.changeLanguage(stored)
    }
  }, [language, i18n])

  useEffect(() => {
    const apply = (lng: string) => {
      document.documentElement.lang = lng
    }
    apply(i18n.language)
    i18n.on('languageChanged', apply)
    return () => i18n.off('languageChanged', apply)
  }, [i18n])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
