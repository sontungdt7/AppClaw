'use client'

import { useState } from 'react'
import { DollarSign, ChevronDown, LayoutList, Delete } from 'lucide-react'


const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'backspace'],
]

export function SendMiniApp() {
  const [amount, setAmount] = useState('0.00')

  const handleKey = (key: string) => {
    if (key === 'backspace') {
      setAmount((prev) => {
        if (prev === 'MAX') return '0.00'
        if (prev.length <= 1) return '0.00'
        const next = prev.slice(0, -1)
        return next === '' || next === '.' ? '0.00' : next
      })
    } else if (key === '.') {
      if (amount !== 'MAX' && !amount.includes('.')) setAmount((prev) => (prev === '0.00' ? '0.' : prev + '.'))
    } else {
      setAmount((prev) => {
        if (prev === 'MAX') return key
        if (prev === '0.00') return key
        const next = prev + key
        const parts = next.split('.')
        if (parts[1] && parts[1].length > 2) return prev
        return next
      })
    }
  }

  const handleMax = () => {
    setAmount('MAX')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      <div className="flex-1 flex flex-col px-3 py-3 min-h-0">
        <h2 className="font-bold text-base text-primary mb-2">Send</h2>

        <div className="rounded-lg border border-border bg-card/50 p-2.5 flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-foreground font-medium text-sm">USD</span>
          </div>
          <div className="flex items-center gap-1 flex-1 justify-end min-w-0">
            <span className="text-foreground font-mono text-sm truncate">{amount}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </div>
          <button
            type="button"
            onClick={handleMax}
            className="px-2 py-1 rounded border border-primary text-primary text-xs font-medium hover:bg-primary/10 shrink-0"
          >
            MAX
          </button>
        </div>

        <div className="flex flex-col items-center gap-1 py-3">
          <div className="size-16 rounded-lg border-2 border-primary/60 bg-primary/5 flex items-center justify-center">
            <span className="text-base font-bold text-primary">USD</span>
          </div>
          <span className="text-xs text-muted-foreground">USD</span>
        </div>

        <div className="flex items-center gap-1.5 py-1">
          <div className="rounded-full p-1 border border-border">
            <LayoutList className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="flex-1 flex items-center gap-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${i <= 2 ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            className="w-full py-2.5 rounded-lg font-semibold uppercase tracking-wider text-white/95 text-sm flex items-center justify-center"
            style={{
              backgroundColor: 'var(--primary)',
              fontFamily: 'var(--font-vt323), monospace',
            }}
          >
            Next
          </button>
        </div>
      </div>

      <div className="px-3 pb-4 pt-2 shrink-0">
        <div className="grid grid-cols-3 gap-1.5">
          {KEYPAD.flat().map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleKey(key)}
              className="aspect-square max-h-14 rounded-lg border border-primary/50 flex items-center justify-center text-primary font-mono text-base hover:bg-primary/10 transition-colors"
            >
              {key === 'backspace' ? (
                <Delete className="h-4 w-4" />
              ) : (
                key
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
