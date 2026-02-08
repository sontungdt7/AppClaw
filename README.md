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

## Run

```bash
npm run dev
```

## Token

The APPCLAW token contract is built in a separate project. Set `TOKEN_ADDRESS` when running the batch-airdrop script.

## Scripts

- `scripts/fetch-tweets.ts` — Cron: fetch X tweets, parse addresses, store registrations (needs `TWITTER_BEARER_TOKEN`)
- `scripts/batch-airdrop.ts` — Cron: batch transfer to eligible addresses (needs `PRIVATE_KEY`, `TOKEN_ADDRESS`, `AIRDROP_AMOUNT`)

## Architecture

- **PWA**: Next.js, manifest, install prompt
- **Wallet**: Porto (wagmi) on Base
- **Mini apps**: Farcaster SDK-compatible; Airdrop first
- **Airdrop**: Fixed amount per user; PWA install required; tweet format `#AppClaw 0x...`
