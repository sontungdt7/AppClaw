'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/build', label: 'Build' },
  { href: '/appstore', label: 'AppStore' },
  { href: '/profile', label: 'Profile' },
]

export function FactoryNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur px-3 py-2">
      <div className="grid grid-cols-3 gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href === '/build' && pathname === '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-center text-sm font-medium transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
