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
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <MobileNav />
        <div>
          <h1 className="text-sm font-semibold text-secondary hidden md:block">
            {property?.name ?? t('app.name')}
          </h1>
          <p className="text-xs text-gray-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{t('common.language')}</span>
          </button>
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] hidden group-hover:block">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  i18n.language === lang.code ? 'text-primary font-medium' : 'text-secondary'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
