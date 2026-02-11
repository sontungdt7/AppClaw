'use client'

import Link from 'next/link'
import { Gift } from 'lucide-react'
import { useWallet } from '@/lib/wallet-context'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

const CAMPAIGN_TWEET_ID = '2020402202884579469'
const TWEET_URL = `https://x.com/Metta_2085/status/${CAMPAIGN_TWEET_ID}`
const REPOST_URL = `https://twitter.com/intent/retweet?tweet_id=${CAMPAIGN_TWEET_ID}`

type Campaign = { campaignTweetId: string | null; retweetUrl: string | null }
type AirdropStatus = {
  linked: boolean
  twitterUsername?: string
  hasReposted?: boolean
  airdroppedAt: string | null
  amount?: string
}

export function AirdropMiniApp() {
  const { isConnected, address } = useWallet()
  const searchParams = useSearchParams()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [status, setStatus] = useState<AirdropStatus | null>(null)
  const [message, setMessage] = useState<'linked' | 'error' | null>(null)
  const [checkingRepost, setCheckingRepost] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimResult, setClaimResult] = useState<{
    success: boolean
    message?: string
    txHash?: string
    chainId?: number
  } | null>(null)
  const [checkRepostError, setCheckRepostError] = useState<string | null>(null)

  const fetchStatus = useCallback(() => {
    if (!address) return
    fetch(`/api/airdrop/status?wallet=${encodeURIComponent(address)}`)
      .then((res) => res.json())
      .then((data: AirdropStatus) => setStatus(data))
      .catch(() => setStatus(null))
  }, [address])

  useEffect(() => {
    fetch('/api/campaign')
      .then((res) => res.json())
      .then((data: Campaign) => setCampaign(data))
      .catch(() => setCampaign({ campaignTweetId: null, retweetUrl: null }))
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    const linked = searchParams.get('linked')
    const error = searchParams.get('error')
    if (linked === '1') setMessage('linked')
    else if (error) setMessage('error')
  }, [searchParams])

  const oauthNotConfigured = searchParams.get('error') === 'oauth_not_configured'

  const handleCheckRepost = () => {
    if (!address) return
    setCheckingRepost(true)
    setCheckRepostError(null)
    fetch('/api/airdrop/check-repost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: address }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (res.status === 429) {
          setCheckRepostError(data.error ?? 'Too many requests. Try again in a few minutes.')
          return
        }
        if (data.hasReposted) fetchStatus()
      })
      .catch(() => setCheckRepostError('Check failed. Try again.'))
      .finally(() => setCheckingRepost(false))
  }

  const handleClaim = () => {
    if (!address) return
    setClaiming(true)
    setClaimResult(null)
    fetch('/api/airdrop/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: address }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setClaimResult({
            success: true,
            message: data.message,
            txHash: data.txHash,
            chainId: data.chainId,
          })
          fetchStatus()
        } else {
          setClaimResult({ success: false, message: data.error || 'Claim failed' })
        }
      })
      .catch(() => setClaimResult({ success: false, message: 'Request failed' }))
      .finally(() => setClaiming(false))
  }

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
            <h2 className="font-semibold text-lg">$APPCLAW Airdrop</h2>
          </div>
        </div>

        {message === 'linked' && (
          <p className="text-sm text-primary font-medium">
            X account linked. Repost our campaign tweet to be eligible, then claim.
          </p>
        )}
        {message === 'error' && !oauthNotConfigured && (
          <p className="text-sm text-destructive">
            Something went wrong. Try linking X again.
          </p>
        )}
        {oauthNotConfigured && (
          <p className="text-sm text-muted-foreground rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2">
            X (Twitter) linking is not configured on this server. The admin needs to set X_OAUTH2_CLIENT_ID and X_OAUTH2_CLIENT_SECRET in the environment. See README for setup.
          </p>
        )}

        {!status?.linked ? (
          <a
            href={linkXUrl}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
          >
            Link X/Twitter to Claim
          </a>
        ) : (
          <>
            {status.twitterUsername && (
              <p className="text-sm text-muted-foreground">
                Linked as @{status.twitterUsername}
              </p>
            )}

            {status.airdroppedAt ? (
              <div className="space-y-3">
                <p className="text-sm text-primary font-medium">
                  Airdrop sent. Check your Porto wallet for {status.amount ?? '1000'} tokens.
                </p>
                <p className="text-xs text-muted-foreground">Claim status: Completed</p>
                <Link
                  href="/app/wallet"
                  className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
                >
                  View Balance
                </Link>
              </div>
            ) : status.hasReposted ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  You’re eligible. Claim your airdrop below.
                </p>
                {claimResult && (
                  <p className={`text-sm ${claimResult.success ? 'text-primary' : 'text-destructive'}`}>
                    {claimResult.message}
                    {claimResult.txHash && (
                      <a
                        href={
                          claimResult.chainId === 84532
                            ? `https://sepolia.basescan.org/tx/${claimResult.txHash}`
                            : `https://basescan.org/tx/${claimResult.txHash}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 underline"
                      >
                        View tx
                      </a>
                    )}
                  </p>
                )}
                {claimResult?.success && (
                  <Link
                    href="/app/wallet"
                    className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
                  >
                    View Balance
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={claiming}
                  className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 w-full sm:w-auto"
                >
                  {claiming ? 'Claiming…' : 'Claim Airdrop'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium text-foreground">
                  Repost this tweet to be eligible for the airdrop
                </p>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <blockquote className="text-sm text-muted-foreground border-l-2 border-primary/50 pl-3">
                    <a
                      href={TWEET_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View campaign tweet on X
                    </a>
                  </blockquote>
                </div>
                {checkRepostError && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    {checkRepostError}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <a
                    href={REPOST_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
                  >
                    Repost for Airdrop
                  </a>
                  <button
                    type="button"
                    onClick={handleCheckRepost}
                    disabled={checkingRepost}
                    className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-muted disabled:opacity-50 w-full sm:w-auto"
                  >
                    {checkingRepost ? 'Checking…' : "I've reposted – Check"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
