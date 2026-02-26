'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useReadContract, useSendCalls } from 'wagmi'
import { encodeFunctionData } from 'viem'
import { ArrowLeft, Wallet, Code, Upload, Key, LogOut, UserPlus, Send, X } from 'lucide-react'
import { useWallet } from '@/lib/wallet-context'

const DEV_MODE_KEY = 'appclaw-developer-mode'
const ERC20_ABI = [
  { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'transfer', outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
] as const

// USDC on Base mainnet (chainId 8453)
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const
const USDC_DECIMALS = 6
const BASE_CHAIN_ID = 8453

const isDevelopment = process.env.NEXT_PUBLIC_ENVIRONMENT === 'DEVELOPMENT'

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr.trim())
}

export function WalletMiniApp() {
  const { address, isConnected, connect, disconnect, isConnecting } = useWallet()
  const router = useRouter()
  const [devMode, setDevMode] = useState(false)
  const [showSend, setShowSend] = useState(false)
  const [sendTo, setSendTo] = useState('')
  const [sendAmount, setSendAmount] = useState('')

  const { sendCallsAsync, isPending: isSendPending } = useSendCalls()

  useEffect(() => {
    if (!isDevelopment) return
    try {
      setDevMode(localStorage.getItem(DEV_MODE_KEY) === '1')
    } catch {
      setDevMode(false)
    }
  }, [])

  const { data: balance, isPending, isError, refetch } = useReadContract({
    address: USDC_BASE,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    chainId: BASE_CHAIN_ID,
  })

  const handleConfirmSend = useCallback(async () => {
    const to = sendTo.trim()
    const amount = parseFloat(sendAmount)
    if (!address || !to || !isValidAddress(to) || isNaN(amount) || amount <= 0) return
    const amountRaw = BigInt(Math.floor(amount * 10 ** USDC_DECIMALS))
    if (amountRaw === BigInt(0)) return
    const bal = balance ? BigInt(balance.toString()) : BigInt(0)
    if (amountRaw > bal) return

    try {
      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [to as `0x${string}`, amountRaw],
      })
      await sendCallsAsync({
        calls: [{ to: USDC_BASE, data }],
        chainId: BASE_CHAIN_ID,
      })
      setShowSend(false)
      setSendTo('')
      setSendAmount('')
      refetch()
    } catch (e) {
      console.error('Send failed:', e)
    }
  }, [address, sendTo, sendAmount, balance, sendCallsAsync, refetch])

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

  const handleCopyAddress = useCallback(() => {
    if (!address) return
    navigator.clipboard.writeText(address)
  }, [address])

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
              <p
                role="button"
                tabIndex={0}
                onClick={handleCopyAddress}
                onKeyDown={(e) => e.key === 'Enter' && handleCopyAddress()}
                className="font-mono text-sm break-all cursor-pointer select-text hover:bg-muted/50 rounded px-1 -mx-1 py-0.5 -my-0.5 active:bg-muted transition-colors"
                title="Click to copy"
              >
                {address}
              </p>
            </div>
          )}

          {address && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Token Balance</p>
                  <p className="text-2xl font-bold text-primary">
                    {isError
                      ? 'Unable to load'
                      : isPending || balance === undefined
                        ? 'Loading…'
                        : `${(Number(balance) / 10 ** USDC_DECIMALS).toFixed(2)} USDC`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSend(true)}
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>
            </div>
          )}

          {showSend && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Send USDC</h3>
                  <button
                    type="button"
                    onClick={() => { setShowSend(false); setSendTo(''); setSendAmount('') }}
                    className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="send-to" className="block text-sm font-medium text-foreground mb-1">Destination address</label>
                    <input
                      id="send-to"
                      type="text"
                      placeholder="0x..."
                      value={sendTo}
                      onChange={(e) => setSendTo(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="send-amount" className="block text-sm font-medium text-foreground mb-1">Amount (USDC)</label>
                    <input
                      id="send-amount"
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {balance != null && (
                      <button
                        type="button"
                        onClick={() => setSendAmount((Number(balance) / 10 ** USDC_DECIMALS).toFixed(2))}
                        className="mt-1 text-xs text-primary hover:underline"
                      >
                        Max
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmSend}
                    disabled={
                      isSendPending ||
                      !sendTo.trim() ||
                      !isValidAddress(sendTo.trim()) ||
                      !sendAmount ||
                      parseFloat(sendAmount) <= 0 ||
                      (balance != null && parseFloat(sendAmount) * 10 ** USDC_DECIMALS > Number(balance))
                    }
                    className="w-full rounded-md px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendPending ? 'Confirming…' : 'Confirm'}
                  </button>
                </div>
              </div>
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
