'use client'

import Link from 'next/link'
import { Gift, UserPlus, Loader2 } from 'lucide-react'
import { useWallet } from '@/lib/wallet-context'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createPublicClient, http, parseAbi } from 'viem'
import { base } from 'viem/chains'

// USDC on Base mainnet (chainId 8453)
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const
const USDC_DECIMALS = 6

const ERC20_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
])

function fetchAirdropWalletBalance(): Promise<string | null> {
  const airdropWallet = process.env.NEXT_PUBLIC_AIRDROP_WALLET
  if (!airdropWallet || !/^0x[a-fA-F0-9]{40}$/.test(airdropWallet)) return Promise.resolve(null)

  const client = createPublicClient({
    chain: base,
    transport: http(),
  })

  return client
    .readContract({
      address: USDC_BASE,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [airdropWallet as `0x${string}`],
    })
    .then((b) => (Number(b) / 10 ** USDC_DECIMALS).toFixed(2))
    .catch(() => null)
}

type UsdcStatus = { claimed: boolean; claimedAt: string | null }

export function AirdropMiniApp() {
  const { isConnected, address, connect, isConnecting } = useWallet()
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null)
  const maxBalanceRef = useRef<number>(0)
  const [usdcStatus, setUsdcStatus] = useState<UsdcStatus | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)

  const refreshBalance = useCallback(() => {
    fetchAirdropWalletBalance().then((b) => {
      if (b != null) {
        const n = parseFloat(b)
        setUsdcBalance(b)
        if (n > maxBalanceRef.current) maxBalanceRef.current = n
      }
    })
  }, [])

  useEffect(() => {
    refreshBalance()
  }, [refreshBalance])

  const fetchUsdcStatus = useCallback(() => {
    if (!address) return
    fetch(`/api/airdrop/usdc-status?wallet=${encodeURIComponent(address)}`)
      .then((res) => res.json())
      .then((data: UsdcStatus) => setUsdcStatus(data))
      .catch(() => setUsdcStatus(null))
  }, [address])

  useEffect(() => {
    fetchUsdcStatus()
  }, [fetchUsdcStatus])

  const handleClaim = useCallback(() => {
    if (!address || claiming) return
    setClaimError(null)
    setClaiming(true)
    fetch('/api/airdrop/claim-usdc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: address }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setUsdcStatus({ claimed: true, claimedAt: new Date().toISOString() })
          refreshBalance()
          // Refetch after tx confirms; balance may not be updated immediately
          setTimeout(() => refreshBalance(), 3000)
        } else {
          setClaimError(data.error ?? 'Claim failed')
        }
      })
      .catch(() => setClaimError('Claim failed'))
      .finally(() => setClaiming(false))
  }, [address, claiming, refreshBalance])

  const showConnect = !isConnected || !address
  const showClaim = isConnected && address && !usdcStatus?.claimed && !claiming
  const showViewBalance = usdcStatus?.claimed

  return (
    <div className="container mx-auto max-w-xl px-4 py-6">
      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/20 p-3">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-lg">Airdrop</h2>
          </div>
        </div>

        {usdcBalance != null && (
          <p className="text-sm text-muted-foreground">
            Airdrop Balance: <span className="font-medium text-foreground">{Math.floor(parseFloat(usdcBalance))}/10 USDC</span> on Base
          </p>
        )}

        {isConnected && address && (
          <p className="text-sm text-muted-foreground">
            Welcome {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        )}

        {claimError && (
          <p className="text-sm text-destructive">{claimError}</p>
        )}

        {showConnect && (
          <button
            type="button"
            onClick={() => connect()}
            disabled={isConnecting}
            className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {isConnecting ? 'Connecting…' : 'Claim'}
          </button>
        )}

        {showClaim && (
          <button
            type="button"
            onClick={handleClaim}
            disabled={claiming}
            className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto disabled:opacity-50"
          >
            {claiming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Claiming…
              </>
            ) : (
              'Claim 1 USDC'
            )}
          </button>
        )}

        {showViewBalance && (
          <Link
            href="/app/wallet"
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
          >
            View Balance
          </Link>
        )}

        {!showConnect && !showClaim && !showViewBalance && claiming && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Claiming…
          </div>
        )}

        {!showConnect && !showClaim && !showViewBalance && !claiming && (
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-muted text-muted-foreground w-full sm:w-auto cursor-not-allowed"
          >
            Claim
          </button>
        )}
      </div>
    </div>
  )
}
