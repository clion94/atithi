'use client'

import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Front-desk data changes under you (other staff, other devices):
            // always revalidate on mount/focus, but show cached rows meanwhile.
            staleTime: 0,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      })
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
