'use client'

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/cn'

interface LogoProps {
  /** Size of the square mark in px. */
  size?: number
  /** Show the app name next to (or under) the mark. */
  showName?: boolean
  /** Stack the name under the mark instead of beside it. */
  stacked?: boolean
  /** Use light text for dark backgrounds. */
  onDark?: boolean
  className?: string
}

/**
 * The app mark (a "W" drawn as a route to a waypoint, on the brand violet) plus its name, drawn in SVG/text so
 * renaming the app means changing `app.name` in the locale files, not redrawing images.
 * Keep the artwork in sync with app/icon.svg.
 */
export default function Logo({ size = 40, showName = true, stacked = false, onDark = false, className }: LogoProps) {
  const { t } = useTranslation()
  const name = t('app.name')

  return (
    <div className={cn('flex items-center gap-3', stacked && 'flex-col gap-2', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        role={showName ? undefined : 'img'}
        aria-label={showName ? undefined : name}
        aria-hidden={showName ? true : undefined}
        className="shrink-0"
      >
        <rect width="48" height="48" rx="12" fill="#5B3FD9" />
        {/* A "W" drawn as a route that ends in a destination dot */}
        <path
          d="M12 15l6.5 18L24 20l5.5 13L36 15"
          fill="none"
          stroke="#fff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="36" cy="15" r="4.5" fill="#E0457B" stroke="#fff" strokeWidth="2" />
      </svg>
      {showName && (
        <span
          className={cn(
            'font-display font-bold tracking-tight',
            stacked ? 'text-2xl' : 'text-xl',
            onDark ? 'text-white' : 'text-secondary'
          )}
        >
          {name}
        </span>
      )}
    </div>
  )
}
