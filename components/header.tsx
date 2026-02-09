'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, MoreVertical, LogOut, Key, Code, Upload } from 'lucide-react'
import { useWallet } from '@/lib/wallet-context'

const DEV_MODE_KEY = 'appclaw-developer-mode'

export function Header() {
  const { address, disconnect } = useWallet()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuOpen])

  return (
    <header className="border-b border-border/50">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex-1" />
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="size-8 rounded-full overflow-hidden border-2 border-primary/50">
            <Image src="/logo.png" alt="" width={32} height={32} className="size-full object-cover" />
          </div>
          <span className="font-semibold text-lg">AppClaw</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Link>
        <div className="flex-1 flex items-center justify-end" ref={menuRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Menu"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 min-w-[200px] rounded-lg border border-border bg-card py-2 shadow-lg z-50">
                {address && (
                  <div className="px-4 py-2 border-b border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Wallet</p>
                    <p className="font-mono text-sm truncate">
                      {address.slice(0, 10)}...{address.slice(-8)}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={toggleDevMode}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
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
                  <Link
                    href="/submit"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Upload className="h-4 w-4" />
                    Submit mini app
                  </Link>
                )}
                <Link
                  href="/account-association"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Key className="h-4 w-4" />
                  Account association
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    disconnect()
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
