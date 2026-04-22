import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import I18nProvider from '@/components/I18nProvider'
import { ToastProvider } from '@/components/ui/Toast'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import AppBootstrap from '@/components/AppBootstrap'

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
    <I18nProvider>
      <ToastProvider>
        <AppBootstrap profile={profile} property={property} />
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </div>
        </div>
      </ToastProvider>
    </I18nProvider>
  )
}
