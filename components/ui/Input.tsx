'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-secondary placeholder:text-gray-400 transition-colors',
            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            error && 'border-error focus:border-error focus:ring-error/20',
            props.disabled && 'bg-gray-50 cursor-not-allowed opacity-60',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
