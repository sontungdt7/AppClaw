'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { useAccount, useSignMessage } from 'wagmi'

export default function AccountAssociationPage() {
  const [domain, setDomain] = useState('')
  const [step, setStep] = useState<'input' | 'signing' | 'done'>('input')
  const [challenge, setChallenge] = useState<{ message: string; nonce: string; timestamp: number } | null>(null)
  const [result, setResult] = useState<{ accountAssociation: object; manifest: object } | null>(null)
  const [error, setError] = useState('')

  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()

  async function handleGenerate() {
    setError('')
    const d = domain.trim()
    if (!d) {
      setError('Enter your app domain')
      return
    }
    setStep('signing')
    try {
      const res = await fetch(`/api/account-association/challenge?domain=${encodeURIComponent(d)}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to get challenge')
        setStep('input')
        return
      }
      setChallenge(data)

      if (!address) {
        setError('Wallet not connected')
        setStep('input')
        return
      }

      const signature = await signMessageAsync({ message: data.message })
      if (!signature) {
        setError('Signing cancelled or failed')
        setStep('input')
        return
      }

      const verifyRes = await fetch('/api/account-association/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: d,
          signature,
          nonce: data.nonce,
          timestamp: data.timestamp,
        }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok) {
        setError(verifyData.error ?? 'Verification failed')
        setStep('input')
        return
      }

      setResult(verifyData)
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('input')
    }
  }

  function handleReset() {
    setStep('input')
    setChallenge(null)
    setResult(null)
    setError('')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-xl">
        <h1 className="text-2xl font-bold mb-2">Account Association</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Generate credentials to verify your mini app domain. Host the manifest at{' '}
          <code className="bg-muted px-1 rounded">/.well-known/farcaster.json</code> or{' '}
          <code className="bg-muted px-1 rounded">/.well-known/appclaw.json</code> on your app&apos;s domain.
        </p>

        {step === 'input' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">App domain</label>
              <input
                type="text"
                placeholder="myapp.vercel.app"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <button
              type="button"
              onClick={handleGenerate}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Generate credentials
            </button>
          </div>
        )}

        {step === 'signing' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Check your wallet for the signature request...
            </p>
          </div>
        )}

        {step === 'done' && result && (
          <div className="space-y-6">
            <p className="text-sm text-primary font-medium">
              Credentials generated. Add this to your manifest:
            </p>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all font-mono">
                {JSON.stringify(result.manifest, null, 2)}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground">
              Host this file at <code className="bg-muted px-1 rounded">/.well-known/farcaster.json</code> or{' '}
              <code className="bg-muted px-1 rounded">/.well-known/appclaw.json</code> on your domain.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(result.manifest, null, 2))
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Copy JSON
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Generate another
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
