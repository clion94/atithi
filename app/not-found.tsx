import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <h1 className="font-display text-[34px] font-bold tracking-tight text-secondary">Page not found</h1>
        <p className="mt-2 text-gray-500">That page does not exist or has moved.</p>
        <Link href="/dashboard" className="mt-6 inline-block text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
