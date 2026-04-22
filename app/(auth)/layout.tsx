import type { ReactNode } from 'react'
import I18nProvider from '@/components/I18nProvider'
import { ToastProvider } from '@/components/ui/Toast'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ToastProvider>
        <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-secondary flex items-center justify-center p-4">
          {children}
        </div>
      </ToastProvider>
    </I18nProvider>
  )
}
