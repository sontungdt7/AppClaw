'use client'

import { useCallback, useEffect } from 'react'
import { useChainId, useWalletClient } from 'wagmi'
import { useWallet } from './wallet-context'

const APPCLAW_WALLET = 'APPCLAW_WALLET'
const APPCLAW_WALLET_GET = 'APPCLAW_WALLET_GET'
const APPCLAW_WALLET_REQUEST = 'APPCLAW_WALLET_REQUEST'
const APPCLAW_WALLET_RESPONSE = 'APPCLAW_WALLET_RESPONSE'

const ALLOWED_METHODS = new Set([
  'eth_requestAccounts',
  'eth_accounts',
  'eth_chainId',
  'eth_sendTransaction',
  'personal_sign',
  'eth_signTypedData',
  'eth_signTypedData_v4',
])

export type WalletBridgePayload = {
  address: string | null
  chainId: number
  isConnected: boolean
}

export type WalletRequestMessage = {
  type: typeof APPCLAW_WALLET_REQUEST
  id: string
  method: string
  params?: unknown[]
}

export type WalletResponseMessage = {
  type: typeof APPCLAW_WALLET_RESPONSE
  id: string
  result?: unknown
  error?: { code: number; message: string }
}

export function useWalletBridge(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  iframeOrigin: string | null,
  iframeLoaded: boolean
) {
  const { address, isConnected } = useWallet()
  const chainId = useChainId()
  const { data: walletClient } = useWalletClient()

  const sendWalletState = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow || !iframeOrigin) return
    const payload: WalletBridgePayload = {
      address,
      chainId,
      isConnected: isConnected && !!address,
    }
    iframe.contentWindow.postMessage(
      { type: APPCLAW_WALLET, payload },
      iframeOrigin
    )
  }, [address, chainId, isConnected, iframeRef, iframeOrigin])

  useEffect(() => {
    if (iframeLoaded) sendWalletState()
  }, [sendWalletState, iframeLoaded])

  useEffect(() => {
    if (!iframeOrigin) return

    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== iframeOrigin) return
      const data = event.data as WalletRequestMessage
      if (data?.type !== APPCLAW_WALLET_REQUEST || !data.id || !data.method) return
      if (!ALLOWED_METHODS.has(req.method)) {
        const target = event.source as Window | null
        target?.postMessage({
          type: APPCLAW_WALLET_RESPONSE,
          id: data.id,
          error: { code: -32601, message: `Method ${req.method} not allowed` },
        } satisfies WalletResponseMessage, iframeOrigin)
        return
      }

      const target = event.source as Window | null
      const sendResponse = (res: WalletResponseMessage) => {
        target?.postMessage(res, iframeOrigin)
      }

      try {
        if (req.method === 'eth_requestAccounts' || req.method === 'eth_accounts') {
          sendResponse({
            type: APPCLAW_WALLET_RESPONSE,
            id: req.id,
            result: address ? [address] : [],
          })
          return
        }
        if (req.method === 'eth_chainId') {
          sendResponse({
            type: APPCLAW_WALLET_RESPONSE,
            id: req.id,
            result: `0x${chainId.toString(16)}`,
          })
          return
        }

        if (!walletClient || !address) {
          sendResponse({
            type: APPCLAW_WALLET_RESPONSE,
            id: req.id,
            error: { code: 4100, message: 'Wallet not connected' },
          })
          return
        }

        const result = await walletClient.request({
          method: req.method as 'eth_sendTransaction' | 'personal_sign' | 'eth_signTypedData' | 'eth_signTypedData_v4',
          params: (req.params as unknown[]) ?? [],
        })
        sendResponse({ type: APPCLAW_WALLET_RESPONSE, id: req.id, result })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        sendResponse({
          type: APPCLAW_WALLET_RESPONSE,
          id: req.id,
          error: { code: -32603, message },
        })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [address, chainId, walletClient, iframeOrigin, iframeRef])
}
