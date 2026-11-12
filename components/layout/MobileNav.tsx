'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'

type NavItem = {
  key: string
  href: string
  icon: string
}

const navItems: NavItem[] = [
  { key: 'dashboard',    href: '/dashboard',    icon: 'dashboard' },
  { key: 'reservations', href: '/reservations', icon: 'bookings' },
  { key: 'rooms',        href: '/rooms',        icon: 'rooms' },
  { key: 'guests',       href: '/guests',       icon: 'guest' },
  { key: 'housekeeping', href: '/housekeeping', icon: 'housekeeping' },
  { key: 'reports',      href: '/reports',      icon: 'reports' },
]

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const variant = active ? 'filled' : 'outline'
  return (
    <Image
      src={`/${variant}/${name}.svg`}
      alt=""
      width={22}
      height={22}
      className="shrink-0"
    />
  )
}

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden grid h-11 w-11 place-items-center rounded-full hover:bg-black/5 text-secondary"
        aria-label={t('common.openMenu')}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <line x1="3" y1="5" x2="17" y2="5" />
          <line x1="3" y1="10" x2="17" y2="10" />
          <line x1="3" y1="15" x2="17" y2="15" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm animate-fade-in z-40 md:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-secondary to-[#16233e] shadow-float z-50 md:hidden flex flex-col animate-slide-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
              <Image
                src="/logos/atithi-logo-128x128.png"
                alt={t('app.name')}
                width={44}
                height={44}
                priority
              />
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:text-white"
                aria-label={t('common.closeMenu')}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <line x1="4" y1="4" x2="16" y2="16" />
                  <line x1="16" y1="4" x2="4" y2="16" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map(({ key, href, icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={key}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 min-h-11 rounded-xl text-[15px] font-medium tracking-tight transition-colors',
                      isActive
                        ? 'bg-white/15 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]'
                        : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                    )}
                  >
                    <NavIcon name={icon} active={isActive} />
                    {t(`nav.${key}`)}
                  </Link>
                )
              })}
            </nav>

            <div className="px-3 py-4 border-t border-white/8 space-y-1">
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 min-h-11 rounded-xl text-[15px] font-medium tracking-tight text-white/60 hover:bg-white/8 hover:text-white/90 transition-colors"
              >
                <NavIcon name="settings" active={pathname === '/settings'} />
                {t('nav.settings')}
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 min-h-11 rounded-xl text-[15px] font-medium tracking-tight text-white/60 hover:bg-white/8 hover:text-white/90 transition-colors"
              >
                <Image src="/outline/logout.svg" alt="" width={22} height={22} className="shrink-0" />
                {t('actions.signOut')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
