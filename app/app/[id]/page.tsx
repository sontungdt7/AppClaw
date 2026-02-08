'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AirdropMiniApp } from '@/components/airdrop-miniapp'

export default function MiniAppPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  if (id === 'airdrop') {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="border-b border-border">
          <div className="container mx-auto flex h-14 items-center gap-4 px-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-semibold">Airdrop</h1>
          </div>
        </div>
        <main className="flex-1">
          <AirdropMiniApp />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <p className="text-muted-foreground">Mini app not found</p>
      <Button variant="outline" onClick={() => router.push('/')} className="mt-4">
        Go Home
      </Button>
    </div>
  )
}
