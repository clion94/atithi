import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
})

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
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} h-full`}>
      <body className="min-h-full bg-surface antialiased">{children}</body>
    </html>
  )
}
