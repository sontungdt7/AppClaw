'use client'

import { useWallet } from '@/lib/wallet-context'

export function BalanceCard() {
  const { isConnected } = useWallet()

  return (
    <div className="rounded-xl bg-card border border-border/50 p-6 mx-4 mt-4">
      <p className="text-3xl font-semibold text-primary">
        {isConnected ? '0 APPCLAW' : '$0.00'}
      </p>
      <p className="text-sm text-muted-foreground mt-1">Spendable</p>
    </div>
  )
}
