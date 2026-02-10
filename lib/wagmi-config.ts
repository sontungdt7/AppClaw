import { createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'
import { porto } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [porto()],
  transports: {
    [base.id]: http(),
  },
})
