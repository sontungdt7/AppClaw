import { createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { porto } from 'wagmi/connectors'
import { Dialog, Mode } from 'porto'

/** Porto dialog/popup size (default is 360×282). Use a larger popup for Login/Signup. */
const PORTO_POPUP_SIZE = { width: 400, height: 680 }

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    porto({
      mode: Mode.dialog({
        renderer: Dialog.popup({ size: PORTO_POPUP_SIZE }),
      }),
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
})
