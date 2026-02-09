'use client'

import { Header } from '@/components/header'
import { AppGrid } from '@/components/app-grid'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <AppGrid />
    </div>
  )
}
