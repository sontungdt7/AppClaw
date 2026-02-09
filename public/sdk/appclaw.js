/**
 * AppClaw SDK for mini apps embedded in iframe.
 * Use when your app is loaded inside AppClaw's /app/view?url=...
 *
 * Usage:
 *   <script src="https://appclaw.xyz/sdk/appclaw.js"></script>
 *   <script>
 *     AppClaw.getWallet().then(addr => console.log(addr))
 *     AppClaw.signMessage('Hello').then(sig => console.log(sig))
 *     AppClaw.sendTransaction({ to: '0x...', value: '0' }).then(hash => console.log(hash))
 *   </script>
 */
(function () {
  'use strict'

  const PREFIX = 'APPCLAW_'

  function genId() {
    return 'req_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
  }

  function post(msg) {
    if (window.parent === window) {
      return Promise.reject(new Error('AppClaw SDK: not embedded in AppClaw'))
    }
    return new Promise((resolve, reject) => {
      const id = genId()
      const handler = (e) => {
        if (!e.data || e.data.id !== id || !e.data.type?.startsWith(PREFIX)) return
        window.removeEventListener('message', handler)
        if (e.data.type === 'APPCLAW_ERROR') {
          reject(new Error(e.data.payload?.message || 'Unknown error'))
        } else {
          resolve(e.data.payload)
        }
      }
      window.addEventListener('message', handler)
      window.parent.postMessage({ ...msg, id }, '*')
      setTimeout(() => {
        window.removeEventListener('message', handler)
        reject(new Error('AppClaw SDK: timeout'))
      }, 60000)
    })
  }

  window.AppClaw = {
    getWallet: () =>
      post({ type: 'APPCLAW_GET_WALLET' }).then((p) => p.address),

    signMessage: (message) =>
      post({ type: 'APPCLAW_SIGN_MESSAGE', payload: { message } }).then(
        (p) => p.signature
      ),

    sendTransaction: (params) =>
      post({
        type: 'APPCLAW_SEND_TX',
        payload: {
          to: params.to,
          value: params.value ?? '0x0',
          data: params.data,
          gasLimit: params.gasLimit,
        },
      }).then((p) => p.hash),
  }
})()
