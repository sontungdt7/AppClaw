'use client'

import Link from 'next/link'
import { Gift } from 'lucide-react'
import { useWallet } from '@/lib/wallet-context'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

type AirdropStatus = {
  linked: boolean
  twitterUsername?: string
  airdroppedAt: string | null
  amount?: string
}

export function AirdropMiniApp() {
  const { isConnected, address, connect, isConnecting } = useWallet()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<AirdropStatus | null>(null)
  const [message, setMessage] = useState<'linked' | 'error' | null>(null)
  const [registeredCount, setRegisteredCount] = useState<number | null>(null)
  const [airdropStarted, setAirdropStarted] = useState<boolean>(true)

  useEffect(() => {
    fetch('/api/airdrop/registered')
      .then((r) => r.json())
      .then((d) => setRegisteredCount(typeof d?.count === 'number' ? d.count : 0))
      .catch(() => setRegisteredCount(null))
  }, [])

  useEffect(() => {
    fetch('/api/airdrop/config')
      .then((r) => r.json())
      .then((d) => setAirdropStarted(d?.airdropStarted === true))
      .catch(() => setAirdropStarted(true))
  }, [])

  const fetchStatus = useCallback(() => {
    if (!address) return
    fetch(`/api/airdrop/status?wallet=${encodeURIComponent(address)}`)
      .then((res) => res.json())
      .then((data: AirdropStatus) => setStatus(data))
      .catch(() => setStatus(null))
  }, [address])

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

  if (!isConnected || !address) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-6">
        <div className="rounded-lg border border-border bg-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-3">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg">$APPCLAW Airdrop</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => connect()}
            disabled={isConnecting}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto disabled:opacity-50"
          >
            {isConnecting ? 'Connecting…' : 'Login/Create Wallet to receive Airdrop'}
          </button>
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
          <div className="flex-1">
            <h2 className="font-semibold text-lg">$APPCLAW Airdrop</h2>
          </div>
        </div>

        {message === 'linked' && (
          <p className="text-sm text-primary font-medium">
            X account linked. We send batch airdrops every hour. Check back soon.
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

        {!status?.linked && airdropStarted ? (
          <a
            href={linkXUrl}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
          >
            Link X/Twitter to register for Airdrop
          </a>
        ) : !status?.linked && !airdropStarted ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Follow{' '}
              <a
                href="https://x.com/appclawbot"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-2 hover:no-underline"
              >
                AppClawBot
              </a>{' '}
              on X to get update about Airdrop.
            </p>
          </div>
        ) : status?.airdroppedAt ? (
          <div className="space-y-3">
            <p className="text-lg font-semibold text-primary">
              Congratulations! Your airdrop has been sent.
            </p>
            <p className="text-sm text-muted-foreground">
              Check your Porto wallet for {status?.amount ?? '1000'} tokens.
            </p>
            <Link
              href="/app/wallet"
              className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
            >
              View Balance
            </Link>
          </div>
        ) : !airdropStarted ? (
          <div className="space-y-3">
            {status?.twitterUsername && (
              <p className="text-sm text-muted-foreground">
                Linked as @{status?.twitterUsername}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Follow{' '}
              <a
                href="https://x.com/appclawbot"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-2 hover:no-underline"
              >
                AppClawBot
              </a>{' '}
              on X to get update about Airdrop.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {status?.twitterUsername && (
              <p className="text-sm text-muted-foreground">
                Linked as @{status?.twitterUsername}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              We update and send batch Airdrop every hour. Please come back after 1 hour.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
