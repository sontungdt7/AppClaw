'use client'

import {
  useConnection,
  useConnect,
  useDisconnect,
  useConnectors,
} from 'wagmi'
import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from 'react'

type WalletContextValue = {
  address: string | null
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => void
  isConnecting: boolean
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const connection = useConnection()
  const { connectAsync, isPending } = useConnect()
  const { disconnect: wagmiDisconnect } = useDisconnect()
  const connectors = useConnectors()

  const portoConnector = connectors?.find(
    (c) => c.id === 'xyz.ithaca.porto' || c.name === 'Porto'
  )

  const connect = useCallback(async () => {
    const connector = portoConnector ?? connectors?.[0]
    if (!connector) return
    try {
      await connectAsync({ connector })
    } catch {
      // User rejected
    }
  }, [connectAsync, portoConnector, connectors])

  const disconnect = useCallback(() => {
    wagmiDisconnect()
  }, [wagmiDisconnect])

  const address = connection.address ?? null
  const isConnecting = connection.status === 'connecting' || isPending

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: connection.isConnected && !!address,
        connect,
        disconnect,
        isConnecting,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
