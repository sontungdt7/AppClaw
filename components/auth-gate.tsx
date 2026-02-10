'use client'

import { usePrivy, useLoginWithOAuth } from '@privy-io/react-auth'
import { useHasPrivy } from '@/components/providers'
import { useCallback, useEffect, useState } from 'react'

function isMobileUserAgent(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|iPhone|iPad|iPod|webOS|Mobile/i.test(navigator.userAgent)
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const hasPrivy = useHasPrivy()

  if (!hasPrivy) {
    return <>{children}</>
  }

  return <AuthGateInner>{children}</AuthGateInner>
}

function AuthGateInner({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, login } = usePrivy()
  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(isMobileUserAgent())
  }, [])

  const handleLogin = useCallback(() => {
    if (isMobile) {
      // Redirect flow: opens X app or browser in same window. Works on Android when popup would fail.
      initOAuth({ provider: 'twitter' })
    } else {
      login()
    }
  }, [isMobile, initOAuth, login])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <h1 className="text-2xl font-bold">AppClaw</h1>
          <p className="text-sm text-muted-foreground">
            App for Human. Build by Agent.
          </p>
          <button
            type="button"
            onClick={handleLogin}
            disabled={oauthLoading}
            className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {oauthLoading ? 'Opening X…' : 'Login with X'}
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
