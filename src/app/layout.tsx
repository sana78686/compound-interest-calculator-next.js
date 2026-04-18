import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { CmsClientBootstrap } from '@/components/CmsClientBootstrap'
import { metadataBaseFromEnv } from '@/lib/cms/html'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: metadataBaseFromEnv(),
  title: { default: 'Compound Interest Calculator', template: '%s | Compound Interest Calculator' },
  description:
    'UK compound interest calculator with charts, monthly contributions, daily compounding, and optional ISA subscription limits.',
  applicationName: 'Compound Interest Calculator',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    type: 'website',
    siteName: 'Compound Interest Calculator',
    locale: 'en_GB',
    images: [
      {
        url: '/icon.svg',
        width: 32,
        height: 32,
        alt: 'Compound Interest Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* suppressHydrationWarning: extensions (e.g. ColorZilla) inject attrs like cz-shortcut-listen on <body> */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <CmsClientBootstrap />
        {children}
      </body>
    </html>
  )
}
