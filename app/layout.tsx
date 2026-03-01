import type { Metadata } from 'next'
import { Geist, Geist_Mono, VT323 } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { AuthGate } from '@/components/auth-gate'
import { Footer } from '@/components/footer'
import { InstallPrompt } from '@/components/install-prompt'
import { UpdatePrompt } from '@/components/update-prompt'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})
const vt323 = VT323({
  weight: '400',
  variable: '--font-vt323',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'AppClaw — App For Human. Build By Agent.',
  description: 'App store for mini apps. App For Human. Build By Agent.',
  icons: { icon: '/logo.png?v=2', apple: '/logo.png?v=2' },
  appleWebApp: { capable: true, title: 'AppClaw' },
}

export const viewport = {
  width: 'device-width' as const,
  initialScale: 1,
  themeColor: '#00bfff',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} ${vt323.variable} font-sans antialiased`}>
        <Providers>
          <AuthGate>
            <div className="min-h-screen flex flex-col">
              {children}
              <Footer />
            </div>
          </AuthGate>
          <InstallPrompt />
          <UpdatePrompt />
        </Providers>
      </body>
    </html>
  )
}
