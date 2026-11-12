'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Users, AlertTriangle } from 'lucide-react'
import { useGuests } from '@/hooks/useGuests'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import Button from '@/components/ui/Button'
import ErrorState from '@/components/ui/ErrorState'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils/dates'

export default function GuestsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const { data, isPending, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGuests(debouncedSearch)
  const guests = data?.pages.flatMap((p) => p.rows) ?? []
  const loading = isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[28px] md:text-[34px] leading-tight font-bold tracking-tight text-secondary">{t('nav.guests')}</h1>
        <span className="text-sm text-gray-500">{t('guest.count', { count: guests.length })}{hasNextPage ? '+' : ''}</span>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder={t('guest.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : loading ? (
        <div className="flex items-center justify-center h-48">
          <Spinner size="lg" />
        </div>
      ) : guests.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>{t('common.noResults')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card ring-1 ring-black/5 overflow-hidden">
          <div className="divide-y divide-black/5">
            {guests.map((guest) => (
              <Link key={guest.id} href={`/guests/${guest.id}`}>
                <div className="flex items-center justify-between p-4 hover:bg-black/[0.03] transition-colors cursor-pointer">
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
                      <Badge variant="red">{t('guest.banned')}</Badge>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {guest.city ? `${guest.city}, ${guest.state}` : ''}
                      </span>
                    )}
                    <p className="text-xs text-gray-300 mt-1">
                      {t('guest.since', { date: formatDate(guest.created_at) })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {hasNextPage && (
            <div className="p-3 border-t border-black/5 text-center">
              <Button variant="ghost" size="sm" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
                {t('actions.loadMore')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
