'use client'

import { Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ChevronDown, DollarSign, MessageCircleQuestion, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AirdropMiniApp } from '@/components/airdrop-miniapp'
import { FeedbackMiniApp } from '@/components/feedback-miniapp'
import { DepositMiniApp } from '@/components/deposit-miniapp'
import { SendMiniApp } from '@/components/send-miniapp'
import { WalletMiniApp } from '@/components/wallet-miniapp'

export default function MiniAppPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const feedbackHeader = (
    <div className="flex h-14 items-center justify-between px-4 border-b border-border">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <div className="size-9 rounded-full bg-primary flex items-center justify-center shrink-0">
          <MessageCircleQuestion className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
      <Link href="/" className="flex items-center gap-2">
        <div className="size-8 rounded-full overflow-hidden border-2 border-primary/50">
          <Image src="/logo.png" alt="" width={32} height={32} className="size-full object-cover" />
        </div>
        <span className="font-semibold">AppClaw</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Link>
    </div>
  )

  const depositHeader = (
    <div className="flex h-14 items-center justify-between px-4 border-b border-border">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="size-9 rounded-full bg-primary flex items-center justify-center shrink-0">
          <DollarSign className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
      <Link href="/" className="flex items-center gap-2">
        <div className="size-8 rounded-full overflow-hidden border-2 border-primary/50">
          <Image src="/logo.png" alt="" width={32} height={32} className="size-full object-cover" />
        </div>
        <span className="font-semibold">AppClaw</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Link>
      <div className="flex items-center gap-2">
        <span className="text-sm text-primary font-medium">Pro</span>
        <div className="w-10 h-6 rounded-full bg-muted relative">
          <div className="absolute right-1 top-1 size-4 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  )

  const sendHeader = (
    <div className="flex h-14 items-center justify-between px-4 border-b border-border">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <div className="size-9 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Send className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
      <Link href="/" className="flex items-center gap-2">
        <div className="size-8 rounded-full overflow-hidden border-2 border-primary/50">
          <Image src="/logo.png" alt="" width={32} height={32} className="size-full object-cover" />
        </div>
        <span className="font-semibold">AppClaw</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Link>
      <div className="flex items-center gap-2">
        <span className="text-sm text-primary font-medium">Pro</span>
        <div className="w-10 h-6 rounded-full bg-muted relative">
          <div className="absolute right-1 top-1 size-4 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  )

  if (id === 'wallet') {
    return <WalletMiniApp />
  }

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
          <Suspense fallback={<div className="p-6 animate-pulse text-muted-foreground">Loading...</div>}>
            <AirdropMiniApp />
          </Suspense>
        </main>
      </div>
    )
  }

  if (id === 'feedback') {
    return (
      <div className="min-h-screen flex flex-col">
        {feedbackHeader}
        <main className="flex-1">
          <FeedbackMiniApp />
        </main>
      </div>
    )
  }

  if (id === 'deposit') {
    return (
      <div className="min-h-screen flex flex-col">
        {depositHeader}
        <main className="flex-1">
          <DepositMiniApp />
        </main>
      </div>
    )
  }

  if (id === 'send') {
    return (
      <div className="min-h-screen flex flex-col">
        {sendHeader}
        <main className="flex-1">
          <SendMiniApp />
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
