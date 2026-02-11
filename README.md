# AppClaw

App store for mini apps. **App For Human. Build By Agent.**

PWA super app with **Porto** wallet on Base. Users connect with Porto to use the app. Airdrop: users link their X account in the airdrop mini app, repost the campaign tweet; server verifies reposts and airdrops APPCLAW to their Porto wallet (max 1,000 users in the first campaign).

## Setup

1. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
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

## Campaign & Airdrop (Porto + link X)

1. **Start campaign**: `POST /api/campaign/start` — Posts the campaign tweet via X API, stores tweet ID. (Requires X API v2 write access.)

2. **User flow**: User connects **Porto** wallet to use the app. In the **Airdrop** mini app they (1) **Link X to claim** (OAuth with X), (2) **Repost** the campaign tweet. Server verifies reposts and airdrops to their Porto wallet.

3. **Cron – fetch retweeters**: `npx tsx scripts/fetch-retweeters.ts` — Syncs Twitter usernames for existing registrations who retweeted. Run 2–4x per day. Requires: `TWITTER_BEARER_TOKEN`, `DATABASE_URL`.

4. **Cron – batch airdrop**: `npx tsx scripts/batch-airdrop.ts` — Fetches retweeters, finds registered users (linked X) who reposted and not yet airdropped, sends APPCLAW to their Porto wallet. **Capped at 1,000 recipients** for the first campaign. Requires: `TWITTER_BEARER_TOKEN`, `PRIVATE_KEY`, `TOKEN_ADDRESS`, `DATABASE_URL`.

**Airdrop link-X OAuth** (for “Link X to claim” in the airdrop mini app): Set `X_OAUTH2_CLIENT_ID` and `X_OAUTH2_CLIENT_SECRET` from the [X Developer Portal](https://developer.x.com/) (OAuth 2.0 with PKCE). Callback URL: `https://your-domain/api/airdrop/link-x-callback`.

**X (Twitter) API v2 / pay-per-use**: This app uses **X API v2** only (`/2/tweets/:id/retweeted_by`, OAuth 2.0, `/2/users/me`). The legacy free tier is deprecated; use a pay-per-use (or other) plan in the [X Developer Portal](https://developer.x.com/). To keep usage low: run **fetch-retweeters** on a cron (2–4x/day) so `repostedAt` is set in bulk; the in-app “I’ve reposted – Check” button calls the same retweeters endpoint and can hit rate limits (429) if used too often.

**Base Sepolia (testnet)**: Set `USE_BASE_SEPOLIA=true` to run airdrop on Base Sepolia instead of Base mainnet. The app supports both chains; users can switch in their wallet. Use a Base Sepolia token contract for `TOKEN_ADDRESS` when testing.

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
