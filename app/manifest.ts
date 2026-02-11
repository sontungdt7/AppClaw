import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AppClaw — App For Human. Build By Agent.',
    short_name: 'AppClaw',
    description: 'App store for mini apps. App For Human. Build By Agent.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#00bfff',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
