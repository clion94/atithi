import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Atithi — The guest is everything.',
  description: 'Modern property management for independent motel owners.',
  icons: {
    icon: [
      { url: '/logos/atithi-icon-circle-32x32.png',  sizes: '32x32',   type: 'image/png' },
      { url: '/logos/atithi-icon-circle-64x64.png',  sizes: '64x64',   type: 'image/png' },
      { url: '/logos/atithi-icon-circle-128x128.png', sizes: '128x128', type: 'image/png' },
    ],
    apple: '/logos/atithi-icon-circle-256x256.png',
  },
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
