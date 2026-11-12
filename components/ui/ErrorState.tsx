'use client'

import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation()
  return (
    <div role="alert" className="text-center py-12 text-gray-500">
      <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-error opacity-70" />
      <p className="mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}
