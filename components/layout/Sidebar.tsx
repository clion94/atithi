'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'

type NavItem = {
  key: string
  href: string
  icon: string // filename without extension, e.g. "dashboard"
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

export default function Sidebar() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const property = useAppStore((s) => s.property)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-gradient-to-b from-secondary to-[#16233e] min-h-screen sticky top-0 h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/8">
        <Image
          src="/logos/atithi-logo-128x128.png"
          alt={t('app.name')}
          width={48}
          height={48}
          priority
        />
        {property && (
          <p className="text-[13px] text-white/50 mt-2 truncate">{property.name}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ key, href, icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={key}
              href={href}
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

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/8 space-y-1">
        <Link
          href="/settings"
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
    </aside>
  )
}
