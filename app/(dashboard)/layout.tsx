import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import I18nProvider from '@/components/I18nProvider'
import QueryProvider from '@/components/QueryProvider'
import { ToastProvider } from '@/components/ui/Toast'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { AppStoreProvider } from '@/store/useAppStore'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.property_id) redirect('/setup')

  // A deactivated account has no access to anything (the database enforces it); tell
  // the person why instead of showing empty screens. Checked before loading the
  // property, which a deactivated user can no longer read.
  if (profile.active === false) redirect('/deactivated')

  // New team members get a one-time password; they must choose their own before anything else.
  if (user.user_metadata?.must_change_password) redirect('/change-password')

  let property = null
  if (profile.property_id) {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('id', profile.property_id)
      .single()
    property = data
  }

  if (!property) redirect('/setup')

  return (
    <I18nProvider language={profile.language}>
      <QueryProvider>
        <ToastProvider>
          <AppStoreProvider profile={profile} property={property}>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 p-4 md:p-6 print:p-0">{children}</main>
              </div>
            </div>
          </AppStoreProvider>
        </ToastProvider>
      </QueryProvider>
    </I18nProvider>
  )
}
