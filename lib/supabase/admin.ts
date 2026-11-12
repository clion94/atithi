import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client with the service-role key. It bypasses row level security, so it must
 * only ever be used inside Server Actions / route handlers, after the caller has been
 * authenticated and authorized. `server-only` makes the build fail if a client component
 * imports this file, and the key has no NEXT_PUBLIC_ prefix so it is never sent to browsers.
 */
export function isAdminConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL)
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}
