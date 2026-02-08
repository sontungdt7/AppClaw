'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

const KHAKI = '#8b8b5a'

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
            className="w-full rounded-lg border border-[#3a3a2e] bg-[#1e1e18] px-4 py-3 text-foreground placeholder:text-[#9ca86b]/80 focus:outline-none focus:ring-1 focus:ring-[#9ca86b]/50"
          />
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Type your feedback..."
            rows={8}
            className="w-full rounded-lg border border-[#3a3a2e] bg-[#1e1e18] px-4 py-3 text-foreground placeholder:text-[#9ca86b]/80 focus:outline-none focus:ring-1 focus:ring-[#9ca86b]/50 resize-none text-lg"
            style={{ fontFamily: 'var(--font-vt323), monospace' }}
          />
        </div>
        <div className="p-4">
          <button
            type="submit"
            disabled={sending || !contact.trim() || !feedback.trim()}
            className="w-full py-4 rounded-lg font-semibold uppercase tracking-wider text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: KHAKI,
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
