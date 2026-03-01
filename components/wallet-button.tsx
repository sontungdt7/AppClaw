'use client'

import Link from 'next/link'
import { Wallet } from 'lucide-react'
import { useWallet } from '@/lib/wallet-context'

export function WalletButton() {
  const { isConnected, address, connect, isConnecting } = useWallet()

  if (isConnected && address) {
    return (
      <Link
        href="/profile"
        className="inline-flex items-center justify-center rounded-md border border-border bg-muted/50 p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Open profile"
        title="Open profile"
      >
        <Wallet className="h-5 w-5" />
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={() => connect()}
      disabled={isConnecting}
      className="rounded-md border border-primary bg-primary/20 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/30 disabled:opacity-50"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  )
}
