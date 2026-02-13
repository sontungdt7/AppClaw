'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useReadContract } from 'wagmi'
import { ArrowLeft, Wallet, Code, Upload, Key, LogOut, UserPlus } from 'lucide-react'
import { useWallet } from '@/lib/wallet-context'

const DEV_MODE_KEY = 'appclaw-developer-mode'
const ERC20_ABI = [
  { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' },
] as const

const isDevelopment = process.env.NEXT_PUBLIC_ENVIRONMENT === 'DEVELOPMENT'

export function WalletMiniApp() {
  const { address, isConnected, connect, disconnect, isConnecting } = useWallet()
  const router = useRouter()
  const [devMode, setDevMode] = useState(false)
  const [tokenConfig, setTokenConfig] = useState<{ tokenAddress: string; symbol: string; decimals: number; chainId: number } | null>(null)

  useEffect(() => {
    if (!isDevelopment) return
    try {
      setDevMode(localStorage.getItem(DEV_MODE_KEY) === '1')
    } catch {
      setDevMode(false)
    }
  }, [])

  useEffect(() => {
    fetch('/api/airdrop/config')
      .then((r) => r.json())
      .then((d) => {
        if (d?.tokenAddress)
          setTokenConfig({
            tokenAddress: d.tokenAddress,
            symbol: d.symbol ?? 'APPCLAW',
            decimals: d.decimals ?? 18,
            chainId: d.chainId ?? 8453,
          })
      })
      .catch(() => {})
  }, [])

  const { data: balance, isPending, isError } = useReadContract({
    address: tokenConfig?.tokenAddress as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    chainId: tokenConfig?.chainId,
  })

  const toggleDevMode = () => {
    const next = !devMode
    setDevMode(next)
    try {
      localStorage.setItem(DEV_MODE_KEY, next ? '1' : '0')
    } catch {}
  }

  const handleDisconnect = () => {
    disconnect()
    router.push('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="size-9 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Wallet className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="font-bold text-lg">Wallet</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 space-y-6">
          {address && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Your wallet</p>
              <p className="font-mono text-sm break-all">{address}</p>
            </div>
          )}

          {tokenConfig && address && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Airdrop token balance</p>
              <p className="text-2xl font-bold text-primary">
                {isError
                  ? 'Unable to load'
                  : isPending || balance === undefined
                    ? 'Loading…'
                    : `${Number(balance) / 10 ** tokenConfig.decimals} ${tokenConfig.symbol}`}
              </p>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {isDevelopment && (
              <>
                <button
                  type="button"
                  onClick={toggleDevMode}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm text-foreground hover:bg-muted"
                >
                  <span className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    Developer mode
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      devMode ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    {devMode ? 'ON' : 'OFF'}
                  </span>
                </button>
                {devMode && (
                  <>
                    <Link
                      href="/submit"
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-muted"
                    >
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      Submit mini app
                    </Link>
                    <Link
                      href="/account-association"
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-muted"
                    >
                      <Key className="h-4 w-4 text-muted-foreground" />
                      Account association
                    </Link>
                  </>
                )}
              </>
            )}
            {isConnected && address ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="flex w-full items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-muted"
              >
                <LogOut className="h-4 w-4 text-muted-foreground" />
                Log out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => connect()}
                disabled={isConnecting}
                className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                {isConnecting ? 'Connecting…' : 'Login/SignUp'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
