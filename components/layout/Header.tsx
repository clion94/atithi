'use client'

import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { LANGUAGES, setStoredLanguage } from '@/lib/i18n/client'
import { updateProfile } from '@/lib/services/settings'
import { useToast } from '@/components/ui/Toast'
import { errorMessage } from '@/lib/utils/errors'
import { useAppStore } from '@/store/useAppStore'
import { formatLongDate } from '@/lib/utils/dates'
import MobileNav from './MobileNav'

export default function Header() {
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const property = useAppStore((s) => s.property)
  const profile = useAppStore((s) => s.profile)
  const setProfile = useAppStore((s) => s.setProfile)

  const handleLanguageChange = async (code: string) => {
    setStoredLanguage(code)
    i18n.changeLanguage(code)
    // Persist to the profile so the choice survives reloads and other devices.
    if (!profile || profile.language === code) return
    try {
      setProfile(await updateProfile(profile.id, { language: code as typeof profile.language }))
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <header className="bg-white/70 backdrop-blur-xl backdrop-saturate-150 border-b border-black/5 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-30 print:hidden">
      <div className="flex items-center gap-3">
        <MobileNav />
        <div>
          <h1 className="text-[15px] font-semibold tracking-tight text-secondary hidden md:block">
            {property?.name ?? t('app.name')}
          </h1>
          <p className="text-xs text-gray-500 tabular-nums">{formatLongDate(property?.timezone, new Date(), i18n.language === 'en' ? 'en-US' : `${i18n.language}-IN`)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3.5 min-h-9 rounded-full text-sm text-gray-600 hover:bg-black/5 transition-colors">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{t('common.language')}</span>
          </button>
          <div className="absolute right-0 top-full pt-1.5 hidden group-hover:block group-focus-within:block">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-float ring-1 ring-black/5 p-1.5 min-w-[160px] animate-pop-in">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full text-left px-3 min-h-10 rounded-xl text-[15px] hover:bg-black/5 transition-colors ${
                  i18n.language === lang.code ? 'text-primary font-medium' : 'text-secondary'
                }`}
              >
                {lang.label}
              </button>
            ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
