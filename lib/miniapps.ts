export type MiniApp = {
  id: string
  name: string
  description: string
  imageUrl: string
  url: string
  devBalance?: string
  tags?: string[]
}

export const INSTALLED_KEY = 'appclaw-installed-apps'
export const DEFAULT_INSTALLED = ['deposit', 'feedback', 'send', 'airdrop']

/** Apps always on home screen (never show Get in store) */
export const ALWAYS_ON_HOME_IDS = ['wallet', 'airdrop', 'memewars']

export function getInstalledIds(): string[] {
  if (typeof window === 'undefined') return DEFAULT_INSTALLED
  try {
    const raw = localStorage.getItem(INSTALLED_KEY)
    if (!raw) return DEFAULT_INSTALLED
    const parsed = JSON.parse(raw) as string[]
    const merged = new Set([...DEFAULT_INSTALLED, ...parsed])
    return Array.from(merged)
  } catch {
    return DEFAULT_INSTALLED
  }
}

export function addInstalled(id: string) {
  if (typeof window === 'undefined') return
  const ids = getInstalledIds()
  if (ids.includes(id)) return
  const base = ids.length > 0 ? ids : DEFAULT_INSTALLED
  localStorage.setItem(INSTALLED_KEY, JSON.stringify([...base, id]))
}

export function removeInstalled(id: string) {
  if (typeof window === 'undefined') return
  const ids = getInstalledIds().filter((x) => x !== id)
  localStorage.setItem(INSTALLED_KEY, JSON.stringify(ids))
}

export const MINI_APPS: MiniApp[] = [
  {
    id: 'wallet',
    name: 'Wallet',
    description: 'View wallet, settings, and total users signed up.',
    imageUrl: '/logo.png',
    url: '/app/wallet',
    tags: ['For Human. By Agent.'],
  },
  {
    id: 'airdrop',
    name: 'Airdrop',
    description: 'Register for APPCLAW airdrop. Install PWA, connect wallet, tweet in format.',
    imageUrl: '/logo.png',
    url: '/app/airdrop',
    tags: ['For Human. By Agent.'],
  },
  {
    id: 'memewars',
    name: 'MemeWars',
    description: 'Multiplayer Onchain Battle Arena.',
    imageUrl: process.env.NEXT_PUBLIC_MEMEWARS_APP_URL
      ? `${process.env.NEXT_PUBLIC_MEMEWARS_APP_URL.replace(/\/$/, '')}/icon.svg`
      : '/icons/memewars.svg',
    url: process.env.NEXT_PUBLIC_MEMEWARS_APP_URL || 'http://localhost:3002',
    tags: ['Coming Soon'],
  },
]

/** Built-in apps shown in store browse */
export const STORE_BROWSE_BUILTINS: (MiniApp & { devBalance?: string })[] = [
  ...MINI_APPS.map((a) => ({ ...a, devBalance: '1M' })),
]
