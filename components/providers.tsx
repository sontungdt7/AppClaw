'use client'

import { createContext, useContext, type ReactNode, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PortoProvider } from '@/lib/porto-context'
import { WalletProvider } from '@/lib/wallet-context'
import { wagmiConfig } from '@/lib/wagmi-config'

const HasWalletContext = createContext(true)
export function useHasWallet() {
  return useContext(HasWalletContext)
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <HasWalletContext.Provider value={true}>
          <PortoProvider>
            <WalletProvider>{children}</WalletProvider>
          </PortoProvider>
        </HasWalletContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
