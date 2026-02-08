'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

const INSTALL_DISMISSED_KEY = 'appclaw-install-dismissed'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const dismissed = typeof window !== 'undefined' && localStorage.getItem(INSTALL_DISMISSED_KEY)
    if (dismissed) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as { standalone?: boolean }).standalone) {
      setIsInstalled(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    const handler = () => {
      setIsInstalled(true)
      setShowBanner(false)
      localStorage.setItem(INSTALL_DISMISSED_KEY, '1')
    }
    window.addEventListener('appinstalled', handler)
    return () => window.removeEventListener('appinstalled', handler)
  }, [])

  if (!showBanner || isInstalled || !deferredPrompt) return null

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
    localStorage.setItem(INSTALL_DISMISSED_KEY, '1')
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem(INSTALL_DISMISSED_KEY, '1')
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 shadow-lg">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Install AppClaw</p>
          <p className="text-xs text-muted-foreground">Add to home screen for quick access</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleInstall}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Install
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
