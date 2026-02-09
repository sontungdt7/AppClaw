'use client'

import { createContext, useContext, type ReactNode, useState } from 'react'
import { PrivyProvider } from '@privy-io/react-auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WalletProvider, DisconnectedWalletProvider } from '@/lib/wallet-context'
import { privyConfig } from '@/lib/privy-config'

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? ''

const HasPrivyContext = createContext(false)
export function useHasPrivy() {
  return useContext(HasPrivyContext)
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <HasPrivyContext.Provider value={!!appId}>
        {appId ? (
          <PrivyProvider appId={appId} config={privyConfig}>
            <WalletProvider>{children}</WalletProvider>
          </PrivyProvider>
        ) : (
          <DisconnectedWalletProvider>{children}</DisconnectedWalletProvider>
        )}
      </HasPrivyContext.Provider>
    </QueryClientProvider>
  )
}
