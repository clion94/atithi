'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateProperty, updateProfile } from '@/lib/services/settings'
import { useAppStore } from '@/store/useAppStore'
import { setStoredLanguage } from '@/lib/i18n/client'
import i18n from '@/lib/i18n/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

const propertySchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  timezone: z.string().min(1),
  check_in_time: z.string().min(1),
  check_out_time: z.string().min(1),
})

const profileSchema = z.object({
  full_name: z.string().optional(),
  language: z.enum(['en', 'gu', 'hi']),
})

type PropertyFormData = z.infer<typeof propertySchema>
type ProfileFormData = z.infer<typeof profileSchema>

const US_TIMEZONES = [
  { value: 'America/New_York',    label: 'Eastern (ET)' },
  { value: 'America/Chicago',     label: 'Central (CT)' },
  { value: 'America/Denver',      label: 'Mountain (MT)' },
  { value: 'America/Phoenix',     label: 'Arizona (no DST)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Anchorage',   label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu',    label: 'Hawaii (HT)' },
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'gu', label: 'ગુજરાતી' },
  { value: 'hi', label: 'हिंदी' },
]

export default function SettingsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const property = useAppStore((s) => s.property)
  const profile = useAppStore((s) => s.profile)
  const setProperty = useAppStore((s) => s.setProperty)
  const setProfile = useAppStore((s) => s.setProfile)
  const [savingProperty, setSavingProperty] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  const {
    register: regProp,
    handleSubmit: handlePropSubmit,
    reset: resetProp,
    formState: { errors: propErrors, isDirty: propDirty },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
  })

  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isDirty: profileDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    if (property) {
      resetProp({
        name: property.name,
        address: property.address ?? '',
        city: property.city ?? '',
        state: property.state ?? '',
        zip: property.zip ?? '',
        phone: property.phone ?? '',
        email: property.email ?? '',
        timezone: property.timezone,
        check_in_time: property.check_in_time,
        check_out_time: property.check_out_time,
      })
    }
  }, [property, resetProp])

  useEffect(() => {
    if (profile) {
      resetProfile({
        full_name: profile.full_name ?? '',
        language: profile.language,
      })
    }
  }, [profile, resetProfile])

  const onSaveProperty = async (data: PropertyFormData) => {
    if (!property) return
    setSavingProperty(true)
    try {
      const updated = await updateProperty(property.id, {
        ...data,
        email: data.email || undefined,
      })
      setProperty(updated)
      toast.success('Property settings saved')
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSavingProperty(false)
    }
  }

  const onSaveProfile = async (data: ProfileFormData) => {
    if (!profile) return
    setSavingProfile(true)
    try {
      const updated = await updateProfile(profile.id, data)
      setProfile(updated)
      setStoredLanguage(data.language)
      i18n.changeLanguage(data.language)
      toast.success('Profile saved')
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-2.5">
        <Image src="/duotone/settings.svg" alt="" width={28} height={28} />
        <h1 className="font-display text-[28px] md:text-[34px] leading-tight font-bold tracking-tight text-secondary">{t('nav.settings')}</h1>
      </div>

      {/* Property Settings */}
      <form onSubmit={handlePropSubmit(onSaveProperty)}>
        <Card>
          <h2 className="text-[17px] font-semibold tracking-tight text-secondary mb-5">{t('settings.propertyInfo')}</h2>
          <div className="space-y-4">
            <Input
              label={t('settings.propertyName')}
              error={propErrors.name?.message}
              {...regProp('name')}
            />
            <Input
              label={t('settings.address')}
              error={propErrors.address?.message}
              {...regProp('address')}
            />
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <Input
                  label={t('settings.city')}
                  error={propErrors.city?.message}
                  {...regProp('city')}
                />
              </div>
              <Input
                label={t('settings.state')}
                error={propErrors.state?.message}
                {...regProp('state')}
              />
              <Input
                label={t('settings.zip')}
                error={propErrors.zip?.message}
                {...regProp('zip')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('settings.phone')}
                type="tel"
                error={propErrors.phone?.message}
                {...regProp('phone')}
              />
              <Input
                label={t('settings.email')}
                type="email"
                error={propErrors.email?.message}
                {...regProp('email')}
              />
            </div>
            <Select
              label={t('settings.timezone')}
              options={US_TIMEZONES}
              error={propErrors.timezone?.message}
              {...regProp('timezone')}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('settings.checkInTime')}
                type="time"
                error={propErrors.check_in_time?.message}
                {...regProp('check_in_time')}
              />
              <Input
                label={t('settings.checkOutTime')}
                type="time"
                error={propErrors.check_out_time?.message}
                {...regProp('check_out_time')}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit" loading={savingProperty} disabled={!propDirty}>
              {t('actions.save')}
            </Button>
          </div>
        </Card>
      </form>

      {/* Profile Settings */}
      <form onSubmit={handleProfileSubmit(onSaveProfile)}>
        <Card>
          <h2 className="text-[17px] font-semibold tracking-tight text-secondary mb-5">{t('settings.myProfile')}</h2>
          <div className="space-y-4">
            <Input
              label={t('settings.fullName')}
              error={profileErrors.full_name?.message}
              {...regProfile('full_name')}
            />
            <Select
              label={t('common.language')}
              options={LANGUAGES}
              error={profileErrors.language?.message}
              {...regProfile('language')}
            />
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/[0.03]">
              <Image src="/outline/profile.svg" alt="" width={18} height={18} />
              <div>
                <p className="text-sm font-medium text-secondary">{t('settings.role')}</p>
                <p className="text-xs text-gray-500 capitalize">{profile?.role ?? '—'}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit" loading={savingProfile} disabled={!profileDirty}>
              {t('actions.save')}
            </Button>
          </div>
        </Card>
      </form>

      {/* App version */}
      <p className="text-center text-xs text-gray-400 pb-4">
        Atithi PMS · अतिथि देवो भव
      </p>
    </div>
  )
}
