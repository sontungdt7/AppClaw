'use client'

import { Porto } from 'porto'
import { Dialog, Mode } from 'porto'
import { base, baseSepolia } from 'wagmi/chains'
import { http } from 'viem'

let portoInstance: Porto | null = null

/**
 * Creates and returns a Porto instance directly (not via wagmi connector).
 * Lazily initialized on first call; safe to call from browser only.
 */
export function getPortoInstance(): Porto {
  if (portoInstance) return portoInstance

  if (typeof window === 'undefined') {
    throw new Error('Porto instance can only be created in the browser')
  }

  portoInstance = Porto.create({
    chains: [base, baseSepolia],
    transports: {
      [base.id]: http(),
      [baseSepolia.id]: http(),
    },
    mode: Mode.dialog({
      renderer: Dialog.iframe(),
    }),
    announceProvider: false,
  })

  return portoInstance
}
