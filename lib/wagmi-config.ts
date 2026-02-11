import { createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { porto } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [porto()],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
})
