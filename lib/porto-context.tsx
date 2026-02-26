'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { Porto } from 'porto'
import { getPortoInstance } from './porto-instance'

type PortoInstance = ReturnType<typeof Porto.create>
const PortoContext = createContext<PortoInstance | null>(null)

export function PortoProvider({ children }: { children: ReactNode }) {
  const [porto, setPorto] = useState<PortoInstance | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        setPorto(getPortoInstance())
      } catch {
        // Porto requires browser; skip during SSR
      }
    }
  }, [])

  return (
    <PortoContext.Provider value={porto}>{children}</PortoContext.Provider>
  )
}

export function usePorto(): PortoInstance | null {
  return useContext(PortoContext)
}
