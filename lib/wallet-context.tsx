'use client'

import { createContext, useContext, useMemo } from 'react'
import { useAccount, useConnect, useDisconnect, useConnectors } from 'wagmi'

type WalletContextValue = {
  address: string | null
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  isConnecting: boolean
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount()
  const connectors = useConnectors()
  const { connectAsync, isPending: isConnectPending } = useConnect()
  const { disconnect } = useDisconnect()

  const handleConnect = () => {
    const connector = connectors[0]
    if (connector) connectAsync({ connector })
  }

  const value = useMemo(
    () => ({
      address: address ?? null,
      isConnected: !!isConnected && !!address,
      connect: handleConnect,
      disconnect: () => disconnect(),
      isConnecting: isConnectPending,
    }),
    [address, isConnected, isConnectPending, disconnect, connectors, connectAsync]
  )

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
