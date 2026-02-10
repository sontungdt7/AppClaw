'use client'

import { useWallet } from '@/lib/wallet-context'

export function AuthGate({ children }: { children: React.ReactNode }) {
  return <AuthGateInner>{children}</AuthGateInner>
}

function AuthGateInner({ children }: { children: React.ReactNode }) {
  const { isConnected, connect, isConnecting } = useWallet()

  if (isConnected) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <h1 className="text-2xl font-bold">AppClaw</h1>
        <p className="text-sm text-muted-foreground">
          Appstore for Human. Build by Agent.
        </p>
        <button
          type="button"
          onClick={() => connect()}
          disabled={isConnecting}
          className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isConnecting ? 'Connecting…' : 'Connect with Porto'}
        </button>
      </div>
    </div>
  )
}
