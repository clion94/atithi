'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { walkInCheckIn } from '@/lib/services/reservations'
import { getAvailableRooms } from '@/lib/services/rooms'
import { getGuests, createGuest } from '@/lib/services/guests'
import { guestSchema, type GuestFormData } from '@/lib/validations/guest'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { useAppStore } from '@/store/useAppStore'
import { nightsBetween, todayISO, formatDate } from '@/lib/utils/dates'
import { formatCurrency } from '@/lib/utils/currency'
import type { Room, Guest } from '@/types'

type Step = 1 | 2 | 3

// Step 3 only needs adults / children / special_requests from RHF
type Step3Fields = { adults: number; children: number; special_requests?: string }
const step3Schema = import('zod').then(({ z }) =>
  z.object({
    adults: z.number().int().min(1).max(10),
    children: z.number().int().min(0).max(10),
    special_requests: z.string().optional(),
  })
)
void step3Schema // suppress unused warning

function tomorrowISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export default function WalkInPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const toast = useToast()
  const property = useAppStore((s) => s.property)
  const today = todayISO()
  const tomorrow = tomorrowISO()

  const [step, setStep] = useState<Step>(1)
  const [checkOutDate, setCheckOutDate] = useState('')
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [guestSearch, setGuestSearch] = useState('')
  const [newGuestMode, setNewGuestMode] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [loading, setLoading] = useState(false)

  // RHF only for step 3 inputs (adults / children / special_requests)
  const { register, watch } = useForm<Step3Fields>({
    defaultValues: { adults: 1, children: 0 },
  })

  // Guest form
  const {
    register: registerGuest,
    handleSubmit: handleSubmitGuest,
    formState: { errors: guestErrors },
  } = useForm<GuestFormData>({ resolver: zodResolver(guestSchema) })

  const nights = checkOutDate ? nightsBetween(today, checkOutDate) : 0

  useEffect(() => {
    if (checkOutDate && checkOutDate > today) {
      getAvailableRooms(today, checkOutDate)
        .then((rooms) => {
          setAvailableRooms(rooms)
          // deselect room if it's no longer available
          if (selectedRoom && !rooms.find((r) => r.id === selectedRoom.id)) {
            setSelectedRoom(null)
          }
        })
        .catch((e) => toast.error(e.message))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkOutDate, today])

  useEffect(() => {
    if (step === 2) {
      getGuests(guestSearch)
        .then(setGuests)
        .catch((e) => toast.error(e.message))
    }
  }, [step, guestSearch, toast])

  const handleGuestSelect = (guest: Guest) => {
    if (guest.is_banned) {
      toast.error(`⚠️ ${guest.first_name} ${guest.last_name} is banned: ${guest.ban_reason ?? 'No reason given'}`)
      return
    }
    setSelectedGuest(guest)
    setStep(3)
  }

  const handleNewGuest = async (data: GuestFormData) => {
    if (!property) return
    setLoading(true)
    try {
      const guest = await createGuest({ ...data, property_id: property.id })
      setSelectedGuest(guest)
      setStep(3)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Build payload directly from component state — no RHF hidden-input tricks needed
  const handleCheckIn = async () => {
    if (!property || !selectedGuest || !selectedRoom || !checkOutDate) return
    setLoading(true)
    try {
      const reservation = await walkInCheckIn({
        property_id: property.id,
        room_id: selectedRoom.id,
        guest_id: selectedGuest.id,
        check_in_date: today,
        check_out_date: checkOutDate,
        rate_per_night: selectedRoom.base_rate,
        adults: watch('adults') ?? 1,
        children: watch('children') ?? 0,
        source: 'walk_in',
        special_requests: watch('special_requests') || undefined,
      })
      toast.success(`${selectedGuest.first_name} checked in to Room ${selectedRoom.number}`)
      router.push(`/reservations/${reservation.id}`)
      router.refresh()
    } catch (e: unknown) {
      toast.error((e as Error).message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/reservations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-2.5">
          <Image src="/duotone/checkin.svg" alt="" width={28} height={28} />
          <h1 className="font-display text-2xl font-bold text-secondary">Walk-in Check-in</h1>
        </div>
      </div>

      {/* Today banner */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-accent/10 border border-accent/20 text-sm text-accent font-medium">
        <Image src="/duotone/checkin.svg" alt="" width={18} height={18} />
        Checking in today · {formatDate(today)}
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {([1, 2, 3] as Step[]).map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <div className="flex text-xs text-gray-500 justify-between px-1">
        <span>Room</span>
        <span>Guest</span>
        <span>Check In</span>
      </div>

      {/* Step 1: Room & checkout date */}
      {step === 1 && (
        <Card>
          <h2 className="font-semibold text-secondary mb-4">Select Room & Departure Date</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-secondary mb-1.5">
              Check-out Date
            </label>
            <input
              type="date"
              min={tomorrow}
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {checkOutDate && checkOutDate > today && (
            <>
              <p className="text-sm text-gray-500 mb-3">
                {availableRooms.length} rooms available · {nights} night{nights !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {availableRooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setSelectedRoom(room)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedRoom?.id === room.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-primary/40'
                    }`}
                  >
                    <p className="font-bold text-secondary">Room {room.number}</p>
                    <p className="text-xs text-gray-500 capitalize">{room.room_type}</p>
                    <p className="text-sm font-medium text-primary mt-1">
                      {formatCurrency(room.base_rate)}/night
                    </p>
                  </button>
                ))}
                {availableRooms.length === 0 && (
                  <p className="col-span-3 text-center text-gray-400 py-4">No rooms available</p>
                )}
              </div>
            </>
          )}

          <div className="pt-4">
            <Button
              onClick={() => setStep(2)}
              disabled={!selectedRoom || nights <= 0}
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
            <h2 className="font-semibold text-secondary">Select or Add Guest</h2>
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
                Add Guest & Continue
              </Button>
            </form>
          ) : (
            <>
              <Input
                placeholder="Search by name or phone..."
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
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary/40 hover:bg-gray-50 transition-all"
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
                          Banned
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

      {/* Step 3: Confirm & Check In — no <form>, payload built directly from state */}
      {step === 3 && selectedGuest && selectedRoom && (
        <Card>
          <h2 className="font-semibold text-secondary mb-4">Confirm & Check In</h2>
          <div className="space-y-3 mb-6">
            <Row label="Guest" value={`${selectedGuest.first_name} ${selectedGuest.last_name}`} />
            <Row label="Room" value={`Room ${selectedRoom.number} (${selectedRoom.room_type})`} />
            <Row label="Check In" value={formatDate(today)} />
            <Row label="Check Out" value={formatDate(checkOutDate)} />
            <Row label="Nights" value={String(nights)} />
            <Row label="Rate / Night" value={formatCurrency(selectedRoom.base_rate)} />
            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-3">
              <span className="text-secondary">Total</span>
              <span className="text-primary text-lg">{formatCurrency(nights * selectedRoom.base_rate)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Input
              label="Adults"
              type="number"
              min={1}
              max={10}
              {...register('adults', { valueAsNumber: true })}
            />
            <Input
              label="Children"
              type="number"
              min={0}
              max={10}
              {...register('children', { valueAsNumber: true })}
            />
          </div>

          <div className="flex flex-col gap-1 mb-6">
            <label className="text-sm font-medium text-secondary">{t('reservation.specialRequests')}</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={2}
              {...register('special_requests')}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              loading={loading}
              onClick={handleCheckIn}
              className="flex-1"
            >
              <Image src="/filled/checkin.svg" alt="" width={18} height={18} />
              Check In Now
            </Button>
            <Button type="button" variant="outline" onClick={() => setStep(2)}>
              {t('actions.back')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-secondary">{value}</span>
    </div>
  )
}
