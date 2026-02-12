import { createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { porto } from 'wagmi/connectors'
import { Dialog, Mode } from 'porto'

const PORTO_POPUP_SIZE_MOBILE = { width: 360, height: 282 } // Porto default
const PORTO_POPUP_SIZE_DESKTOP = { width: 400, height: 680 }

function getPortoPopupSize() {
  if (typeof window === 'undefined') return PORTO_POPUP_SIZE_DESKTOP
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } }
  const isMobile =
    nav.userAgentData?.mobile === true ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    )
  return isMobile ? PORTO_POPUP_SIZE_MOBILE : PORTO_POPUP_SIZE_DESKTOP
}

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    porto({
      mode: Mode.dialog({
        renderer: Dialog.popup({ size: getPortoPopupSize() }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- porto types differ between project and @wagmi/connectors; runtime is compatible
      }) as any,
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
})
