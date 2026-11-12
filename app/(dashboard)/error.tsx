'use client'

import { useEffect } from 'react'
import ErrorState from '@/components/ui/ErrorState'

// Catches anything a dashboard page throws while rendering, inside the layout,
// so the sidebar stays usable and the user can retry instead of seeing a blank page.
export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return <ErrorState message={error.message || 'Something went wrong'} onRetry={unstable_retry} />
}
