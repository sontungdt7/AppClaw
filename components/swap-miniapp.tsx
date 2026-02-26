'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useReadContract, useSendCalls, useChainId, useSwitchChain, useBalance, useSignTypedData } from 'wagmi'
import { ArrowLeft, ArrowDownUp, Loader2, UserPlus, ExternalLink } from 'lucide-react'
import { useWallet } from '@/lib/wallet-context'

const BASE_MAINNET_ID = 8453
const BASE_SEPOLIA_ID = 84532

const SUPPORTED_CHAINS = [
  { id: BASE_MAINNET_ID, name: 'Base' },
  { id: BASE_SEPOLIA_ID, name: 'Base Sepolia' },
] as const

const ERC20_ABI = [
  { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], name: 'allowance', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
] as const

// Base mainnet (8453)
const TOKENS_MAINNET = [
  { symbol: 'ETH', address: '0x4200000000000000000000000000000000000006' as const, decimals: 18 },
  { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const, decimals: 6 },
]
// Base Sepolia (84532)
const TOKENS_SEPOLIA = [
  { symbol: 'ETH', address: '0x4200000000000000000000000000000000000006' as const, decimals: 18 },
  { symbol: 'USDC', address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const, decimals: 6 },
]

type SwapToken = { symbol: string; address: `0x${string}`; decimals: number }

function parseAmount(amount: string, decimals: number): bigint {
  const [whole, frac = ''] = amount.replace(',', '').split('.')
  const padded = whole + frac.padEnd(decimals, '0').slice(0, decimals)
  return BigInt(padded || '0')
}

function formatAmount(raw: bigint, decimals: number): string {
  const s = raw.toString().padStart(decimals + 1, '0')
  const int = s.slice(0, -decimals) || '0'
  const frac = s.slice(-decimals).replace(/0+$/, '')
  return frac ? `${int}.${frac}` : int
}

function getQuoteForSwap(res: Record<string, unknown>): unknown {
  return (
    res.classicQuote ??
    res.wrapUnwrapQuote ??
    res.bridgeQuote ??
    res.dutchLimitQuote ??
    res.dutchLimitV2Quote ??
    res.dutchLimitV3Quote ??
    res.priorityQuote ??
    res.quote
  )
}

function extractFromQuote(q: Record<string, unknown>): string | undefined {
  const out = q.output as { amount?: string } | undefined
  if (out?.amount && /^\d+$/.test(out.amount)) return out.amount
  const a = q.amountOut ?? q.amount
  if (a != null && /^\d+$/.test(String(a))) return String(a)
  const agg = q.aggregatedOutputs as Array<{ amount?: string; minAmount?: string }> | undefined
  if (Array.isArray(agg) && agg[0]) {
    const v = agg[0].amount ?? agg[0].minAmount
    if (v && /^\d+$/.test(v)) return v
  }
  return undefined
}

function extractAmountOut(data: Record<string, unknown>): string | undefined {
  const quoteKeys = ['classicQuote', 'dutchLimitQuote', 'dutchLimitV2Quote', 'dutchLimitV3Quote', 'wrapUnwrapQuote', 'bridgeQuote', 'priorityQuote', 'quote']
  for (const k of quoteKeys) {
    const q = data[k] as Record<string, unknown> | undefined
    if (q && typeof q === 'object') {
      const a = extractFromQuote(q)
      if (a) return a
    }
  }
  return extractFromQuote(data)
}

export function SwapMiniApp() {
  const chainId = useChainId()
  const isSepolia = chainId === BASE_SEPOLIA_ID
  const swapChainId = isSepolia ? BASE_SEPOLIA_ID : BASE_MAINNET_ID
  const isSupportedChain = chainId === BASE_MAINNET_ID || chainId === BASE_SEPOLIA_ID
  const TOKENS = isSepolia ? TOKENS_SEPOLIA : TOKENS_MAINNET

  const { address, isConnected, connect, isConnecting } = useWallet()
  const router = useRouter()
  const [tokenIn, setTokenIn] = useState<SwapToken>(TOKENS_MAINNET[0])
  const [tokenOut, setTokenOut] = useState<SwapToken>(TOKENS_MAINNET[1])

  useEffect(() => {
    setTokenIn((prev) => TOKENS.find((t) => t.symbol === prev.symbol) ?? TOKENS[0])
    setTokenOut((prev) => TOKENS.find((t) => t.symbol === prev.symbol) ?? TOKENS[1])
  }, [chainId])
  const [amountIn, setAmountIn] = useState('')
  const [quote, setQuote] = useState<{
    amountOut: string
    raw: Record<string, unknown>
    gasFee?: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [swapping, setSwapping] = useState(false)
  const [approving, setApproving] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  const { sendCallsAsync } = useSendCalls()
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain()
  const { signTypedDataAsync } = useSignTypedData()

  const chainName = SUPPORTED_CHAINS.find((c) => c.id === chainId)?.name ?? `Chain ${chainId}`

  const amountRaw = useMemo(
    () => (amountIn && parseFloat(amountIn) > 0 ? parseAmount(amountIn, tokenIn.decimals) : BigInt(0)),
    [amountIn, tokenIn.decimals]
  )

  const { data: nativeBalance, refetch: refetchNativeBalance } = useBalance({
    address: address ? (address as `0x${string}`) : undefined,
    chainId: swapChainId,
  })

  const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
    address: tokenIn.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    chainId: swapChainId,
  })

  const balanceIn = tokenIn.symbol === 'ETH' ? nativeBalance?.value : tokenBalance
  const refetchBalanceIn = tokenIn.symbol === 'ETH' ? refetchNativeBalance : refetchTokenBalance

  const hasInsufficientBalance = balanceIn != null && amountRaw > BigInt(balanceIn.toString())

  const fetchQuote = useCallback(async () => {
    if (!address || !amountIn || parseFloat(amountIn) <= 0) return
    if (hasInsufficientBalance) {
      setError('Insufficient balance')
      return
    }
    setError(null)
    setQuote(null)
    setLoadingQuote(true)
    try {
      const res = await fetch('/api/uniswap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'EXACT_INPUT',
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          amount: amountRaw.toString(),
          tokenInChainId: swapChainId,
          tokenOutChainId: swapChainId,
          swapper: address,
          slippageTolerance: 5,
          routingPreference: 'BEST_PRICE',
        }),
      })
      const data = (await res.json()) as Record<string, unknown>
      if (!res.ok) throw new Error((data?.error ?? data?.detail ?? data?.message ?? 'Quote failed') as string)

      const amountOut = extractAmountOut(data)
      if (!amountOut) throw new Error('Invalid quote response')

      const gasFee = data.classicGasUseEstimateUSD ?? data.gasFee
      setQuote({
        amountOut: formatAmount(BigInt(amountOut), tokenOut.decimals),
        raw: data,
        gasFee: gasFee != null ? `$${Number(gasFee).toFixed(2)}` : undefined,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Quote failed')
    } finally {
      setLoadingQuote(false)
    }
  }, [address, amountIn, tokenIn, tokenOut, amountRaw, hasInsufficientBalance])

  const handleSwap = useCallback(async () => {
    if (!address || !quote?.raw || swapping || approving) return
    setError(null)

    try {
      await switchChainAsync({ chainId: swapChainId })

      const raw = quote.raw as Record<string, unknown>
      const routing = (raw.routing as string) ?? 'CLASSIC'

      // 1. APPROVAL (per Uniswap example: amount * 2 for approval)
      if (tokenIn.symbol !== 'ETH') {
        setApproving(true)
        const approvalAmount = (amountRaw * BigInt(2)).toString()
        const checkRes = await fetch('/api/uniswap/check-approval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: address,
            token: tokenIn.address,
            amount: approvalAmount,
            chainId: swapChainId,
            tokenOut: tokenOut.address,
            tokenOutChainId: swapChainId,
          }),
        })
        const checkData = (await checkRes.json()) as Record<string, unknown>
        if (checkRes.ok && checkData.approval) {
          const app = checkData.approval as { to?: string; data?: string; value?: string }
          if (app.to && app.data) {
            await sendCallsAsync({
              calls: [{
                to: app.to as `0x${string}`,
                data: app.data as `0x${string}`,
                value: app.value ? BigInt(app.value) : BigInt(0),
              }],
              chainId: swapChainId,
            })
          }
        }
        setApproving(false)
      }

      setSwapping(true)

      // 2. Re-fetch quote right before swap (minimize staleness)
      const refreshRes = await fetch('/api/uniswap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'EXACT_INPUT',
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          amount: amountRaw.toString(),
          tokenInChainId: swapChainId,
          tokenOutChainId: swapChainId,
          swapper: address,
          slippageTolerance: 5,
          routingPreference: 'BEST_PRICE',
        }),
      })
      const refreshData = (await refreshRes.json()) as Record<string, unknown>
      if (!refreshRes.ok) throw new Error((refreshData?.error ?? refreshData?.detail ?? 'Quote refresh failed') as string)

      const quoteForSwap = (refreshData.quote as Record<string, unknown>) ?? getQuoteForSwap(refreshData)
      if (!quoteForSwap) throw new Error('Invalid quote')

      const permitData = refreshData.permitData as
        | { domain: object; types: Record<string, unknown>; values: Record<string, unknown> }
        | undefined

      let signature: string | undefined
      if (permitData) {
        const types = permitData.types as Record<string, { name: string; type: string }[]>
        const primaryType = types.PermitSingle
          ? 'PermitSingle'
          : types.PermitWitnessTransferFrom
            ? 'PermitWitnessTransferFrom'
            : (Object.keys(types).find((k) => k !== 'EIP712Domain') as string) ?? 'PermitSingle'
        signature = await signTypedDataAsync({
          domain: permitData.domain as { name?: string; chainId?: number; verifyingContract?: `0x${string}` },
          types,
          primaryType,
          message: permitData.values as Record<string, unknown>,
        })
      }

      // 3. SWAP (per Uniswap example: CLASSIC/WRAP/UNWRAP/BRIDGE use /swap)
      const isClassicRoute =
        routing === 'CLASSIC' || routing === 'WRAP' || routing === 'UNWRAP' || routing === 'BRIDGE'

      if (isClassicRoute) {
        const swapRes = await fetch('/api/uniswap/swap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quote: quoteForSwap,
            permitData: permitData ?? undefined,
            signature: signature ?? undefined,
          }),
        })
        const swapData = (await swapRes.json()) as Record<string, unknown>
        if (!swapRes.ok) throw new Error((swapData?.error ?? swapData?.detail ?? 'Swap failed') as string)

        const tx = (swapData.swap ?? swapData.transaction ?? swapData.tx) as {
          to?: string
          data?: string
          input?: string
          value?: string
          chainId?: number
        } | undefined
        if (!tx?.to || (!tx.data && !tx.input))
          throw new Error('Invalid transaction in swap response')

        const hash = await sendCallsAsync({
          calls: [{
            to: tx.to as `0x${string}`,
            data: (tx.data ?? tx.input) as `0x${string}`,
            value: tx.value ? BigInt(tx.value) : BigInt(0),
          }],
          chainId: (tx.chainId ?? swapChainId) as 8453 | 84532,
        })
        setTxHash(typeof hash === 'string' ? hash : (hash as { id?: string })?.id ?? null)
        setAmountIn('')
        setQuote(null)
        refetchBalanceIn()
      } else {
        // DUTCH_V2, DUTCH_V3, PRIORITY: try /swap with quote (some routes may work)
        const swapRes = await fetch('/api/uniswap/swap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quote: quoteForSwap,
            permitData: permitData ?? undefined,
            signature: signature ?? undefined,
          }),
        })
        const swapData = (await swapRes.json()) as Record<string, unknown>
        if (!swapRes.ok) throw new Error((swapData?.error ?? swapData?.detail ?? 'Swap failed') as string)

        const tx = (swapData.swap ?? swapData.transaction ?? swapData.tx) as {
          to?: string
          data?: string
          input?: string
          value?: string
          chainId?: number
        } | undefined
        if (!tx?.to || (!tx.data && !tx.input))
          throw new Error('This route requires order flow – try swapping ETH ↔ USDC for CLASSIC route')

        const hash = await sendCallsAsync({
          calls: [{
            to: tx.to as `0x${string}`,
            data: (tx.data ?? tx.input) as `0x${string}`,
            value: tx.value ? BigInt(tx.value) : BigInt(0),
          }],
          chainId: (tx.chainId ?? swapChainId) as 8453 | 84532,
        })
        setTxHash(typeof hash === 'string' ? hash : (hash as { id?: string })?.id ?? null)
        setAmountIn('')
        setQuote(null)
        refetchBalanceIn()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Swap failed')
    } finally {
      setSwapping(false)
      setApproving(false)
    }
  }, [address, quote, swapping, approving, tokenIn, tokenOut, amountRaw, swapChainId, sendCallsAsync, switchChainAsync, signTypedDataAsync, refetchBalanceIn])

  const flipTokens = () => {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
    setAmountIn('')
    setQuote(null)
  }

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <button type="button" onClick={() => router.back()} className="rounded p-2 text-muted-foreground hover:bg-muted" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-bold text-lg">Swap</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <button
            type="button"
            onClick={() => connect()}
            disabled={isConnecting}
            className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {isConnecting ? 'Connecting…' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <button type="button" onClick={() => router.back()} className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-bold text-lg flex-1">Swap</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">Network:</span>
          <select
            value={isSupportedChain ? chainId : `unsupported-${chainId}`}
            onChange={(e) => {
              const val = e.target.value
              if (val.startsWith('unsupported-')) return
              const id = Number(val)
              if (SUPPORTED_CHAINS.some((c) => c.id === id)) switchChainAsync({ chainId: id })
            }}
            disabled={isSwitchingChain}
            className="rounded-lg border border-border bg-muted px-3 py-1.5 text-sm font-medium min-w-0 max-w-[140px] disabled:opacity-50"
          >
            {!isSupportedChain && (
              <option value={`unsupported-${chainId}`}>{chainName}</option>
            )}
            {SUPPORTED_CHAINS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {isSwitchingChain && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-md mx-auto space-y-4">
          {!isSupportedChain && (
            <p className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
              Switch to Base or Base Sepolia to swap.
            </p>
          )}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">You pay</p>
              {balanceIn != null && (
                <p className="text-xs text-muted-foreground">
                  Balance: {formatAmount(BigInt(balanceIn.toString()), tokenIn.decimals)} {tokenIn.symbol}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                value={amountIn}
                onChange={(e) => {
                  setAmountIn(e.target.value.replace(/[^0-9.]/g, ''))
                  setQuote(null)
                }}
                className="flex-1 min-w-0 bg-transparent text-xl font-semibold outline-none placeholder:text-muted-foreground"
              />
              <select
                value={tokenIn.symbol}
                onChange={(e) => {
                  const t = TOKENS.find((x) => x.symbol === e.target.value) ?? TOKENS[0]
                  setTokenIn(t)
                  setQuote(null)
                }}
                className="rounded-lg border border-border bg-muted px-3 py-2 text-sm font-medium"
              >
                {TOKENS.map((t) => (
                  <option key={t.symbol} value={t.symbol}>
                    {t.symbol}
                  </option>
                ))}
              </select>
            </div>
            {hasInsufficientBalance && amountIn && (
              <p className="text-xs text-destructive">Insufficient {tokenIn.symbol} balance</p>
            )}
          </div>

          <button type="button" onClick={flipTokens} className="flex justify-center -my-1" aria-label="Flip tokens">
            <div className="rounded-full border-2 border-border bg-background p-1.5">
              <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs text-muted-foreground">You receive</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xl font-semibold text-muted-foreground">{quote ? quote.amountOut : '—'}</span>
              <select
                value={tokenOut.symbol}
                onChange={(e) => {
                  const t = TOKENS.find((x) => x.symbol === e.target.value) ?? TOKENS[1]
                  setTokenOut(t)
                  setQuote(null)
                }}
                className="rounded-lg border border-border bg-muted px-3 py-2 text-sm font-medium"
              >
                {TOKENS.map((t) => (
                  <option key={t.symbol} value={t.symbol}>
                    {t.symbol}
                  </option>
                ))}
              </select>
            </div>
            {quote?.gasFee && (
              <p className="text-xs text-muted-foreground">Est. gas: {quote.gasFee}</p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {txHash && (
            <a
              href={`https://${isSepolia ? 'sepolia.' : ''}basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              View transaction <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {!quote && parseFloat(amountIn) > 0 && (
            <button
              type="button"
              onClick={fetchQuote}
              disabled={loadingQuote || hasInsufficientBalance || !isSupportedChain}
              className="w-full rounded-md px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loadingQuote ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Get Quote
                </>
              ) : (
                'Get Quote'
              )}
            </button>
          )}

          {quote && (
            <button
              type="button"
              onClick={handleSwap}
              disabled={swapping || approving || !isSupportedChain}
              className="w-full rounded-md px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {swapping || approving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  {approving ? 'Approving…' : 'Swapping…'}
                </>
              ) : (
                'Swap'
              )}
            </button>
          )}

          <p className="text-xs text-muted-foreground text-center">Powered by Uniswap on Base</p>
        </div>
      </div>
    </div>
  )
}
