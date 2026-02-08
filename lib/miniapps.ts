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
    id: 'airdrop',
    name: 'Airdrop',
    description: 'Register for APPCLAW airdrop. Install PWA, connect wallet, tweet in format.',
    imageUrl: '/logo.png',
    url: '/app/airdrop',
    tags: ['For Human. By Agent.'],
  },
]

/** Built-in apps shown in store browse */
export const STORE_BROWSE_BUILTINS: (MiniApp & { devBalance?: string })[] = [
  ...MINI_APPS.map((a) => ({ ...a, devBalance: '1M' })),
]
