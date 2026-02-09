'use client'

import { useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { WalletBridgeProvider } from '@/components/wallet-bridge-provider'

function ViewContent() {
  const searchParams = useSearchParams()
  const url = searchParams.get('url')
  const title = searchParams.get('title')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const decoded = url ? decodeURIComponent(url) : ''
  const isExternal = decoded.startsWith('http://') || decoded.startsWith('https://')
  const displayTitle = title ? decodeURIComponent(title) : ''

  if (!url) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">No URL provided</p>
        <Link href="/" className="text-primary underline">Go home</Link>
      </div>
    )
  }

  if (!isExternal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Invalid URL</p>
        <Link href="/" className="text-primary underline">Go home</Link>
      </div>
    )
  }

  return (
    <WalletBridgeProvider iframeRef={iframeRef}>
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex h-12 items-center gap-2 px-4 border-b border-border shrink-0">
          <Link
            href="/"
            className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {displayTitle && (
            <span className="text-sm text-foreground font-medium truncate">{displayTitle}</span>
          )}
        </div>
        <iframe
          ref={iframeRef}
          src={decoded}
          title="Mini App"
          className="flex-1 w-full min-h-0 border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </WalletBridgeProvider>
  )
}

export default function ViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ViewContent />
    </Suspense>
  )
}
