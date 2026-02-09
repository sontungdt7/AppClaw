'use client'

import { useEffect, useCallback } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useSignMessage, useSendTransaction } from '@privy-io/react-auth'
import { base } from 'viem/chains'
import { isBridgeRequest, sendToIframe, type BridgeRequest } from '@/lib/wallet-bridge'
import { useHasPrivy } from '@/components/providers'

type WalletBridgeProviderProps = {
  iframeRef: React.RefObject<HTMLIFrameElement | null>
  children: React.ReactNode
}

export function WalletBridgeProvider({ iframeRef, children }: WalletBridgeProviderProps) {
  const hasPrivy = useHasPrivy()
  if (!hasPrivy) return <>{children}</>
  return <WalletBridgeProviderInner iframeRef={iframeRef}>{children}</WalletBridgeProviderInner>
}

function WalletBridgeProviderInner({ iframeRef, children }: WalletBridgeProviderProps) {
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()
  const { signMessage } = useSignMessage()
  const { sendTransaction } = useSendTransaction()
  const embeddedWallet = wallets.find(
    (w) => (w as { walletClientType?: string }).walletClientType === 'privy'
  )
  const address = embeddedWallet?.address ?? wallets[0]?.address ?? null

  const handleRequest = useCallback(
    async (req: BridgeRequest, source: MessageEventSource) => {
      if (!authenticated || !address) {
        sendToIframe(source, {
          type: 'APPCLAW_ERROR',
          id: req.id,
          payload: { code: 'DISCONNECTED', message: 'Wallet not connected' },
        })
        return
      }

      try {
        switch (req.type) {
          case 'APPCLAW_GET_WALLET':
            sendToIframe(source, {
              type: 'APPCLAW_WALLET',
              id: req.id,
              payload: { address },
            })
            break

          case 'APPCLAW_SIGN_MESSAGE': {
            const { message } = req.payload
            if (!message || typeof message !== 'string') {
              sendToIframe(source, {
                type: 'APPCLAW_ERROR',
                id: req.id,
                payload: { code: 'INVALID_PARAMS', message: 'Invalid message' },
              })
              return
            }
            const { signature } = await signMessage({ message }, { address })
            sendToIframe(source, {
              type: 'APPCLAW_SIGN_RESULT',
              id: req.id,
              payload: { signature },
            })
            break
          }

          case 'APPCLAW_SEND_TX': {
            const { to, value = '0x0', data, gasLimit } = req.payload
            if (!to || typeof to !== 'string') {
              sendToIframe(source, {
                type: 'APPCLAW_ERROR',
                id: req.id,
                payload: { code: 'INVALID_PARAMS', message: 'Invalid to address' },
              })
              return
            }
            const tx: Parameters<typeof sendTransaction>[0] = {
              to: to as `0x${string}`,
              value: BigInt(value),
              chainId: base.id,
            }
            if (data) tx.data = data as `0x${string}`
            if (gasLimit) tx.gasLimit = BigInt(gasLimit)
            const { hash } = await sendTransaction(tx, { address })
            sendToIframe(source, {
              type: 'APPCLAW_TX_RESULT',
              id: req.id,
              payload: { hash },
            })
            break
          }

          default:
            sendToIframe(source, {
              type: 'APPCLAW_ERROR',
              id: (req as BridgeRequest).id,
              payload: { code: 'UNKNOWN', message: 'Unknown request type' },
            })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        sendToIframe(source, {
          type: 'APPCLAW_ERROR',
          id: req.id,
          payload: { code: 'EXECUTION_ERROR', message },
        })
      }
    },
    [authenticated, address, signMessage, sendTransaction]
  )

  useEffect(() => {
    const listener = (e: MessageEvent) => {
      if (!isBridgeRequest(e.data)) return
      const iframe = iframeRef.current?.contentWindow
      if (!iframe || e.source !== iframe) return
      handleRequest(e.data as BridgeRequest, e.source!)
    }
    window.addEventListener('message', listener)
    return () => window.removeEventListener('message', listener)
  }, [iframeRef, handleRequest])

  return <>{children}</>
}
