'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Users, AlertTriangle } from 'lucide-react'
import { getGuests } from '@/lib/services/guests'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import type { Guest } from '@/types'
import { formatDate } from '@/lib/utils/dates'

export default function GuestsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await getGuests(search)
      setGuests(data)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [search, toast])

  useEffect(() => {
    const timeout = setTimeout(() => load(), 300)
    return () => clearTimeout(timeout)
  }, [load])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-secondary">{t('nav.guests')}</h1>
        <span className="text-sm text-gray-500">{guests.length} guests</span>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Spinner size="lg" />
        </div>
      ) : guests.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>{t('common.noResults')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {guests.map((guest) => (
              <Link key={guest.id} href={`/guests/${guest.id}`}>
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-secondary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-secondary">
                        {guest.first_name[0]}{guest.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-secondary">
                        {guest.first_name} {guest.last_name}
                        {guest.is_banned && (
                          <AlertTriangle className="inline h-3 w-3 text-error ml-2" />
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {guest.phone}{guest.email ? ` · ${guest.email}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {guest.is_banned ? (
                      <Badge variant="red">Banned</Badge>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {guest.city ? `${guest.city}, ${guest.state}` : ''}
                      </span>
                    )}
                    <p className="text-xs text-gray-300 mt-1">
                      Since {formatDate(guest.created_at)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
