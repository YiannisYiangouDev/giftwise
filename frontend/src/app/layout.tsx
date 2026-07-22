import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import LoadingScreen from '@/components/LoadingScreen'

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
})

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://giftwise.shillopelloi.com'),
  applicationName: 'GiftWise',
  title: {
    default: 'GiftWise — Family Gift Tracker',
    template: '%s — GiftWise',
  },
  description: 'Family gift tracker with wishlists, Secret Santa, group gifts & price alerts across Cyprus & Greece',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GiftWise',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: 'GiftWise',
    title: 'GiftWise — Family Gift Tracker',
    description: 'Family gift tracker with wishlists, Secret Santa, group gifts & price alerts',
  },
  twitter: {
    card: 'summary',
    title: 'GiftWise — Family Gift Tracker',
    description: 'Family gift tracker with wishlists, Secret Santa, group gifts & price alerts',
  },
}

export const viewport: Viewport = {
  themeColor: '#c5a880',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased">
        <Providers>
          <LoadingScreen />
          {children}
        </Providers>
      </body>
    </html>
  )
}
