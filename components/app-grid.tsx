'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Gift, LayoutGrid, PlusCircle } from 'lucide-react'
import { getInstalledIds, DEFAULT_INSTALLED, type MiniApp } from '@/lib/miniapps'

type GridItem = {
  id: string
  name: string
  url: string
  icon: React.ReactNode
  imageUrl?: string
  badge?: string
  variant?: 'yellow' | 'grey'
}

function GridIcon({
  item,
  children,
}: {
  item: GridItem
  children: React.ReactNode
}) {
  const isGrey = item.variant === 'grey'
  const content = (
    <>
      <div
        className={`relative size-14 rounded-xl flex items-center justify-center overflow-hidden ${
          isGrey ? 'bg-muted' : 'bg-primary'
        }`}
      >
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
        ) : (
          <span className={isGrey ? 'text-foreground' : 'text-primary-foreground [&>svg]:size-6 [&>svg]:stroke-[2.5]'}>
            {children}
          </span>
        )}
        {item.badge && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center z-10">
            {item.badge}
          </span>
        )}
      </div>
      <span className="text-xs text-foreground font-medium text-center">
        {item.name}
      </span>
    </>
  )
  const isPlaceholder = item.url === '#'
  if (isPlaceholder) {
    return <div className="flex flex-col items-center gap-2 opacity-60">{content}</div>
  }
  const href = item.url.startsWith('http')
    ? `/app/view?url=${encodeURIComponent(item.url)}`
    : item.url
  return (
    <Link href={href} className="flex flex-col items-center gap-2 group">
      {content}
    </Link>
  )
}

export function AppGrid({ miniapps }: { miniapps: MiniApp[] }) {
  const [installedIds, setInstalledIds] = useState<string[]>(DEFAULT_INSTALLED)
  useEffect(() => {
    setInstalledIds(getInstalledIds())
  }, [])
  const installedSet = new Set(installedIds)

  const installableItems: GridItem[] = [
    ...miniapps
      .filter((app) => installedSet.has(app.id))
      .map((app) => ({
        id: app.id,
        name: app.name,
        url: app.url,
        icon: app.id === 'airdrop' ? <Gift /> : <LayoutGrid />,
        imageUrl: app.url.startsWith('http') ? app.imageUrl : undefined,
        badge: app.id === 'airdrop' ? 'New' : undefined,
        variant: 'yellow' as const,
      })),
  ]

  const items: GridItem[] = [
    {
      id: 'appstore',
      name: 'App Store',
      url: '/store',
      icon: <LayoutGrid />,
      variant: 'yellow',
    },
    ...installableItems,
    {
      id: 'submit',
      name: 'Submit App',
      url: '/submit',
      icon: <PlusCircle />,
      variant: 'yellow',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4 px-4 py-6">
      {items.map((item) => (
        <GridIcon key={item.id} item={item}>
          {item.icon}
        </GridIcon>
      ))}
    </div>
  )
}
