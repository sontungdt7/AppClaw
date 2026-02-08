'use client'

import { useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useWalletBridge } from '@/lib/wallet-bridge'

function ViewContent() {
  const searchParams = useSearchParams()
  const url = searchParams.get('url')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  const decoded = url ? decodeURIComponent(url) : ''
  const isExternal = decoded.startsWith('http://') || decoded.startsWith('https://')
  let iframeOrigin: string | null = null
  if (isExternal) {
    try {
      iframeOrigin = new URL(decoded).origin
    } catch {
      iframeOrigin = null
    }
  }

  useWalletBridge(iframeRef, iframeOrigin, iframeLoaded && isExternal)

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
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex h-12 items-center gap-2 px-4 border-b border-border shrink-0">
        <Link
          href="/"
          className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-sm text-muted-foreground truncate">Mini App</span>
      </div>
      <iframe
        ref={iframeRef}
        src={decoded}
        title="Mini App"
        className="flex-1 w-full min-h-0 border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        onLoad={() => setIframeLoaded(true)}
      />
    </div>
  )
}

export default function ViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ViewContent />
    </Suspense>
  )
}
