'use client'

import { useEffect, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { initI18n } from '@/lib/i18n/client'

const i18nInstance = initI18n()

export default function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Sync language from storage on mount
    const stored = localStorage.getItem('atithi_language')
    if (stored && i18nInstance.language !== stored) {
      i18nInstance.changeLanguage(stored)
    }
  }, [])

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>
}
