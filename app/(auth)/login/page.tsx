'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { setStoredLanguage } from '@/lib/i18n/client'
import i18n from '@/lib/i18n/client'
import { useToast } from '@/components/ui/Toast'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'hi', label: 'हिंदी' },
]

export default function LoginPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      router.push('/')
      router.refresh()
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleLanguageChange = (code: string) => {
    setStoredLanguage(code)
    i18n.changeLanguage(code)
  }

  return (
    <div className="w-full max-w-sm">
      {/* Language selector */}
      <div className="flex justify-end mb-6">
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <Globe className="h-4 w-4" />
            <span>{LANGUAGES.find((l) => l.code === i18n.language)?.label ?? 'English'}</span>
          </button>
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] hidden group-hover:block z-10">
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

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logos/atithi-logo-256x256.png"
            alt={t('app.name')}
            width={96}
            height={96}
            className="mb-3"
            priority
          />
          <p className="text-sm text-gray-500 italic">{t('app.tagline')}</p>
        </div>

        {/* Form */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-secondary">{t('auth.welcomeBack')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('auth.signInToContinue')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t('auth.email')}
            type="email"
            placeholder="owner@motel.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label={t('auth.password')}
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-white/40 mt-6">
        अतिथि देवो भव · The guest is god.
      </p>
    </div>
  )
}
