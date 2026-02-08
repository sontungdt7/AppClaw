'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, Gift } from 'lucide-react'
import { useWallet } from '@/lib/wallet-context'
import { Button } from '@/components/ui/button'

const TWEET_FORMAT = '#AppClaw 0x'
const TWEET_EXAMPLE = 'Claiming my APPCLAW airdrop! #AppClaw '

export function AirdropMiniApp() {
  const { address, isConnected } = useWallet()
  const [copied, setCopied] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [registered, setRegistered] = useState(false)

  useEffect(() => {
    const standalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as { standalone?: boolean }).standalone)
    setIsStandalone(!!standalone)
  }, [])

  useEffect(() => {
    if (!isConnected || !address || !isStandalone) return

    const register = async () => {
      try {
        const res = await fetch('/api/register-install', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        })
        if (res.ok) setRegistered(true)
      } catch {
        // Ignore
      }
    }
    register()
  }, [address, isConnected, isStandalone])

  const tweetText = address ? `${TWEET_EXAMPLE}${address}` : ''
  const handleCopy = async () => {
    if (!tweetText) return
    await navigator.clipboard.writeText(tweetText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
          <h3 className="font-medium">How to register:</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Install AppClaw PWA (add to home screen)</li>
            <li>Open in standalone mode and connect your Porto wallet</li>
            <li>Tweet to X with your wallet address in this format: <code className="text-foreground bg-muted px-1 rounded">#AppClaw 0x...</code></li>
          </ol>
        </div>

        {!isConnected && (
          <p className="text-sm text-muted-foreground">
            Connect your Porto wallet to get your address and tweet template.
          </p>
        )}

        {isConnected && address && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Your wallet: <span className="font-mono text-foreground">{address.slice(0, 10)}...{address.slice(-8)}</span></p>
            <p className="text-sm text-muted-foreground">Tweet this (copy and post to X):</p>
            <div className="rounded-md border border-border bg-muted/30 p-3 font-mono text-xs break-all">
              {tweetText}
            </div>
            <Button
              onClick={handleCopy}
              className="w-full gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy tweet'}
            </Button>
          </div>
        )}

        {isStandalone && registered && (
          <p className="text-sm text-primary">Registration received. Batch airdrop runs on cron.</p>
        )}

        {!isStandalone && isConnected && (
          <p className="text-sm text-amber-500">
            Open AppClaw from your home screen (standalone) to complete registration.
          </p>
        )}
      </div>
    </div>
  )
}
