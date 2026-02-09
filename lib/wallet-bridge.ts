/**
 * postMessage bridge protocol between AppClaw parent and mini app iframe.
 * Parent validates, shows confirmation, executes via Privy.
 */

export const BRIDGE_PREFIX = 'APPCLAW_'

export type BridgeRequest =
  | { type: 'APPCLAW_GET_WALLET'; id: string }
  | { type: 'APPCLAW_SIGN_MESSAGE'; id: string; payload: { message: string } }
  | { type: 'APPCLAW_SEND_TX'; id: string; payload: { to: string; value?: string; data?: string; gasLimit?: string } }

export type BridgeResponse =
  | { type: 'APPCLAW_WALLET'; id: string; payload: { address: string } }
  | { type: 'APPCLAW_SIGN_RESULT'; id: string; payload: { signature: string } }
  | { type: 'APPCLAW_TX_RESULT'; id: string; payload: { hash: string } }
  | { type: 'APPCLAW_ERROR'; id: string; payload: { code: string; message: string } }

export function isBridgeRequest(msg: unknown): msg is BridgeRequest {
  if (!msg || typeof msg !== 'object') return false
  const m = msg as Record<string, unknown>
  return (
    typeof m.type === 'string' &&
    m.type.startsWith(BRIDGE_PREFIX) &&
    typeof m.id === 'string'
  )
}

export function sendToIframe(iframe: MessageEventSource | null, msg: BridgeResponse) {
  if (!iframe || typeof (iframe as Window).postMessage !== 'function') return
  try {
    ;(iframe as Window).postMessage(msg, '*')
  } catch {
    // ignore
  }
}
