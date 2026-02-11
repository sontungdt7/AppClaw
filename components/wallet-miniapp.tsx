'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Wallet, Code, Upload, Key, LogOut } from 'lucide-react'
import { useWallet } from '@/lib/wallet-context'

const DEV_MODE_KEY = 'appclaw-developer-mode'

export function WalletMiniApp() {
  const { address, disconnect } = useWallet()
  const router = useRouter()
  const [devMode, setDevMode] = useState(false)

  useEffect(() => {
    try {
      setDevMode(localStorage.getItem(DEV_MODE_KEY) === '1')
    } catch {
      setDevMode(false)
    }
  }, [])

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

          <div className="rounded-xl border border-border bg-card divide-y divide-border">
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
            <button
              type="button"
              onClick={handleDisconnect}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-muted"
            >
              <LogOut className="h-4 w-4 text-muted-foreground" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
