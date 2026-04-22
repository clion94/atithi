import { redirect } from 'next/navigation'

// Middleware handles auth — authed users land here and get sent to /dashboard
export default function RootPage() {
  redirect('/dashboard')
}
