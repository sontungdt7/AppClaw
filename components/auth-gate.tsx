'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useHasPrivy } from '@/components/providers'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const hasPrivy = useHasPrivy()

  if (!hasPrivy) {
    return <>{children}</>
  }

  return <AuthGateInner>{children}</AuthGateInner>
}

function AuthGateInner({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, login, logout } = usePrivy()

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
            Log in with X to continue
          </p>
          <button
            type="button"
            onClick={() => login()}
            className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Login with X
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
