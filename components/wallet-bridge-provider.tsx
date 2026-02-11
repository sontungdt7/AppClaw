'use client'

import { useCallback, useEffect } from 'react'
import { useAccount, useChainId, useSignMessage, useSendTransaction } from 'wagmi'
import { isBridgeRequest, sendToIframe, type BridgeRequest } from '@/lib/wallet-bridge'

type WalletBridgeProviderProps = {
  iframeRef: React.RefObject<HTMLIFrameElement | null>
  children: React.ReactNode
}

export function WalletBridgeProvider({ iframeRef, children }: WalletBridgeProviderProps) {
  return <WalletBridgeProviderInner iframeRef={iframeRef}>{children}</WalletBridgeProviderInner>
}

function WalletBridgeProviderInner({ iframeRef, children }: WalletBridgeProviderProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { signMessageAsync } = useSignMessage()
  const { sendTransactionAsync } = useSendTransaction()

  const handleRequest = useCallback(
    async (req: BridgeRequest, source: MessageEventSource) => {
      if (!isConnected || !address) {
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
            const signature = await signMessageAsync({ message })
            sendToIframe(source, {
              type: 'APPCLAW_SIGN_RESULT',
              id: req.id,
              payload: { signature: signature ?? '' },
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
            const hash = await sendTransactionAsync({
              to: to as `0x${string}`,
              value: BigInt(value),
              chainId,
              ...(data && { data: data as `0x${string}` }),
              ...(gasLimit && { gas: BigInt(gasLimit) }),
            })
            sendToIframe(source, {
              type: 'APPCLAW_TX_RESULT',
              id: req.id,
              payload: { hash: hash ?? '' },
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
    [isConnected, address, chainId, signMessageAsync, sendTransactionAsync]
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
