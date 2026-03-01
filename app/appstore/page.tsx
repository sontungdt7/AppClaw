'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/header'
import { FactoryNav } from '@/components/factory-nav'
import { STORE_BROWSE_BUILTINS, type MiniApp } from '@/lib/miniapps'

type AppStoreEntry = MiniApp & { devBalance?: string; verified?: boolean }

export default function AppStoreFactoryPage() {
  const { data: apiApps = [] } = useQuery({
    queryKey: ['factory-appstore-miniapps'],
    queryFn: async () => {
      const res = await fetch('/api/miniapps')
      if (!res.ok) return []
      return res.json()
    },
  })

  const apps = useMemo(
    () => [
      ...STORE_BROWSE_BUILTINS,
      ...apiApps.map((app: AppStoreEntry) => ({ ...app, tags: app.tags ?? [] })),
    ],
    [apiApps]
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <FactoryNav />
      <main className="px-4 py-6 pb-24 md:pb-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">User Generated Apps</h1>
          </div>
          <span className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">Newest</span>
        </div>

        <div className="rounded-xl border border-border bg-card divide-y divide-border/50">
          {apps.map((app) => {
            return (
              <div key={app.id} className="flex items-center gap-3 p-4">
                <div className="relative size-12 rounded-lg overflow-hidden bg-muted shrink-0">
                  <Image src={app.imageUrl} alt={app.name} fill className="object-cover" unoptimized />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{app.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{app.description}</p>
                  {app.tags && app.tags.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">#{app.tags.slice(0, 3).join(' #')}</p>
                  )}
                </div>
                <a
                  href={app.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  Open
                </a>
              </div>
            )
          })}
          {apps.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">No apps yet. Build one in the Build tab.</div>
          )}
        </div>
      </main>
    </div>
  )
}
