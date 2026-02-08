'use client'

import { useWallet } from '@/lib/wallet-context'

export function WalletButton() {
  const { isConnected, address, connect, disconnect, isConnecting } = useWallet()

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-mono truncate max-w-[100px] sm:max-w-[140px]">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          type="button"
          onClick={() => disconnect()}
          className="rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium hover:bg-muted"
        >
          Disconnect
        </button>
      </div>
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
