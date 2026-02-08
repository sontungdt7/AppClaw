'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import type { MiniApp } from '@/lib/miniapps'

export function MiniAppCard({ app }: { app: MiniApp }) {
  return (
    <Link
      href={app.url}
      className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        <Image
          src={app.imageUrl}
          alt={app.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-foreground">{app.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {app.description}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
    </Link>
  )
}
