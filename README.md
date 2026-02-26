# AppClaw

App store for mini apps. **App For Human. Build By Agent.**

PWA super app with **Porto** wallet on Base. Users connect with Porto to use the app. Airdrop: users link their X account; the server runs batch airdrops every hour to eligible users (linked X + reposted). Capped at 300 users; campaign ends after 3 days.

## Setup

1. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Add `.env`:
   ```
   DATABASE_URL="postgresql://..."   # Neon, local Postgres, or copy from Vercel env
   ENVIRONMENT=DEVELOPMENT
   NEXT_PUBLIC_ENVIRONMENT=DEVELOPMENT
   NEXT_PUBLIC_AIRDROP_WALLET="0x..."   # Public address of airdrop wallet (for client-side balance display)
   AIRDROP_WALLET_PRIVATE_KEY="0x..."   # Private key of that wallet (server-side, for sending 1 USDC on claim)
   UNISWAP_API_KEY="..."               # From https://developers.uniswap.org/dashboard (for Swap mini app)
   ```
   Use `ENVIRONMENT=PRODUCTION` and `NEXT_PUBLIC_ENVIRONMENT=PRODUCTION` for production (Base mainnet, no Developer mode in Wallet).

3. Initialize database:
   ```bash
   npm run db:push
   ```

## Run

```bash
npm run dev
```

## Deploy to Vercel (database required)

Vercel does **not** provide a persistent database. The app uses **Postgres** (e.g. [Neon](https://neon.tech)); set `DATABASE_URL` in Vercel to your Neon (or other Postgres) connection string. The build runs `prisma db push`, so tables are created in your Neon project on deploy. After redeploying, wallet signups are stored and the user count in the header updates.

## PWA update prompt

When you deploy a new version (e.g. to Vercel), users who have AppClaw open or installed see an **Update available** screen and can tap **Update** to reload and get the latest version. The app polls `GET /api/version` every 5 minutes and on tab focus; the version is taken from `VERCEL_GIT_COMMIT_SHA` on Vercel, or `BUILD_ID` / `NEXT_BUILD_ID` if set on other hosts.

## Swap (Uniswap on Base)

The Swap mini app lets users swap ETH and USDC on Base using the [Uniswap Trading API](https://api-docs.uniswap.org/introduction). Requires `UNISWAP_API_KEY` from the [Uniswap Developer Portal](https://developers.uniswap.org/dashboard). The API proxies quote and swap requests server-side to keep the key secure.

## USDC Airdrop (1 USDC per user, one-time)

The Airdrop mini app sends **1 USDC** from an airdrop wallet on Base to each user, **once per wallet**. Set `NEXT_PUBLIC_AIRDROP_WALLET` (public address) for client-side balance display, and `AIRDROP_WALLET_PRIVATE_KEY` (server-side) for sending on Claim. The client reads the USDC balance directly from Base via viem; no API for balance. Uses native USDC on Base mainnet (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`) or Base Sepolia testnet (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`).

## Campaign & Airdrop (Porto + link X)

1. **Start campaign**: `POST /api/campaign/start` — Posts the campaign tweet via X API, stores tweet ID. (Requires X API v2 write access.)

2. **User flow**: User connects **Porto** wallet, opens Airdrop mini app, **Links X** (OAuth). They repost the campaign tweet to be eligible. Server runs batch airdrops hourly; users see congratulations when sent.

3. **Cron – every hour**: Run (1) `npx tsx scripts/fetch-retweeters.ts` then (2) `npx tsx scripts/batch-airdrop.ts`. Fetch-retweeters syncs who reposted; batch-airdrop sends to eligible wallets (linked X + reposted, not yet airdropped). **Capped at 300 recipients**; campaign ends after 3 days from start. Requires: `TWITTER_BEARER_TOKEN`, `PRIVATE_KEY`, `TOKEN_ADDRESS`, `DATABASE_URL`.

**AIRDROP_STARTED** (optional): Set to `true` when the airdrop campaign is live; set to `false` (or omit) to show "Follow AppClawBot on X to get notification about Airdrop" after users link their X account instead of the normal "batch airdrop every hour" flow. AppClawBot: https://x.com/appclawbot

**Airdrop link-X OAuth** (for “Link X to claim” in the airdrop mini app): Set `X_OAUTH2_CLIENT_ID` and `X_OAUTH2_CLIENT_SECRET` from the [X Developer Portal](https://developer.x.com/) (OAuth 2.0 with PKCE). Callback URL: `https://your-domain/api/airdrop/link-x-callback`.

**X (Twitter) API v2 / pay-per-use**: This app uses **X API v2** only (`/2/tweets/:id/retweeted_by`, OAuth 2.0, `/2/users/me`). The legacy free tier is deprecated; use a pay-per-use (or other) plan in the [X Developer Portal](https://developer.x.com/). To keep usage low: run **fetch-retweeters** hourly before batch-airdrop to sync repost status.

**Environment**: Set `ENVIRONMENT=DEVELOPMENT` or `ENVIRONMENT=PRODUCTION` (and `NEXT_PUBLIC_ENVIRONMENT` to the same value so the Wallet UI can show/hide Developer mode).

- **DEVELOPMENT**: Airdrop and APIs use **Base Sepolia**; Wallet shows **Developer mode** (Submit mini app, Account association). Use a Base Sepolia token for `TOKEN_ADDRESS` when testing.
- **PRODUCTION**: Airdrop and APIs use **Base** mainnet; Wallet does **not** show Developer mode.

## Token

The APPCLAW token contract is built in a separate project. Set `TOKEN_ADDRESS` when running the batch-airdrop script.

## Mini App Submission (Developers)

1. Go to **Submit App** in the app grid (or `/submit`)
2. Fill in: name, description, icon URL, app URL, optional manifest URL and tags
3. Submit. Apps appear in the store automatically (no review).

## AppClaw Wallet Bridge (For 3rd Party Mini Apps)

When your app is embedded in AppClaw (`/app/view?url=...`), users get their connected **Porto** wallet via a **postMessage bridge**.

1. Include the AppClaw SDK in your mini app:
   ```html
   <script src="https://appclaw.xyz/sdk/appclaw.js"></script>
   ```

2. Use the wallet API:
   ```js
   // Get wallet address
   AppClaw.getWallet().then(addr => console.log(addr))

   // Sign a message (user confirms in parent)
   AppClaw.signMessage('Hello').then(sig => console.log(sig))

   // Send transaction (user confirms in parent)
   AppClaw.sendTransaction({ to: '0x...', value: '0', data: '0x...' }).then(hash => console.log(hash))
   ```

3. Every sign/send goes through the wallet’s confirmation. Mini apps cannot drain the wallet directly.

## Architecture

- **PWA**: Next.js, manifest, install prompt
- **Wallet**: Porto (via Wagmi) on Base
- **Airdrop**: User links X in airdrop mini app; server verifies repost and airdrops to Porto wallet (max 1,000 first campaign)
- **Mini apps**: Loaded in iframe; receive wallet via postMessage bridge (no re-login, secure)
