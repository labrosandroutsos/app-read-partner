import type { Metadata, Viewport } from 'next'
import { Manrope, Piazzolla } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { I18nProvider } from '@/lib/i18n'
import { Toaster } from '@/components/ui/sonner'
import { PrivacyConsentManager } from '@/components/privacy/privacy-consent'
import './globals.css'

// Manrope carries a real Greek subset (verified) — essential for the bilingual UI.
// Georgia's serif titles fell back to a mismatched system face for Greek readers.
const manrope = Manrope({
  subsets: ['latin', 'greek'],
  display: 'swap',
  variable: '--font-sans',
})

// Warm display serif with full Greek support, reserved for hero headlines only.
const piazzolla = Piazzolla({
  subsets: ['latin', 'greek'],
  display: 'swap',
  weight: ['500', '600'],
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: 'Read Partner - Study Together',
  description: 'Find your ideal study partner at university. Match, chat, and study together.',
  generator: 'v0.app',
  applicationName: 'Read Partner',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Read Partner',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f4ec' },
    { media: '(prefers-color-scheme: dark)', color: '#14201c' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="el" suppressHydrationWarning className={`${manrope.variable} ${piazzolla.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <I18nProvider>
            {children}
            <Toaster position="top-center" />
            <PrivacyConsentManager />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
