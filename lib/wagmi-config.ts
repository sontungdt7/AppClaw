import { createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { porto } from 'wagmi/connectors'
import { Dialog, Mode } from 'porto'

/** Porto popup size: fits viewport on mobile, larger on desktop. Safe default for SSR. */
function getPortoPopupSize() {
  if (typeof window === 'undefined') {
    return { width: 360, height: 560 }
  }
  const isMobile = window.innerWidth < 768
  if (isMobile) {
    return {
      width: Math.min(400, window.innerWidth - 24),
      height: Math.min(680, window.innerHeight - 80),
    }
  }
  return { width: 520, height: 640 }
}

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    porto({
      mode: Mode.dialog({
        renderer: Dialog.popup({ size: getPortoPopupSize() }),
      }) as any,
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
})
