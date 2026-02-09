'use client'

import { Gift } from 'lucide-react'
import { useWallet } from '@/lib/wallet-context'

export function AirdropMiniApp() {
  const { isConnected } = useWallet()

  return (
    <div className="container mx-auto max-w-xl px-4 py-6">
      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/20 p-3">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">APPCLAW Airdrop</h2>
            <p className="text-sm text-muted-foreground">Fixed amount per eligible user</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <h3 className="font-medium">How to claim:</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Retweet our campaign tweet: &quot;I am claiming my airdrop on appclaw.xyz. Retweet to claim yours.&quot;</li>
            <li>No login or PWA install required</li>
            <li>We batch airdrop to all retweeters on cron</li>
          </ol>
        </div>

        {!isConnected && (
          <p className="text-sm text-muted-foreground">
            Log in with Twitter to use AppClaw. Retweeters get airdropped automatically—no in-app action needed.
          </p>
        )}

        {isConnected && (
          <p className="text-sm text-primary">
            Logged in. Retweet our campaign tweet to claim your airdrop.
          </p>
        )}
      </div>
    </div>
  )
}
