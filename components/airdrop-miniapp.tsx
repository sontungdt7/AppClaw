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
const AIRDROP_TXS_START_BLOCK = BigInt(42668184)
const DEFAULT_AIRDROP_WALLET = '0x6BF2a9e628950E15B45018FaE56e8d472a73909E' as const
const BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL

const ERC20_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
])

function getAirdropWallet(): `0x${string}` | null {
  const candidate = process.env.NEXT_PUBLIC_AIRDROP_WALLET ?? DEFAULT_AIRDROP_WALLET
  if (!candidate || !/^0x[a-fA-F0-9]{40}$/.test(candidate)) return null
  return candidate as `0x${string}`
}

function fetchAirdropWalletBalance(): Promise<string | null> {
  const airdropWallet = getAirdropWallet()
  if (!airdropWallet) return Promise.resolve(null)

  const client = createPublicClient({
    chain: base,
    transport: http(BASE_RPC_URL),
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

type AirdropTx = {
  hash: `0x${string}`
  blockNumber: bigint
  to: `0x${string}`
  value: bigint
}

function fetchAirdropTransactions(): Promise<AirdropTx[]> {
  const airdropWallet = getAirdropWallet()
  if (!airdropWallet) return Promise.reject(new Error('Airdrop wallet not configured'))
  if (!BASE_RPC_URL) return Promise.reject(new Error('Set NEXT_PUBLIC_BASE_RPC_URL to load transactions'))

  type AssetTransfer = {
    hash?: string
    to?: string | null
    blockNum?: string
    rawContract?: { value?: string | null }
    value?: number | string | null
  }
  type TransfersResponse = {
    result?: {
      transfers?: AssetTransfer[]
      pageKey?: string
    }
    error?: { message?: string }
  }

  const txMap = new Map<string, AirdropTx>()
  const fromBlockHex = `0x${AIRDROP_TXS_START_BLOCK.toString(16)}`

  const fetchPage = async (pageKey?: string) => {
    const response = await fetch(BASE_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [
          {
            fromBlock: fromBlockHex,
            toBlock: 'latest',
            fromAddress: airdropWallet,
            contractAddresses: [USDC_BASE],
            category: ['erc20'],
            withMetadata: false,
            maxCount: '0x64',
            pageKey,
          },
        ],
      }),
    })

    const data = (await response.json()) as TransfersResponse
    if (!response.ok) {
      throw new Error(`Failed to load transactions (${response.status})`)
    }
    if (data.error?.message) {
      throw new Error(data.error.message)
    }

    const transfers = data.result?.transfers ?? []
    for (const transfer of transfers) {
      if (!transfer.hash || !transfer.to || !transfer.blockNum) continue

      let valueRaw: bigint | null = null
      if (transfer.rawContract?.value && transfer.rawContract.value.startsWith('0x')) {
        valueRaw = BigInt(transfer.rawContract.value)
      } else if (transfer.value != null) {
        const asNumber = Number(transfer.value)
        if (!Number.isNaN(asNumber)) {
          valueRaw = BigInt(Math.round(asNumber * 10 ** USDC_DECIMALS))
        }
      }
      if (valueRaw == null) continue

      txMap.set(transfer.hash, {
        hash: transfer.hash as `0x${string}`,
        to: transfer.to as `0x${string}`,
        blockNumber: BigInt(transfer.blockNum),
        value: valueRaw,
      })
    }

    return data.result?.pageKey
  }

  return (async () => {
    let pageKey: string | undefined
    do {
      pageKey = await fetchPage(pageKey)
    } while (pageKey)

    return Array.from(txMap.values()).sort((a, b) => Number(b.blockNumber - a.blockNumber))
  })()
}

type UsdcStatus = { claimed: boolean; claimedAt: string | null }

export function AirdropMiniApp() {
  const { isConnected, address, connect, isConnecting } = useWallet()
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null)
  const maxBalanceRef = useRef<number>(0)
  const [usdcStatus, setUsdcStatus] = useState<UsdcStatus | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [airdropTxs, setAirdropTxs] = useState<AirdropTx[]>([])
  const [loadingAirdropTxs, setLoadingAirdropTxs] = useState(true)
  const [airdropTxError, setAirdropTxError] = useState<string | null>(null)

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

  useEffect(() => {
    setLoadingAirdropTxs(true)
    setAirdropTxError(null)
    fetchAirdropTransactions()
      .then((txs) => setAirdropTxs(txs))
      .catch((err) => setAirdropTxError(err instanceof Error ? err.message : 'Failed to load transactions'))
      .finally(() => setLoadingAirdropTxs(false))
  }, [])

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

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Airdrop Transactions
          </p>
          {loadingAirdropTxs ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading transactions…
            </div>
          ) : airdropTxError ? (
            <p className="text-sm text-destructive">{airdropTxError}</p>
          ) : airdropTxs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No airdrop transactions found.</p>
          ) : (
            <div className="space-y-1">
              {airdropTxs.map((tx, index) => (
                <a
                  key={tx.hash}
                  href={`https://basescan.org/tx/${tx.hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm text-primary hover:underline break-all"
                >
                  {index + 1}. {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)} - {(Number(tx.value) / 10 ** USDC_DECIMALS).toFixed(2)} USDC to{' '}
                  {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
