'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Logo from '@/components/Logo'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

// Shown to someone whose account was deactivated while they were still signed in.
export default function DeactivatedPage() {
  const { t } = useTranslation()
  const router = useRouter()

  const signOut = async () => {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-float ring-1 ring-white/20 p-8 text-center animate-pop-in">
        <div className="flex flex-col items-center mb-6">
          <Logo size={56} stacked />
        </div>
        <h1 className="font-display text-xl font-bold text-secondary">{t('auth.deactivatedTitle')}</h1>
        <p className="text-sm text-gray-500 mt-2 mb-6">{t('auth.deactivatedBody')}</p>
        <Button onClick={signOut} className="w-full" size="lg">
          {t('actions.signOut')}
        </Button>
      </div>
    </div>
  )
}
