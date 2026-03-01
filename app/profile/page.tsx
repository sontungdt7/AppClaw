'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/header'
import { FactoryNav } from '@/components/factory-nav'
import { useWallet } from '@/lib/wallet-context'
import { MINI_APPS, getInstalledIds, type MiniApp } from '@/lib/miniapps'

type ApiMiniApp = MiniApp & { verified?: boolean }

export default function ProfilePage() {
  const { address, disconnect, isConnected } = useWallet()
  const router = useRouter()
  const [installedIds, setInstalledIds] = useState<string[]>([])

  const { data: userCount } = useQuery({
    queryKey: ['profile-wallet-count'],
    queryFn: async () => {
      const res = await fetch('/api/wallet/count')
      const data = await res.json()
      return typeof data?.count === 'number' ? data.count : 0
    },
  })

  const { data: apiApps = [] } = useQuery({
    queryKey: ['profile-miniapps'],
    queryFn: async () => {
      const res = await fetch('/api/miniapps')
      if (!res.ok) return []
      return res.json()
    },
  })

  useEffect(() => {
    setInstalledIds(getInstalledIds())
  }, [])

  const myApps = useMemo(() => {
    const idSet = new Set(installedIds)
    const ownedBuiltIns = MINI_APPS.filter((app) => idSet.has(app.id))
    const ownedApiApps = (apiApps as ApiMiniApp[]).filter((app) => idSet.has(app.id))

    return [...ownedBuiltIns, ...ownedApiApps]
  }, [installedIds, apiApps])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <FactoryNav />
      <main className="px-4 py-6 pb-24 md:pb-6 space-y-4">
        <h1 className="text-xl font-bold">Profile</h1>

        <section className="rounded-xl border border-border bg-card p-4 space-y-2">
          <p className="text-sm text-muted-foreground">Wallet</p>
          <p className="font-mono text-sm break-all">{address ?? 'Not connected'}</p>
          <div className="flex items-center gap-6 pt-2 text-sm">
            <div>
              <p className="text-muted-foreground">Users</p>
              <p className="font-semibold">{(userCount ?? 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">My Apps</p>
              <p className="font-semibold">{myApps.length}</p>
            </div>
          </div>
          {isConnected && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  disconnect()
                  router.push('/build')
                }}
                className="rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm font-medium hover:bg-muted"
              >
                Log out
              </button>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card divide-y divide-border/50">
          <div className="p-4">
            <p className="font-semibold">My Apps</p>
            <p className="text-xs text-muted-foreground mt-1">
              MVP note: ownership is currently based on installed apps on this device.
            </p>
          </div>
          {myApps.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No apps yet. Start in Build and publish to AppStore.</div>
          ) : (
            myApps.map((app) => (
              <div key={app.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{app.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{app.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={app.url.startsWith('http') ? `/app/view?url=${encodeURIComponent(app.url)}&title=${encodeURIComponent(app.name)}` : app.url}
                    className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted"
                  >
                    View
                  </Link>
                  <button type="button" className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">
                    Edit (Soon)
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  )
}
