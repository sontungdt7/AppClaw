'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Gift, LayoutGrid, Wallet, X } from 'lucide-react'
import { getInstalledIds, removeInstalled, STORE_BROWSE_BUILTINS, MINI_APPS, type MiniApp } from '@/lib/miniapps'

const FIRST_PARTY_IDS = new Set(['appstore', 'wallet', 'airdrop', 'fomo4d'])

type GridItem = {
  id: string
  name: string
  url: string
  icon?: React.ReactNode
  imageUrl?: string
  variant?: 'yellow' | 'grey'
}

function GridIcon({
  item,
  children,
  isRemovable,
  editMode,
  onLongPress,
  onRemove,
}: {
  item: GridItem
  children?: React.ReactNode
  isRemovable: boolean
  editMode: boolean
  onLongPress: () => void
  onRemove: () => void
}) {
  const isGrey = item.variant === 'grey'
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)

  const clearTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handlePressStart = useCallback(() => {
    if (editMode) return
    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null
      longPressTriggered.current = true
      onLongPress()
    }, 500)
  }, [editMode, onLongPress])

  const handlePressEnd = useCallback(() => {
    clearTimer()
  }, [clearTimer])

  useEffect(() => () => clearTimer(), [clearTimer])

  const content = (
    <>
      <div
        className={`relative size-14 rounded-xl flex items-center justify-center overflow-hidden ${
          isGrey ? 'bg-muted' : 'bg-primary'
        } ${editMode && isRemovable ? 'animate-[wiggle_0.3s_ease-in-out_infinite]' : ''}`}
      >
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
        ) : (
          <span className={isGrey ? 'text-foreground' : 'text-primary-foreground [&>svg]:size-6 [&>svg]:stroke-[2.5]'}>
            {children}
          </span>
        )}
        {editMode && isRemovable && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemove()
            }}
            className="absolute -top-1 -right-1 z-10 flex size-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
            aria-label="Remove"
          >
            <X className="size-2.5" strokeWidth={3} />
          </button>
        )}
      </div>
      <span className="text-xs text-foreground font-medium text-center">
        {item.name}
      </span>
    </>
  )

  const href = item.url.startsWith('http')
    ? `/app/view?url=${encodeURIComponent(item.url)}&title=${encodeURIComponent(item.name)}`
    : item.url

  if (editMode) {
    return (
      <div
        className="flex flex-col items-center gap-2"
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressEnd}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
      >
        {content}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 group"
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressEnd}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onClick={(e) => {
        if (longPressTriggered.current) {
          e.preventDefault()
          longPressTriggered.current = false
        }
      }}
    >
      {content}
    </Link>
  )
}

function appToGridItem(app: MiniApp): GridItem {
  const icon =
    app.id === 'airdrop' ? <Gift /> : app.id === 'wallet' ? <Wallet /> : undefined
  return {
    id: app.id,
    name: app.name,
    url: app.url,
    icon,
    imageUrl: app.url.startsWith('http') ? app.imageUrl : undefined,
    variant: 'yellow',
  }
}

export function AppGrid() {
  const pathname = usePathname()
  const [installedIds, setInstalledIds] = useState<string[]>([])
  const [editMode, setEditMode] = useState(false)

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
  }, [pathname])

  const installedSet = new Set(installedIds)
  const allStoreApps: MiniApp[] = [
    ...STORE_BROWSE_BUILTINS,
    ...apiApps,
  ]
  const installedApps = allStoreApps.filter((a) => installedSet.has(a.id))

  const fomo4dApp = MINI_APPS.find((a) => a.id === 'fomo4d')
  const baseItems: GridItem[] = [
    { id: 'appstore', name: 'App Store', url: '/store', icon: <LayoutGrid />, variant: 'yellow' },
    { id: 'wallet', name: 'Wallet', url: '/app/wallet', icon: <Wallet />, variant: 'yellow' },
    { id: 'airdrop', name: 'Airdrop', url: '/app/airdrop', icon: <Gift />, variant: 'yellow' },
    ...(fomo4dApp
      ? [{ id: 'fomo4d', name: 'Fomo4D', url: fomo4dApp.url, imageUrl: '/icons/fomo4d.svg', variant: 'yellow' as const }]
      : []),
  ]

  const installedItems = installedApps
    .filter((a) => a.id !== 'airdrop' && a.id !== 'wallet' && a.id !== 'fomo4d')
    .map(appToGridItem)

  const items = [...baseItems, ...installedItems]

  const handleRemove = (id: string) => {
    removeInstalled(id)
    setInstalledIds(getInstalledIds())
  }

  return (
    <div className="flex flex-col">
      {editMode && (
        <div className="flex justify-end px-4 py-2">
          <button
            type="button"
            onClick={() => setEditMode(false)}
            className="rounded-md bg-muted px-4 py-1.5 text-sm font-medium hover:bg-muted/80"
          >
            Done
          </button>
        </div>
      )}
      <div className="grid grid-cols-4 gap-4 px-4 py-6">
        {items.map((item) => (
          <GridIcon
            key={item.id}
            item={item}
            isRemovable={!FIRST_PARTY_IDS.has(item.id)}
            editMode={editMode}
            onLongPress={() => setEditMode(true)}
            onRemove={() => handleRemove(item.id)}
          >
            {item.icon}
          </GridIcon>
        ))}
      </div>
    </div>
  )
}
