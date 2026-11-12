import { isManager } from '@/lib/team/rules'
import type { UserRole } from '@/types'

export type NavItem = {
  key: string
  href: string
  /** Filename in /public/{outline,filled}, without the extension. */
  icon: string
  managerOnly?: boolean
}

// One list for the desktop sidebar and the mobile drawer.
export const navItems: NavItem[] = [
  { key: 'dashboard',    href: '/dashboard',    icon: 'dashboard' },
  { key: 'reservations', href: '/reservations', icon: 'bookings' },
  { key: 'calendar',     href: '/calendar',     icon: 'schedule' },
  { key: 'rooms',        href: '/rooms',        icon: 'rooms' },
  { key: 'guests',       href: '/guests',       icon: 'guest' },
  { key: 'housekeeping', href: '/housekeeping', icon: 'housekeeping' },
  { key: 'reports',      href: '/reports',      icon: 'reports' },
  { key: 'team',         href: '/team',         icon: 'staff', managerOnly: true },
]

export function navItemsFor(role: UserRole | undefined): NavItem[] {
  return navItems.filter((i) => !i.managerOnly || isManager(role))
}
