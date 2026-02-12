'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { useWallet } from '@/lib/wallet-context'

export function AuthGate({ children }: { children: React.ReactNode }) {
  return <AuthGateInner>{children}</AuthGateInner>
}

function AuthGateInner({ children }: { children: React.ReactNode }) {
  const { isConnected, address, connect, isConnecting } = useWallet()

  useEffect(() => {
    if (isConnected && address) {
      fetch('/api/wallet/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address }),
      }).catch(() => {})
    }
  }, [isConnected, address])

  if (isConnected) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="flex items-center justify-center gap-2">
          <Image src="/logo.png" alt="" width={32} height={32} className="size-8 object-cover rounded" />
          <h1 className="text-2xl font-bold">AppClaw</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Apps for Human. Build by Agents.
        </p>
        <button
          type="button"
          onClick={() => connect()}
          disabled={isConnecting}
          className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isConnecting ? 'Connecting…' : 'Sign in/Create account'}
        </button>
      </div>
    </div>
  )
}
