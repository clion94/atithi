'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'
import { useAppStore } from '@/store/useAppStore'

interface SheetProps {
  title: string
  backHref: string
  /** Extra line under the title, e.g. the invoice number. */
  subtitle?: ReactNode
  children: ReactNode
}

/**
 * A paper-sized page for documents that get printed or saved as PDF from the browser's
 * print dialog. The app chrome (sidebar, header, this toolbar) is hidden when printing.
 */
export default function Sheet({ title, backHref, subtitle, children }: SheetProps) {
  const { t } = useTranslation()
  const property = useAppStore((s) => s.property)
  const address = [property?.address, property?.city, [property?.state, property?.zip].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="mx-auto max-w-[8.5in]">
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <Link href={backHref}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            {t('actions.back')}
          </Button>
        </Link>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          {t('documents.print')}
        </Button>
      </div>

      <article className="bg-white p-8 text-secondary shadow-card ring-1 ring-black/5 md:p-12 print:p-0 print:shadow-none print:ring-0">
        <header className="flex items-start justify-between gap-6 border-b-2 border-secondary pb-5">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{property?.name}</h1>
            {address && <p className="mt-1 text-sm text-gray-600">{address}</p>}
            <p className="text-sm text-gray-600">{[property?.phone, property?.email].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-xl font-bold uppercase tracking-wide">{title}</p>
            {subtitle && <div className="mt-1 text-sm text-gray-600">{subtitle}</div>}
          </div>
        </header>
        <div className="pt-6">{children}</div>
      </article>
    </div>
  )
}

/** A labelled value on a form. A missing value leaves a blank line to fill in by hand. */
export function Field({ label, value, className }: { label: string; value?: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-0.5 min-h-[1.75rem] border-b border-gray-300 pb-0.5 text-sm font-medium">{value}</p>
    </div>
  )
}
