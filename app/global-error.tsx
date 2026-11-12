'use client'

import { useEffect } from 'react'

// Last-resort boundary: replaces the root layout, so it brings its own <html>/<body>
// and uses plain inline styles (globals.css is not guaranteed to be loaded here).
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', display: 'grid', placeItems: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <h2>Something went wrong</h2>
          <button
            onClick={() => unstable_retry()}
            style={{ marginTop: 16, padding: '10px 20px', borderRadius: 999, border: '1px solid #ccc', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
