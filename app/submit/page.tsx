'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/header'

export default function SubmitPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [url, setUrl] = useState('')
  const [manifestUrl, setManifestUrl] = useState('')
  const [tags, setTags] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !description.trim() || !imageUrl.trim() || !url.trim()) return
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/miniapps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          imageUrl: imageUrl.trim(),
          url: url.trim(),
          manifestUrl: manifestUrl.trim() || undefined,
          tags: tags.trim() ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? `HTTP ${res.status}`)
        return
      }
      setStatus('success')
      setMessage(data.message ?? 'Mini app submitted.')
      setName('')
      setDescription('')
      setImageUrl('')
      setUrl('')
      setManifestUrl('')
      setTags('')
    } catch (err) {
      setStatus('error')
      setMessage(String(err))
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8 min-w-0 overflow-x-hidden">
        <div className="mx-auto max-w-xl">
          <h1 className="mb-2 text-2xl font-bold">Submit your Mini App</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Add your app to the AppClaw App Store. It will appear automatically. When embedded in AppClaw, include the AppClaw SDK to let users interact with their wallet. See the README for setup.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">App name *</label>
              <input
                type="text"
                placeholder="My App"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={64}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary"
                disabled={status === 'loading'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Description *</label>
              <textarea
                placeholder="What does your app do?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={256}
                rows={2}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary resize-none"
                disabled={status === 'loading'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Icon URL *</label>
              <input
                type="url"
                placeholder="https://myapp.com/icon.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary"
                disabled={status === 'loading'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">App URL *</label>
              <input
                type="text"
                placeholder="https://myapp.com or /app/my-app"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary"
                disabled={status === 'loading'}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Full URL to your mini app, or a path like /app/my-app for built-in apps.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Manifest URL (optional)</label>
              <input
                type="url"
                placeholder="https://myapp.com/.well-known/farcaster.json"
                value={manifestUrl}
                onChange={(e) => setManifestUrl(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary"
                disabled={status === 'loading'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Tags (optional)</label>
              <input
                type="text"
                placeholder="For Human. By Agent."
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary"
                disabled={status === 'loading'}
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading' || !name.trim() || !description.trim() || !imageUrl.trim() || !url.trim()}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {status === 'loading' ? 'Submitting...' : 'Submit'}
            </button>
          </form>

          {message && (
            <div
              className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
                status === 'error'
                  ? 'border-rose-500/50 bg-rose-500/10 text-rose-400'
                  : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
              }`}
            >
              <div className="flex flex-col gap-3">
                <span>{message}</span>
                {status === 'success' && (
                  <Link
                    href="/"
                    className="inline-flex w-fit rounded-md border border-primary bg-primary/20 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/30"
                  >
                    Back to App Store
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
