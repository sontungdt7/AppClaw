'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { FactoryNav } from '@/components/factory-nav'

type SwapAppDraft = {
  appName: string
  logoUrl: string
}

type DeploymentStatus = 'idle' | 'queued' | 'building' | 'ready' | 'error'

const DRAFT_KEY = 'appclaw-factory-swap-draft'

export default function BuildPage() {
  const [appName, setAppName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)
  const [appUrl, setAppUrl] = useState<string | null>(null)
  const [deploymentId, setDeploymentId] = useState<string | null>(null)
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>('idle')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as SwapAppDraft
      if (parsed?.appName && parsed?.logoUrl) {
        setAppName(parsed.appName)
        setLogoUrl(parsed.logoUrl)
      }
    } catch {}
  }, [])

  const handleBuild = async (e: FormEvent) => {
    e.preventDefault()
    const nextName = appName.trim()
    const nextLogo = logoUrl.trim()

    if (!nextName || !nextLogo) {
      setError('App name and logo URL are required.')
      return
    }

    if (!/^https?:\/\/.+/i.test(nextLogo) && !nextLogo.startsWith('/')) {
      setError('Logo must be a full URL (https://...) or a local path (/logo.png).')
      return
    }

    setError(null)
    const nextDraft = { appName: nextName, logoUrl: nextLogo }
    setIsDeploying(true)
    setAppUrl(null)
    setDeploymentId(null)
    setDeploymentStatus('queued')

    try {
      const res = await fetch('/api/build/swap/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextDraft),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Deployment failed')

      setAppUrl(typeof data?.appUrl === 'string' ? data.appUrl : null)
      setDeploymentId(typeof data?.deploymentId === 'string' ? data.deploymentId : null)
      const nextStatus: DeploymentStatus = data?.deploymentStatus === 'ready'
        ? 'ready'
        : data?.deploymentStatus === 'building'
          ? 'building'
          : data?.deploymentStatus === 'error'
            ? 'error'
            : 'queued'
      setDeploymentStatus(nextStatus)
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(nextDraft))
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deployment failed')
      setDeploymentStatus('error')
    } finally {
      setIsDeploying(false)
    }
  }

  const resetDraft = () => {
    setAppName('')
    setLogoUrl('')
    setError(null)
    setAppUrl(null)
    setDeploymentId(null)
    setDeploymentStatus('idle')
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {}
  }

  useEffect(() => {
    if (!deploymentId) return
    if (deploymentStatus === 'ready' || deploymentStatus === 'error') return

    const poll = async () => {
      try {
        const res = await fetch(`/api/build/swap/deploy-status?id=${encodeURIComponent(deploymentId)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Status polling failed')

        const status: DeploymentStatus = data?.status === 'ready'
          ? 'ready'
          : data?.status === 'building'
            ? 'building'
            : data?.status === 'error'
              ? 'error'
              : 'queued'
        setDeploymentStatus(status)
        if (typeof data?.appUrl === 'string') {
          setAppUrl(data.appUrl)
        }
      } catch (e) {
        setDeploymentStatus('error')
        setError(e instanceof Error ? e.message : 'Status polling failed')
      }
    }

    const timer = setInterval(poll, 2500)
    void poll()
    return () => clearInterval(timer)
  }, [deploymentId, deploymentStatus])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <FactoryNav />
      <main className="px-4 py-6 pb-24 md:pb-6 flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Swap App</h1>
            <p className="text-sm text-muted-foreground">
              Deploy a Swap App to Base
            </p>
          </div>
          <button
            type="button"
            onClick={resetDraft}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Reset
          </button>
        </div>

        <form onSubmit={handleBuild} className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div>
            <label htmlFor="swap-app-name" className="text-sm font-medium">
              App Name
            </label>
            <input
              id="swap-app-name"
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Blue Whale Swap"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="swap-app-logo" className="text-sm font-medium">
              App Logo URL
            </label>
            <input
              id="swap-app-logo"
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={isDeploying}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {isDeploying ? 'Deploying...' : 'Generate Swap App'}
          </button>
        </form>

        {(deploymentStatus !== 'idle' || appUrl) && (
          <section className="rounded-xl border border-border bg-card p-4 space-y-4">
            <h2 className="font-semibold">Deployment</h2>
            {deploymentId && (
              <div className="rounded-lg border border-border bg-background p-3 text-sm">
                <p className="font-medium">
                  Deployment status: <span className="capitalize">{deploymentStatus}</span>
                </p>
                {deploymentStatus === 'queued' && (
                  <p className="text-muted-foreground mt-1">Queued on Vercel. Waiting for build start...</p>
                )}
                {deploymentStatus === 'building' && (
                  <p className="text-muted-foreground mt-1">Build in progress. This page will auto-update.</p>
                )}
                {deploymentStatus === 'ready' && (
                  <p className="text-emerald-600 mt-1">Ready. Your app is live.</p>
                )}
                {deploymentStatus === 'error' && (
                  <p className="text-destructive mt-1">Deployment failed. Please retry.</p>
                )}
              </div>
            )}
            {appUrl && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm space-y-2">
                <p className="font-medium text-primary">Deployment complete</p>
                <a href={appUrl} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">
                  {appUrl}
                </a>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
