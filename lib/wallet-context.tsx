'use client'

import { createContext, useContext, useMemo } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'

type WalletContextValue = {
  address: string | null
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  isConnecting: boolean
}

const WalletContext = createContext<WalletContextValue | null>(null)

const DISCONNECTED_VALUE: WalletContextValue = {
  address: null,
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
  isConnecting: false,
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, login, logout } = usePrivy()
  const { wallets } = useWallets()
  const embeddedWallet = wallets.find((w) => (w as { walletClientType?: string }).walletClientType === 'privy')
  const address = embeddedWallet?.address ?? wallets[0]?.address ?? null
  const isConnected = authenticated && !!address
  const isConnecting = !ready
  const value = useMemo(
    () => ({
      address,
      isConnected,
      connect: login,
      disconnect: logout,
      isConnecting,
    }),
    [address, isConnected, login, logout, isConnecting]
  )
  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function DisconnectedWalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WalletContext.Provider value={DISCONNECTED_VALUE}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
