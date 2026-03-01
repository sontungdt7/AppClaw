'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/header'
import { FactoryNav } from '@/components/factory-nav'

export default function GeneratedSwapStatusPage() {
  const searchParams = useSearchParams()
  const appName = searchParams.get('name') || 'My Swap App'
  const logoUrl = searchParams.get('logo') || '/logo.png?v=2'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <FactoryNav />
      <main className="px-4 py-6 pb-24 md:pb-6 flex-1">
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt={appName}
              className="size-14 rounded-xl border border-border bg-muted object-cover"
            />
            <div>
              <h1 className="text-xl font-bold">{appName}</h1>
              <p className="text-sm text-muted-foreground">Swap App on Base (Phase 1)</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-4 space-y-2">
            <p className="text-sm">
              <span className="font-medium">Status:</span> Deployed successfully
            </p>
            <p className="text-sm text-muted-foreground">
              This is a frontend-only status page template. Contract and backend deployment come in next phases.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/build" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
              Build Another
            </Link>
            <Link href="/appstore" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              View in AppStore
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
