'use client'

import { useState, useEffect, useRef } from 'react'
import { RefreshCw } from 'lucide-react'

const VERSION_CHECK_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const VERSION_API = '/api/version'

export function UpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const currentVersionRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkVersion = async () => {
      try {
        const res = await fetch(`${VERSION_API}?t=${Date.now()}`, { cache: 'no-store' })
        const data = await res.json()
        const serverVersion = data?.version ?? null

        if (currentVersionRef.current === null) {
          currentVersionRef.current = serverVersion
          return
        }
        if (serverVersion && currentVersionRef.current !== serverVersion) {
          setUpdateAvailable(true)
        }
      } catch {
        // ignore
      }
    }

    checkVersion()
    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL_MS)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkVersion()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  const handleUpdate = () => {
    window.location.reload()
  }

  if (!updateAvailable) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="max-w-sm w-full rounded-xl border border-border bg-card p-6 shadow-lg text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/20 p-3">
            <RefreshCw className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-lg font-semibold">Update available</h2>
        <p className="text-sm text-muted-foreground">
          A new version of AppClaw is available. Tap Update to load the latest version.
        </p>
        <button
          type="button"
          onClick={handleUpdate}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          Update
        </button>
      </div>
    </div>
  )
}
