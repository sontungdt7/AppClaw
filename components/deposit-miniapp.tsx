'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useWallet } from '@/lib/wallet-context'

export function DepositMiniApp() {
  const { address, isConnected } = useWallet()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 px-4 py-6">
        <div className="rounded-xl bg-card border border-border p-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="font-bold text-lg">Deposit asset on</h2>
            <div className="flex items-center gap-1.5">
              <div className="size-6 rounded-full bg-white flex items-center justify-center">
                <span className="text-[10px] font-bold text-[#0052ff]">B</span>
              </div>
              <span className="font-semibold">Base</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Send/withdraw assets on Base to the address below.
          </p>

          {isConnected && address ? (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 flex items-center justify-between gap-3">
              <p
                className="text-primary font-mono text-sm break-all flex-1 min-w-0"
                style={{ wordBreak: 'break-all' }}
              >
                {address}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded text-primary font-semibold text-sm hover:bg-primary/10 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="rounded-lg bg-muted/50 border border-border p-4">
              <p className="text-muted-foreground text-sm">
                Connect your wallet to see your deposit address.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
