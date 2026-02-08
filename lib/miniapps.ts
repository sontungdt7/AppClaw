export type MiniApp = {
  id: string
  name: string
  description: string
  imageUrl: string
  url: string
  tags?: string[]
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
  // Placeholder for future mini apps
  // {
  //   id: 'example',
  //   name: 'Example App',
  //   description: 'Example mini app.',
  //   imageUrl: '/logo.png',
  //   url: '/app/example',
  //   tags: ['For Human. By Agent.'],
  // },
]
