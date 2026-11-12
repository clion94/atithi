'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Logo from '@/components/Logo'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { errorMessage } from '@/lib/utils/errors'

const schema = z
  .object({
    password: z.string().min(8, 'min'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'match' })

type FormData = z.infer<typeof schema>

/**
 * Used twice: forced on a new team member's first sign-in (their one-time password was
 * handed over in person), and by anyone who wants to change their password later.
 */
export default function ChangePasswordPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ password }: FormData) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password, data: { must_change_password: false } })
      if (error) throw error
      toast.success(t('auth.passwordChanged'))
      router.push('/dashboard')
      router.refresh()
    } catch (e) {
      toast.error(errorMessage(e))
      setLoading(false)
    }
  }

  const message = (code?: string) =>
    code === 'min' ? t('auth.passwordTooShort') : code === 'match' ? t('auth.passwordsDontMatch') : undefined

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-float ring-1 ring-white/20 p-8 animate-pop-in">
        <div className="flex flex-col items-center mb-6">
          <Logo size={56} stacked />
        </div>
        <h1 className="font-display text-xl font-bold text-secondary">{t('auth.changePassword')}</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">{t('auth.changePasswordHint')}</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t('auth.newPassword')}
            type="password"
            autoComplete="new-password"
            error={message(errors.password?.message)}
            {...register('password')}
          />
          <Input
            label={t('auth.confirmPassword')}
            type="password"
            autoComplete="new-password"
            error={message(errors.confirm?.message)}
            {...register('confirm')}
          />
          <Button type="submit" loading={loading} className="w-full" size="lg">
            {t('auth.changePassword')}
          </Button>
        </form>
      </div>
    </div>
  )
}
