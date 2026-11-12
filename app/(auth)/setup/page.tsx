'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createPropertyForUser } from '@/lib/services/setup'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'

const setupSchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  full_name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  timezone: z.string().min(1),
  check_in_time: z.string().min(1),
  check_out_time: z.string().min(1),
})

type SetupFormData = z.infer<typeof setupSchema>

const TIMEZONES = [
  { value: 'America/New_York',    label: 'Eastern (ET)' },
  { value: 'America/Chicago',     label: 'Central (CT)' },
  { value: 'America/Denver',      label: 'Mountain (MT)' },
  { value: 'America/Phoenix',     label: 'Arizona (no DST)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Anchorage',   label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu',    label: 'Hawaii (HT)' },
  { value: 'Asia/Kolkata',        label: 'India (IST)' },
]

export default function SetupPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      timezone: 'America/Chicago',
      check_in_time: '15:00',
      check_out_time: '11:00',
    },
  })

  const onSubmit = async (data: SetupFormData) => {
    setLoading(true)
    try {
      await createPropertyForUser(data)
      router.push('/dashboard')
      router.refresh()
    } catch (e: unknown) {
      toast.error((e as Error).message)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-float ring-1 ring-white/20 overflow-hidden animate-pop-in">
        {/* Header */}
        <div className="bg-secondary px-8 py-6 flex items-center gap-4">
          <Image
            src="/logos/atithi-logo-128x128.png"
            alt="Atithi"
            width={48}
            height={48}
          />
          <div>
            <h1 className="font-display text-2xl font-bold text-white">{t('setup.welcome')}</h1>
            <p className="text-sm text-white/60">{t('setup.subtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-6 space-y-5">
          {/* Your name */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('setup.aboutYou')}</p>
            <Input
              label={t('setup.yourName')}
              placeholder={t('setup.yourNamePlaceholder')}
              error={errors.full_name?.message}
              {...register('full_name')}
            />
          </div>

          <div className="border-t border-black/5" />

          {/* Property details */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('setup.propertyDetails')}</p>
            <div className="space-y-4">
              <Input
                label={t('setup.propertyName')}
                placeholder={t('setup.propertyNamePlaceholder')}
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label={t('settings.phone')}
                type="tel"
                placeholder="(512) 555-0100"
                {...register('phone')}
              />
              <Input
                label={t('settings.address')}
                placeholder="1234 Main St"
                {...register('address')}
              />
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Input
                    label={t('settings.city')}
                    placeholder="Austin"
                    {...register('city')}
                  />
                </div>
                <Input label={t('settings.state')} placeholder="TX" {...register('state')} />
                <Input label={t('settings.zip')} placeholder="78701" {...register('zip')} />
              </div>
            </div>
          </div>

          <div className="border-t border-black/5" />

          {/* Times & timezone */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('setup.hours')}</p>
            <div className="space-y-4">
              <Select
                label={t('settings.timezone')}
                options={TIMEZONES}
                error={errors.timezone?.message}
                {...register('timezone')}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('settings.checkInTime')}
                  type="time"
                  error={errors.check_in_time?.message}
                  {...register('check_in_time')}
                />
                <Input
                  label={t('settings.checkOutTime')}
                  type="time"
                  error={errors.check_out_time?.message}
                  {...register('check_out_time')}
                />
              </div>
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            {loading ? t('setup.creating') : t('setup.create')}
          </Button>

          <p className="text-center text-xs text-gray-400">
            {t('setup.footer')}
          </p>
        </form>
      </div>

      <p className="text-center text-xs text-white/30 mt-6">
        अतिथि देवो भव · The guest is god.
      </p>
    </div>
  )
}
