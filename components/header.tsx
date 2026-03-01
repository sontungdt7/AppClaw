'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Users } from 'lucide-react'

export function Header() {
  const [userCount, setUserCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/wallet/count')
      .then((r) => r.json())
      .then((d) => setUserCount(typeof d.count === 'number' ? d.count : 0))
      .catch(() => setUserCount(null))
  }, [])

  return (
    <header className="border-b border-border/50">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="size-8 rounded-full overflow-hidden border-2 border-primary/50">
            <Image src="/logo.png?v=2" alt="" width={32} height={32} className="size-full object-cover" />
          </div>
          <span className="font-semibold text-lg">AppClaw</span>
        </Link>
        <div className="flex-1" />
        {userCount !== null && (
          <div
            className="flex items-center gap-1.5 text-muted-foreground"
            title={`${userCount.toLocaleString()} users signed up`}
          >
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium tabular-nums">{userCount.toLocaleString()}</span>
          </div>
        )}
      </div>
    </header>
  )
}
