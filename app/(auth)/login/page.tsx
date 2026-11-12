'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import Logo from '@/components/Logo'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { LANGUAGES, setStoredLanguage } from '@/lib/i18n/client'
import { useToast } from '@/components/ui/Toast'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { t, i18n } = useTranslation()
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
          <button className="flex items-center gap-1.5 px-3.5 min-h-9 rounded-full text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <Globe className="h-4 w-4" />
            <span>{LANGUAGES.find((l) => l.code === i18n.language)?.label ?? 'English'}</span>
          </button>
          <div className="absolute right-0 top-full pt-1.5 hidden group-hover:block group-focus-within:block z-10">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-float ring-1 ring-black/5 p-1.5 min-w-[160px] animate-pop-in">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-black/[0.03] transition-colors ${
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

      {/* Card */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-float ring-1 ring-white/20 p-8 animate-pop-in">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <Logo size={72} stacked className="mb-3" />
          <p className="text-sm text-gray-500">{t('app.tagline')}</p>
        </div>

        {/* Form */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-secondary">{t('auth.welcomeBack')}</h2>
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

    </div>
  )
}
