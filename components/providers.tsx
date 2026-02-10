'use client'

import { createContext, useContext, type ReactNode, useMemo, useState } from 'react'
import { PrivyProvider } from '@privy-io/react-auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WalletProvider, DisconnectedWalletProvider } from '@/lib/wallet-context'
import { privyConfig } from '@/lib/privy-config'

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? ''

const HasPrivyContext = createContext(false)
export function useHasPrivy() {
  return useContext(HasPrivyContext)
}

function getPrivyConfig() {
  const base = { ...privyConfig }
  if (typeof window !== 'undefined') {
    ;(base as Record<string, unknown>).customOAuthRedirectUrl = `${window.location.origin}/`
  }
  return base
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const privyConfigWithRedirect = useMemo(() => getPrivyConfig(), [])

  return (
    <QueryClientProvider client={queryClient}>
      <HasPrivyContext.Provider value={!!appId}>
        {appId ? (
          <PrivyProvider appId={appId} config={privyConfigWithRedirect}>
            <WalletProvider>{children}</WalletProvider>
          </PrivyProvider>
        ) : (
          <DisconnectedWalletProvider>{children}</DisconnectedWalletProvider>
        )}
      </HasPrivyContext.Provider>
    </QueryClientProvider>
  )
}
