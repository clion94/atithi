'use client'

import { createInstance, type i18n as I18nInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCommon from '@/public/locales/en/common.json'
import guCommon from '@/public/locales/gu/common.json'
import hiCommon from '@/public/locales/hi/common.json'

const STORAGE_KEY = 'waypoint_language'

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'hi', label: 'हिंदी' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

export function isLanguage(value: unknown): value is LanguageCode {
  return LANGUAGES.some((l) => l.code === value)
}

export function getStoredLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isLanguage(stored) ? stored : 'en'
  } catch {
    return 'en'
  }
}

export function setStoredLanguage(lang: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // Storage can be blocked (private mode); the language still applies for this session.
  }
}

/**
 * A fresh i18n instance per provider. A module-level singleton would be shared by
 * every request on the server (one user's language leaking into another's HTML),
 * and reading localStorage at import time made the first client render differ from
 * the server render, which React reports as a hydration error for non-English users.
 */
export function createI18n(lng: LanguageCode = 'en'): I18nInstance {
  const instance = createInstance()
  instance.use(initReactI18next).init({
    resources: {
      en: { common: enCommon },
      gu: { common: guCommon },
      hi: { common: hiCommon },
    },
    lng,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  })
  return instance
}
