import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Waypoint — Run your motel with ease',
  description: 'Modern property management for independent motel owners.',
  // Favicon and touch icon come from app/icon.svg and app/apple-icon.png.
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-surface antialiased">{children}</body>
    </html>
  )
}
