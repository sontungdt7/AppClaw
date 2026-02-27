import { createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { porto } from 'wagmi/connectors'
import { Dialog, Mode } from 'porto'

const baseRpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL
const baseSepoliaRpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL

// Base mainnet first; include Base Sepolia so we can switch from it if needed
export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    porto({
      mode: Mode.dialog({
        renderer: Dialog.iframe(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- porto types differ between project and @wagmi/connectors; runtime is compatible
      }) as any,
    }),
  ],
  transports: {
    [base.id]: http(baseRpcUrl),
    [baseSepolia.id]: http(baseSepoliaRpcUrl),
  },
})
