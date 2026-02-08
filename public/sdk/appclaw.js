/**
 * AppClaw Mini App SDK
 * Use AppClaw's Porto wallet when your app is embedded in AppClaw.
 * Include: <script src="https://your-appclaw-domain/sdk/appclaw.js"></script>
 */
(function () {
  'use strict'

  const APPCLAW_WALLET = 'APPCLAW_WALLET'
  const APPCLAW_WALLET_GET = 'APPCLAW_WALLET_GET'
  const APPCLAW_WALLET_REQUEST = 'APPCLAW_WALLET_REQUEST'
  const APPCLAW_WALLET_RESPONSE = 'APPCLAW_WALLET_RESPONSE'

  const state = {
    address: null,
    chainId: null,
    isConnected: false,
    _listeners: [],
  }

  function updateState(payload) {
    const prev = { ...state }
    state.address = payload.address ?? null
    state.chainId = payload.chainId ?? null
    state.isConnected = payload.isConnected ?? false
    state._listeners.forEach(function (fn) {
      fn({ address: state.address, chainId: state.chainId, isConnected: state.isConnected }, prev)
    })
  }

  function isInAppClaw() {
    try {
      return window.self !== window.top
    } catch {
      return true
    }
  }

  const pending = Object.create(null)

  window.addEventListener('message', function (event) {
    if (event.data?.type !== APPCLAW_WALLET) return
    updateState(event.data.payload || {})
  })

  function requestWalletState() {
    if (isInAppClaw()) {
      window.parent.postMessage({ type: APPCLAW_WALLET_GET }, '*')
    }
  }

  function request(opts) {
    return new Promise(function (resolve, reject) {
      if (!isInAppClaw()) {
        reject(new Error('Not embedded in AppClaw'))
        return
      }
      const id = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2)
      pending[id] = { resolve, reject }
      window.parent.postMessage(
        {
          type: APPCLAW_WALLET_REQUEST,
          id,
          method: opts.method,
          params: opts.params || [],
        },
        '*'
      )
    })
  }

  window.addEventListener('message', function (event) {
    const d = event.data
    if (d?.type !== APPCLAW_WALLET_RESPONSE || !d.id) return
    const p = pending[d.id]
    if (!p) return
    delete pending[d.id]
    if (d.error) p.reject(new Error(d.error.message || 'Wallet request failed'))
    else p.resolve(d.result)
  })

  const AppClaw = {
    isInAppClaw: isInAppClaw,
    requestWalletState: requestWalletState,
    wallet: {
      get address() {
        return state.address
      },
      get chainId() {
        return state.chainId
      },
      get isConnected() {
        return state.isConnected
      },
      onStateChange: function (fn) {
        state._listeners.push(fn)
        return function () {
          const i = state._listeners.indexOf(fn)
          if (i >= 0) state._listeners.splice(i, 1)
        }
      },
      request: request,
    },
  }

  if (typeof window !== 'undefined') {
    window.AppClaw = AppClaw
  }
})()
