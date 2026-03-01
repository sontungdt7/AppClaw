'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { WalletButton } from '@/components/wallet-button'

export function Header() {
  const pathname = usePathname()

  return (
    <header className="border-b border-border/50">
      <div className="flex h-14 items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="size-8 rounded-full overflow-hidden border-2 border-primary/50">
            <Image src="/logo.png?v=2" alt="" width={32} height={32} className="size-full object-cover" />
          </div>
          <span className="font-semibold text-lg">AppClaw</span>
        </Link>

        <nav className="hidden md:flex flex-1 items-center justify-center gap-2">
          {[
            { href: '/build', label: 'Build' },
            { href: '/appstore', label: 'AppStore' },
          ].map((item) => {
            const isActive = pathname === item.href || (item.href === '/build' && pathname === '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="ml-auto">
          <WalletButton />
        </div>
      </div>
    </header>
  )
}
