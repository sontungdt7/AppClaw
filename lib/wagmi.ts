import { createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'
import { porto } from 'wagmi/connectors'

export const config = createConfig({
  chains: [base],
  connectors: [porto()],
  ssr: true,
  transports: {
    [base.id]: http(),
  },
})
