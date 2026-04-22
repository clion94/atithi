'use client'

import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm text-secondary transition-colors',
              'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
              error && 'border-error focus:border-error focus:ring-error/20',
              props.disabled && 'bg-gray-50 cursor-not-allowed opacity-60',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
