'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { getInstalledIds, addInstalled, ALWAYS_ON_HOME_IDS, STORE_BROWSE_BUILTINS, type MiniApp } from '@/lib/miniapps'

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
    ? `/app/view?url=${encodeURIComponent(app.url)}&title=${encodeURIComponent(app.name)}`
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

  const apps: StoreApp[] = [
    ...STORE_BROWSE_BUILTINS,
    ...apiApps.map((a: StoreApp) => ({ ...a, devBalance: a.devBalance ?? '461.1K' })),
  ]

  const handleGet = (id: string) => {
    addInstalled(id)
    setInstalledIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background z-50">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <Link
          href="/"
          className="flex items-center justify-center size-10 -ml-2 rounded-full hover:bg-muted text-foreground"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-bold text-lg">App Store</h1>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border/50 min-h-0">
        {apps.map((app) => (
          <AppRow
            key={app.id}
            app={app}
            onGet={() => handleGet(app.id)}
            isInstalled={installedIds.includes(app.id) || ALWAYS_ON_HOME_IDS.includes(app.id)}
          />
        ))}
      </div>
    </div>
  )
}
