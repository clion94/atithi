'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { CheckCircle, XCircle, X, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type ToastType = 'success' | 'error' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const add = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value: ToastContextValue = {
    success: (msg) => add('success', msg),
    error: (msg) => add('error', msg),
    warning: (msg) => add('warning', msg),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 sm:max-w-sm w-auto sm:w-full">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />,
    error: <XCircle className="h-5 w-5 text-error flex-shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />,
  }

  const bgClasses: Record<ToastType, string> = {
    success: 'bg-white/90',
    error: 'bg-white/90',
    warning: 'bg-white/90',
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl shadow-float ring-1 ring-black/5 backdrop-blur-xl px-4 py-3 animate-slide-in',
        bgClasses[toast.type]
      )}
    >
      {icons[toast.type]}
      <p className="flex-1 text-[15px] leading-snug text-secondary">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss"
        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
