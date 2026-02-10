import { base } from 'viem/chains'

export const privyConfig = {
  loginMethods: ['twitter' as const],
  appearance: {
    theme: 'dark' as const,
    accentColor: '#facc15' as const,
  },
  embeddedWallets: {
    ethereum: { createOnLogin: 'all-users' as const },
  },
  defaultChain: base,
  supportedChains: [base],
  // Allow OAuth in PWA/standalone and embedded browsers (e.g. Android) so X login can complete
  allowOAuthInEmbeddedBrowsers: true,
}
