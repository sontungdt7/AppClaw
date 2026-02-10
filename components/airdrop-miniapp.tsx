'use client'

import { Gift } from 'lucide-react'
import { useWallet } from '@/lib/wallet-context'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type Campaign = { campaignTweetId: string | null; retweetUrl: string | null }
type AirdropStatus = {
  linked: boolean
  twitterUsername?: string
  airdroppedAt: string | null
  amount?: string
}

export function AirdropMiniApp() {
  const { isConnected, address } = useWallet()
  const searchParams = useSearchParams()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [status, setStatus] = useState<AirdropStatus | null>(null)
  const [message, setMessage] = useState<'linked' | 'error' | null>(null)

  useEffect(() => {
    fetch('/api/campaign')
      .then((res) => res.json())
      .then((data: Campaign) => setCampaign(data))
      .catch(() => setCampaign({ campaignTweetId: null, retweetUrl: null }))
  }, [])

  useEffect(() => {
    if (!address) return
    fetch(`/api/airdrop/status?wallet=${encodeURIComponent(address)}`)
      .then((res) => res.json())
      .then((data: AirdropStatus) => setStatus(data))
      .catch(() => setStatus(null))
  }, [address])

  useEffect(() => {
    const linked = searchParams.get('linked')
    const error = searchParams.get('error')
    if (linked === '1') setMessage('linked')
    else if (error) setMessage('error')
  }, [searchParams])

  if (!isConnected || !address) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Connect your Porto wallet to claim the airdrop.
          </p>
        </div>
      </div>
    )
  }

  const linkXUrl = `/api/airdrop/link-x?wallet=${encodeURIComponent(address)}`

  return (
    <div className="container mx-auto max-w-xl px-4 py-6">
      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/20 p-3">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">APPCLAW Airdrop</h2>
            <p className="text-sm text-muted-foreground">
              Link X and repost to claim. Max 1,000 users this campaign.
            </p>
          </div>
        </div>

        {message === 'linked' && (
          <p className="text-sm text-primary font-medium">
            X account linked. Repost our campaign tweet to be eligible.
          </p>
        )}
        {message === 'error' && (
          <p className="text-sm text-destructive">
            Something went wrong. Try linking X again.
          </p>
        )}

        <div className="space-y-3 text-sm">
          <h3 className="font-medium">How to claim:</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Link your X account below (one-time)</li>
            <li>Repost our campaign tweet using the button</li>
            <li>We verify reposts and airdrop to your Porto wallet (batches, max 1,000 users)</li>
          </ol>
        </div>

        {status?.linked ? (
          <div className="space-y-2">
            {status.twitterUsername && (
              <p className="text-sm text-muted-foreground">
                Linked as @{status.twitterUsername}
              </p>
            )}
            {status.airdroppedAt ? (
              <p className="text-sm text-primary font-medium">
                Airdrop sent. Check your Porto wallet for {status.amount ?? '1000'} APPCLAW.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Repost the campaign tweet to be eligible. We’ll notify you when sent.
              </p>
            )}
          </div>
        ) : (
          <a
            href={linkXUrl}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
          >
            Link X to claim
          </a>
        )}

        {campaign?.retweetUrl && (
          <a
            href={campaign.retweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-muted w-full sm:w-auto"
          >
            Repost campaign tweet
          </a>
        )}
      </div>
    </div>
  )
}
