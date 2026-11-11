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
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-gray-500">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border-0 bg-white px-3.5 min-h-11 text-[15px] text-secondary placeholder:text-gray-400 ring-1 ring-inset ring-black/10 transition',
            'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary',
            error && 'ring-error/60 focus:ring-error',
            props.disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
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
