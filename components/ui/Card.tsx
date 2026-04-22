import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export default function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-sm',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>{children}</div>
  )
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-lg font-semibold text-secondary', className)}>{children}</h3>
  )
}
