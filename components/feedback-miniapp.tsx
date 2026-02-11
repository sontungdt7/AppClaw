'use client'

import { useState } from 'react'
import { X } from 'lucide-react'


export function FeedbackMiniApp() {
  const [contact, setContact] = useState('')
  const [feedback, setFeedback] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contact.trim() || !feedback.trim()) return
    setSending(true)
    try {
      // TODO: POST to API
      await new Promise((r) => setTimeout(r, 500))
      setSent(true)
      setContact('')
      setFeedback('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 px-4 py-4 space-y-4">
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Contact (Twitter, TG, Email, etc)"
            className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Type your feedback..."
            rows={8}
            className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none text-lg"
            style={{ fontFamily: 'var(--font-vt323), monospace' }}
          />
        </div>
        <div className="p-4">
          <button
            type="submit"
            disabled={sending || !contact.trim() || !feedback.trim()}
            className="w-full py-4 rounded-lg font-semibold uppercase tracking-wider text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--primary)',
              fontFamily: 'var(--font-geist-mono), monospace',
            }}
          >
            {sending ? 'Sending...' : sent ? 'Sent!' : 'Send Feedback'}
          </button>
        </div>
      </form>
    </div>
  )
}
