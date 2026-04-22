'use client'

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCommon from '@/public/locales/en/common.json'
import guCommon from '@/public/locales/gu/common.json'
import hiCommon from '@/public/locales/hi/common.json'

const STORAGE_KEY = 'atithi_language'

export function getStoredLanguage(): string {
  if (typeof window === 'undefined') return 'en'
  return localStorage.getItem(STORAGE_KEY) ?? 'en'
}

export function setStoredLanguage(lang: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, lang)
}

let initialized = false

export function initI18n() {
  if (initialized) return i18n
  initialized = true

  i18n.use(initReactI18next).init({
    resources: {
      en: { common: enCommon },
      gu: { common: guCommon },
      hi: { common: hiCommon },
    },
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  })

  return i18n
}

export default i18n
