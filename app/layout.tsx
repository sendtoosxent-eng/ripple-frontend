import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/lib/auth-context'
import { SplashScreen } from '@/components/splash-screen'
import { PwaProvider } from '@/components/pwa-provider'
import { IncomingCallListener } from '@/components/incoming-call-listener'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://ripple-chat-six.vercel.app'),
  title: 'Ripple — Messaging, made friendly',
  description:
    'A clean, modern, mobile-first messaging app with voice notes, photos, groups, and dark mode.',
  applicationName: 'Ripple',
  verification: {
    google: 'QlCx2kf4SH_XJoEhfrCEaMQqHLbaEfepaUpdVppx9S8',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Ripple', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f9fa' },
    { media: '(prefers-color-scheme: dark)', color: '#141a1f' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} ${geistMono.variable}`}>
      <body className="bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <SplashScreen />
            <PwaProvider deployment={process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || 'production'} />
            <IncomingCallListener />
            {children}
          </AuthProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
