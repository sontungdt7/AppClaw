'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, MoreVertical, LogOut } from 'lucide-react'
import { useWallet } from '@/lib/wallet-context'

export function Header() {
  const { address, disconnect } = useWallet()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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
