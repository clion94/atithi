'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { createReservation } from '@/lib/services/reservations'
import { getAvailableRooms } from '@/lib/services/rooms'
import { getGuests, createGuest } from '@/lib/services/guests'
import { reservationSchema, type ReservationFormData } from '@/lib/validations/reservation'
import { guestSchema, type GuestFormData } from '@/lib/validations/guest'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { useAppStore } from '@/store/useAppStore'
import { nightsBetween, todayISO, formatDate } from '@/lib/utils/dates'
import { useQueryClient } from '@tanstack/react-query'
import { errorMessage } from '@/lib/utils/errors'
import { formatCurrency } from '@/lib/utils/currency'
import type { Room, Guest } from '@/types'

type Step = 1 | 2 | 3

export default function NewReservationPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const toast = useToast()
  const property = useAppStore((s) => s.property)
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>(1)
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [guestSearch, setGuestSearch] = useState('')
  const [newGuestMode, setNewGuestMode] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      check_in_date: todayISO(property?.timezone),
      adults: 1,
      children: 0,
      source: 'walk_in',
    },
  })

  const {
    register: registerGuest,
    handleSubmit: handleSubmitGuest,
    formState: { errors: guestErrors },
  } = useForm<GuestFormData>({ resolver: zodResolver(guestSchema) })

  const checkIn = useWatch({ control, name: 'check_in_date' })
  const checkOut = useWatch({ control, name: 'check_out_date' })
  const roomId = useWatch({ control, name: 'room_id' })
  const ratePerNight = useWatch({ control, name: 'rate_per_night' })

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0
  const total = nights * (ratePerNight ?? 0)
  const selectedRoom = availableRooms.find((r) => r.id === roomId)

  // Step 1: fetch available rooms when dates change
  useEffect(() => {
    if (checkIn && checkOut && checkOut > checkIn) {
      getAvailableRooms(checkIn, checkOut)
        .then(setAvailableRooms)
        .catch((e) => toast.error(errorMessage(e)))
    }
  }, [checkIn, checkOut, toast])

  // Step 2: fetch guests
  useEffect(() => {
    if (step === 2) {
      getGuests(guestSearch)
        .then((page) => setGuests(page.rows))
        .catch((e) => toast.error(errorMessage(e)))
    }
  }, [step, guestSearch, toast])

  const handleRoomSelect = (room: Room) => {
    setValue('room_id', room.id)
    setValue('rate_per_night', room.base_rate)
  }

  const handleGuestSelect = (guest: Guest) => {
    if (guest.is_banned) {
      toast.error(`⚠️ ${t('guest.bannedWarning', { name: `${guest.first_name} ${guest.last_name}`, reason: guest.ban_reason ?? t('guest.noReason') })}`)
      return
    }
    setSelectedGuest(guest)
    setValue('guest_id', guest.id)
    setStep(3)
  }

  const handleNewGuest = async (data: GuestFormData) => {
    if (!property) return
    setLoading(true)
    try {
      const guest = await createGuest({ ...data, property_id: property.id })
      setSelectedGuest(guest)
      setValue('guest_id', guest.id)
      setStep(3)
    } catch (e: unknown) {
      toast.error(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ReservationFormData) => {
    if (!property) return
    setLoading(true)
    try {
      const reservation = await createReservation({ ...data, property_id: property.id })
      await queryClient.invalidateQueries()
      toast.success(t('reservation.created'))
      router.push(`/reservations/${reservation.id}`)
    } catch (e: unknown) {
      toast.error(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  const sourceOptions = [
    { value: 'walk_in', label: t('reservation.source_options.walk_in') },
    { value: 'phone', label: t('reservation.source_options.phone') },
    { value: 'booking_com', label: t('reservation.source_options.booking_com') },
    { value: 'expedia', label: t('reservation.source_options.expedia') },
    { value: 'direct_web', label: t('reservation.source_options.direct_web') },
    { value: 'other', label: t('reservation.source_options.other') },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/reservations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            {t('actions.back')}
          </Button>
        </Link>
        <h1 className="font-display text-[28px] md:text-[34px] leading-tight font-bold tracking-tight text-secondary">{t('reservation.new')}</h1>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              s <= step ? 'bg-primary' : 'bg-black/10'
            }`}
          />
        ))}
      </div>
      <div className="flex text-xs text-gray-500 justify-between px-1">
        <span>{t('reservation.stepDatesRoom')}</span>
        <span>{t('reservation.guest')}</span>
        <span>{t('actions.confirm')}</span>
      </div>

      {/* Step 1: Dates & Room */}
      {step === 1 && (
        <Card>
          <h2 className="text-[17px] font-semibold tracking-tight text-secondary mb-4">{t('reservation.selectDatesRoom')}</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Input
              label={t('reservation.checkIn')}
              type="date"
              min={todayISO(property?.timezone)}
              error={errors.check_in_date?.message}
              {...register('check_in_date')}
            />
            <Input
              label={t('reservation.checkOut')}
              type="date"
              min={checkIn ?? todayISO(property?.timezone)}
              error={errors.check_out_date?.message}
              {...register('check_out_date')}
            />
          </div>

          {checkIn && checkOut && checkOut > checkIn && (
            <>
              <p className="text-sm text-gray-500 mb-3">
                {availableRooms.length} rooms available for {nights} night{nights !== 1 ? 's' : ''}
              </p>
              {errors.room_id && (
                <p className="text-sm text-error mb-3">{errors.room_id.message}</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {availableRooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => handleRoomSelect(room)}
                    className={`p-3.5 rounded-2xl ring-2 text-left transition active:scale-[0.98] ${
                      roomId === room.id
                        ? 'ring-primary bg-primary/5'
                        : 'ring-black/5 bg-white hover:ring-primary/40'
                    }`}
                  >
                    <p className="font-bold text-secondary">Room {room.number}</p>
                    <p className="text-xs text-gray-500 capitalize">{room.room_type}</p>
                    <p className="text-sm font-medium text-primary mt-1">
                      {formatCurrency(room.base_rate)}/night
                    </p>
                  </button>
                ))}
              </div>
              {availableRooms.length === 0 && (
                <p className="text-center text-gray-400 py-4">{t('reservation.noRoomsForDates')}</p>
              )}
            </>
          )}

          <div className="pt-4">
            <Button
              onClick={() => setStep(2)}
              disabled={!roomId || nights <= 0}
              className="w-full"
            >
              {t('actions.next')}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Guest */}
      {step === 2 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[17px] font-semibold tracking-tight text-secondary">{t('reservation.selectGuest')}</h2>
            <Button
              size="sm"
              variant={newGuestMode ? 'outline' : 'ghost'}
              onClick={() => setNewGuestMode(!newGuestMode)}
            >
              {newGuestMode ? 'Search Existing' : '+ New Guest'}
            </Button>
          </div>

          {newGuestMode ? (
            <form onSubmit={handleSubmitGuest(handleNewGuest)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t('guest.firstName')}
                  error={guestErrors.first_name?.message}
                  {...registerGuest('first_name')}
                />
                <Input
                  label={t('guest.lastName')}
                  error={guestErrors.last_name?.message}
                  {...registerGuest('last_name')}
                />
              </div>
              <Input label={t('guest.phone')} type="tel" {...registerGuest('phone')} />
              <Input label={t('guest.email')} type="email" error={guestErrors.email?.message} {...registerGuest('email')} />
              <Button type="submit" loading={loading} className="w-full">
                {t('actions.addGuestContinue')}
              </Button>
            </form>
          ) : (
            <>
              <Input
                placeholder={t('guest.searchPlaceholder')}
                value={guestSearch}
                onChange={(e) => setGuestSearch(e.target.value)}
                className="mb-3"
              />
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {guests.map((guest) => (
                  <button
                    key={guest.id}
                    type="button"
                    onClick={() => handleGuestSelect(guest)}
                    className="w-full text-left p-3.5 rounded-2xl bg-white ring-1 ring-black/5 hover:ring-primary/40 hover:bg-black/[0.02] transition active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-secondary">
                          {guest.first_name} {guest.last_name}
                        </p>
                        <p className="text-xs text-gray-400">{guest.phone} · {guest.email}</p>
                      </div>
                      {guest.is_banned && (
                        <div className="flex items-center gap-1 text-error text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          {t('guest.bannedBadge')}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
                {guests.length === 0 && (
                  <p className="text-center text-gray-400 py-4">{t('common.noResults')}</p>
                )}
              </div>
            </>
          )}

          <div className="pt-4">
            <Button variant="outline" onClick={() => setStep(1)} className="w-full">
              {t('actions.back')}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <h2 className="text-[17px] font-semibold tracking-tight text-secondary mb-4">{t('reservation.confirmTitle')}</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('reservation.guest')}</span>
                <span className="font-medium text-secondary">
                  {selectedGuest?.first_name} {selectedGuest?.last_name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('reservation.room')}</span>
                <span className="font-medium text-secondary">
                  Room {selectedRoom?.number} ({selectedRoom?.room_type})
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('reservation.checkIn')}</span>
                <span className="font-medium text-secondary">{formatDate(checkIn)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('reservation.checkOut')}</span>
                <span className="font-medium text-secondary">{formatDate(checkOut)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('reservation.nights')}</span>
                <span className="font-medium text-secondary">{nights}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('reservation.rate')}</span>
                <span className="font-medium text-secondary">{formatCurrency(ratePerNight ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-black/5 pt-3">
                <span className="text-secondary">{t('reservation.total')}</span>
                <span className="text-primary text-lg">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input
                label={t('reservation.adults')}
                type="number"
                min={1}
                max={10}
                error={errors.adults?.message}
                {...register('adults', { valueAsNumber: true })}
              />
              <Input
                label={t('reservation.children')}
                type="number"
                min={0}
                max={10}
                error={errors.children?.message}
                {...register('children', { valueAsNumber: true })}
              />
            </div>

            <Select
              label={t('reservation.source')}
              options={sourceOptions}
              error={errors.source?.message}
              {...register('source')}
              className="mb-4"
            />

            <Textarea label={t('reservation.specialRequests')} className="mb-6" rows={3}
                {...register('special_requests')}
              />

            <div className="flex gap-3">
              <Button type="submit" loading={loading} className="flex-1">
                {t('reservation.confirmTitle')}
              </Button>
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                {t('actions.back')}
              </Button>
            </div>
          </Card>
        </form>
      )}
    </div>
  )
}
