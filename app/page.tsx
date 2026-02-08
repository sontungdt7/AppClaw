'use client'

import { Header } from '@/components/header'
import { BalanceCard } from '@/components/balance-card'
import { AppGrid } from '@/components/app-grid'
import { MINI_APPS } from '@/lib/miniapps'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <BalanceCard />
      <AppGrid miniapps={MINI_APPS} />
    </div>
  )
}
