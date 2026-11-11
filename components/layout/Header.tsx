'use client'

import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { Globe } from 'lucide-react'
import { setStoredLanguage } from '@/lib/i18n/client'
import i18n from '@/lib/i18n/client'
import { useAppStore } from '@/store/useAppStore'
import MobileNav from './MobileNav'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'hi', label: 'हिंदी' },
]

export default function Header() {
  const { t } = useTranslation()
  const property = useAppStore((s) => s.property)

  const handleLanguageChange = (code: string) => {
    setStoredLanguage(code)
    i18n.changeLanguage(code)
  }

  return (
    <header className="bg-white/70 backdrop-blur-xl backdrop-saturate-150 border-b border-black/5 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <MobileNav />
        <div>
          <h1 className="text-[15px] font-semibold tracking-tight text-secondary hidden md:block">
            {property?.name ?? t('app.name')}
          </h1>
          <p className="text-xs text-gray-500 tabular-nums">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
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
