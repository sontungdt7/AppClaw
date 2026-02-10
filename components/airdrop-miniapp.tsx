'use client'

import { Gift } from 'lucide-react'
import { useWallet } from '@/lib/wallet-context'
import { useEffect, useState } from 'react'
type Campaign = { campaignTweetId: string | null; retweetUrl: string | null }

export function AirdropMiniApp() {
  const { isConnected } = useWallet()
  const [campaign, setCampaign] = useState<Campaign | null>(null)

  useEffect(() => {
    fetch('/api/campaign')
      .then((res) => res.json())
      .then((data: Campaign) => setCampaign(data))
      .catch(() => setCampaign({ campaignTweetId: null, retweetUrl: null }))
  }, [])

  return (
    <div className="container mx-auto max-w-xl px-4 py-6">
      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/20 p-3">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">APPCLAW Airdrop</h2>
            <p className="text-sm text-muted-foreground">Repost our tweet to claim. No login required.</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <h3 className="font-medium">How to claim:</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Tap the button below to open our campaign tweet</li>
            <li>Repost (retweet) it — one tap on X</li>
            <li>We add retweeters to the airdrop list and send tokens in batches (2–4x per day)</li>
          </ol>
        </div>

        {campaign?.retweetUrl ? (
          <a
            href={campaign.retweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
          >
            Repost to claim
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">
            Campaign not started yet. Check back soon or retweet our tweet from appclaw.xyz when it’s live.
          </p>
        )}

        {!isConnected && (
          <p className="text-sm text-muted-foreground">
            Log in with Twitter to use AppClaw. Retweeters get airdropped automatically—no in-app action needed.
          </p>
        )}

        {isConnected && (
          <p className="text-sm text-primary">
            Logged in. Repost our campaign tweet to claim your airdrop.
          </p>
        )}
      </div>
    </div>
  )
}
