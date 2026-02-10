'use client'

import { usePrivy, useLoginWithOAuth } from '@privy-io/react-auth'
import { useHasPrivy } from '@/components/providers'
import { useCallback, useState } from 'react'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const hasPrivy = useHasPrivy()

  if (!hasPrivy) {
    return <>{children}</>
  }

  return <AuthGateInner>{children}</AuthGateInner>
}

function AuthGateInner({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy()
  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth()
  const [error, setError] = useState<string | null>(null)

  // Always use redirect flow (no popup). Popups often fail on mobile; redirect works on desktop too.
  const handleLogin = useCallback(async () => {
    setError(null)
    try {
      await initOAuth({ provider: 'twitter' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed. Try again or use a different browser.')
    }
  }, [initOAuth])

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
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
