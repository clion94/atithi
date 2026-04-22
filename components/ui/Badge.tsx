import { cn } from '@/lib/utils/cn'
import type { RoomStatus, ReservationStatus } from '@/types'

type BadgeVariant = 'green' | 'amber' | 'blue' | 'red' | 'gray' | 'teal' | 'purple'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  green: 'bg-green-100 text-green-800',
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-700',
  teal: 'bg-teal-100 text-teal-800',
  purple: 'bg-purple-100 text-purple-800',
}

export default function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  const map: Record<RoomStatus, { variant: BadgeVariant; label: string }> = {
    clean: { variant: 'green', label: 'Clean' },
    dirty: { variant: 'amber', label: 'Dirty' },
    inspected: { variant: 'blue', label: 'Inspected' },
    out_of_order: { variant: 'red', label: 'Out of Order' },
    do_not_disturb: { variant: 'gray', label: 'DND' },
  }
  const { variant, label } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  const map: Record<ReservationStatus, { variant: BadgeVariant; label: string }> = {
    confirmed: { variant: 'blue', label: 'Confirmed' },
    checked_in: { variant: 'green', label: 'Checked In' },
    checked_out: { variant: 'gray', label: 'Checked Out' },
    cancelled: { variant: 'red', label: 'Cancelled' },
    no_show: { variant: 'amber', label: 'No Show' },
  }
  const { variant, label } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}
