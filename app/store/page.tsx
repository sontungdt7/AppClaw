'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { Globe, LayoutGrid, ArrowUpDown } from 'lucide-react'
import { Header } from '@/components/header'
import { getInstalledIds, addInstalled, STORE_BROWSE_BUILTINS, type MiniApp } from '@/lib/miniapps'

type StoreApp = MiniApp & { devBalance?: string }

function AppRow({
  app,
  onGet,
  isInstalled,
}: {
  app: StoreApp
  onGet: () => void
  isInstalled: boolean
}) {
  const href = app.url.startsWith('http')
    ? `/app/view?url=${encodeURIComponent(app.url)}`
    : app.url

  return (
    <div className="flex items-center gap-3 py-3 px-4 border-b border-border/50">
      <div className="relative size-12 rounded-lg overflow-hidden bg-muted shrink-0">
        {app.imageUrl?.startsWith('http') ? (
          <Image src={app.imageUrl} alt={app.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="size-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">{app.name.slice(0, 1)}</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-sm truncate">{app.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{app.description}</p>
        {app.devBalance && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {app.devBalance} <span className="text-primary">B</span>
          </p>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <Link
          href={href}
          className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted"
        >
          Open
        </Link>
        {!isInstalled && (
          <button
            type="button"
            onClick={onGet}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get
          </button>
        )}
      </div>
    </div>
  )
}

export default function StorePage() {
  const [tab, setTab] = useState<'browse' | 'myapps'>('browse')
  const [filter, setFilter] = useState<'strict' | 'all'>('all')
  const [installedIds, setInstalledIds] = useState<string[]>([])

  const { data: apiApps = [] } = useQuery({
    queryKey: ['miniapps'],
    queryFn: async () => {
      const res = await fetch('/api/miniapps')
      if (!res.ok) return []
      return res.json()
    },
  })

  useEffect(() => {
    setInstalledIds(getInstalledIds())
  }, [])

  const browseApps: StoreApp[] = [
    ...STORE_BROWSE_BUILTINS,
    ...apiApps.map((a: StoreApp) => ({ ...a, devBalance: a.devBalance ?? '461.1K' })),
  ].sort((a, b) => {
    const toNum = (s: string) => {
      const m = s?.match(/^([\d.]+)([MK])?$/i)
      if (!m) return 0
      const n = parseFloat(m[1])
      return m[2] === 'M' ? n * 1e6 : m[2] === 'K' ? n * 1e3 : n
    }
    return toNum(b.devBalance ?? '') - toNum(a.devBalance ?? '')
  })

  const installedApps = browseApps.filter((a) => installedIds.includes(a.id))

  const handleGet = (id: string) => {
    addInstalled(id)
    setInstalledIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-3 border-b border-border">
          <h1 className="font-bold text-lg mb-3">Browse</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter('strict')}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                filter === 'strict' ? 'bg-muted' : 'bg-transparent text-muted-foreground'
              }`}
            >
              Strict
            </button>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground'
              }`}
            >
              All
            </button>
            <div className="flex-1" />
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowUpDown className="h-3.5 w-3.5" />
              Highest Dev Balance
            </span>
          </div>
        </div>

        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setTab('browse')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${
              tab === 'browse' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
            }`}
          >
            <Globe className="h-4 w-4" />
            Browse
          </button>
          <button
            type="button"
            onClick={() => setTab('myapps')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${
              tab === 'myapps' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            My Apps
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === 'browse' ? (
            <div className="divide-y divide-border/50">
              {browseApps.map((app) => (
                <AppRow
                  key={app.id}
                  app={app}
                  onGet={() => handleGet(app.id)}
                  isInstalled={installedIds.includes(app.id)}
                />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {installedApps.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No apps yet. Tap Get in Browse to add apps.
                </div>
              ) : (
                installedApps.map((app) => (
                  <AppRow
                    key={app.id}
                    app={app}
                    onGet={() => {}}
                    isInstalled
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
