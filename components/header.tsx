'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, MoreVertical } from 'lucide-react'
import { WalletButton } from './wallet-button'

export function Header() {
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
        <div className="flex-1 flex items-center justify-end gap-2">
          <WalletButton />
          <button
            type="button"
            className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Menu"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
