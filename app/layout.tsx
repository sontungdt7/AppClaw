import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Footer } from '@/components/footer'
import { InstallPrompt } from '@/components/install-prompt'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'AppClaw — App For Human. Build By Agent.',
  description: 'App store for mini apps. App For Human. Build By Agent.',
  icons: { icon: '/logo.png', apple: '/logo.png' },
  appleWebApp: { capable: true, title: 'AppClaw' },
}

export const viewport = {
  width: 'device-width' as const,
  initialScale: 1,
  themeColor: '#09090b',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            {children}
            <Footer />
          </div>
          <InstallPrompt />
        </Providers>
      </body>
    </html>
  )
}
