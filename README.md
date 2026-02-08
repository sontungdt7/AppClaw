# AppClaw

App store for mini apps. **App For Human. Build By Agent.**

PWA super app with Porto wallet on Base. Airdrop mini app is first—users register by installing PWA, connecting wallet, and tweeting to X in the required format. Backend auto-fetches registrations and batch airdrops on cron.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Add `.env`:
   ```
   DATABASE_URL="file:./dev.db"
   ```

3. Initialize database:
   ```bash
   npm run db:push
   ```

4. If mini app submission fails (500/503), regenerate Prisma client:
   ```bash
   npx prisma generate && npx prisma db push
   ```
   Then restart the dev server.

## Run

```bash
npm run dev
```

## Token

The APPCLAW token contract is built in a separate project. Set `TOKEN_ADDRESS` when running the batch-airdrop script.

## Scripts

- `scripts/fetch-tweets.ts` — Cron: fetch X tweets, parse addresses, store registrations (needs `TWITTER_BEARER_TOKEN`)
- `scripts/batch-airdrop.ts` — Cron: batch transfer to eligible addresses (needs `PRIVATE_KEY`, `TOKEN_ADDRESS`, `AIRDROP_AMOUNT`)

## Mini App Submission (Developers)

1. Go to **Submit App** in the app grid (or `/submit`)
2. Fill in: name, description, icon URL, app URL, optional manifest URL and tags
3. Submit. Apps appear in the store automatically (no review).
4. **Verify a submission**: `POST /api/miniapps/[id]/verify` with `{ "secret": "YOUR_ADMIN_SECRET" }`. Set `ADMIN_SECRET` in `.env`.

## AppClaw Wallet SDK (For 3rd Party Mini Apps)

When your app is embedded in AppClaw, it receives the user's Porto wallet automatically—no connect button needed.

### Include the SDK

```html
<script src="https://your-appclaw-domain/sdk/appclaw.js"></script>
```

### API

```javascript
// Check if running inside AppClaw
if (AppClaw.isInAppClaw()) {
  // Use shared Porto wallet
  const address = AppClaw.wallet.address
  const chainId = AppClaw.wallet.chainId
  const isConnected = AppClaw.wallet.isConnected

  // React to wallet changes
  AppClaw.wallet.onStateChange((state) => {
    console.log('Wallet:', state.address, state.chainId)
  })

  // Request accounts (EIP-1193 style)
  const accounts = await AppClaw.wallet.request({ method: 'eth_requestAccounts', params: [] })

  // Send transaction
  const hash = await AppClaw.wallet.request({
    method: 'eth_sendTransaction',
    params: [{ to: '0x...', value: '0x...', data: '0x' }]
  })

  // Sign message
  const sig = await AppClaw.wallet.request({
    method: 'personal_sign',
    params: [message, address]
  })
}
```

### Supported methods

- `eth_requestAccounts`, `eth_accounts`, `eth_chainId`
- `eth_sendTransaction`, `personal_sign`, `eth_signTypedData`, `eth_signTypedData_v4`

### Fallback

When not embedded in AppClaw, `AppClaw.isInAppClaw()` returns false. Use your own wallet connection (e.g. wagmi, RainbowKit) in that case.

## Architecture

- **PWA**: Next.js, manifest, install prompt
- **Wallet**: Porto (wagmi) on Base
- **Mini apps**: Farcaster SDK-compatible; Airdrop first
- **Airdrop**: Fixed amount per user; PWA install required; tweet format `#AppClaw 0x...`
