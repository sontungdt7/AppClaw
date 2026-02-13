'use client'

import { useEffect } from 'react'
import { useWallet } from '@/lib/wallet-context'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isConnected, address } = useWallet()

  useEffect(() => {
    if (isConnected && address) {
      fetch('/api/wallet/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address }),
      }).catch(() => {})
    }
  }, [isConnected, address])

  // Skip gate for now: allow users to go directly to main page
  return <>{children}</>
}
