'use client'

import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/header'
import { AppGrid } from '@/components/app-grid'
import { MINI_APPS } from '@/lib/miniapps'

export default function HomePage() {
  const { data: apiApps = [] } = useQuery({
    queryKey: ['miniapps'],
    queryFn: async () => {
      const res = await fetch('/api/miniapps')
      if (!res.ok) return []
      return res.json()
    },
  })

  const miniapps = [...MINI_APPS, ...apiApps]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <AppGrid miniapps={miniapps} />
    </div>
  )
}
