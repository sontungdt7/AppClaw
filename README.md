# AppClaw

App store for mini apps. **App For Human. Build By Agent.**

PWA super app with Privy (Twitter-only login) and embedded wallet on Base. Airdrop: users retweet the campaign tweet; server fetches retweeters, creates Privy users + wallets, and batch airdrops on cron.

## Setup

1. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Add `.env`:
   ```
   DATABASE_URL="file:./dev.db"
   NEXT_PUBLIC_PRIVY_APP_ID="your-privy-app-id"
   PRIVY_APP_SECRET="your-privy-app-secret"
   ```

3. Initialize database:
   ```bash
   npm run db:push
   ```

4. In [Privy Dashboard](https://dashboard.privy.io): Enable Twitter as login method; configure embedded wallets. For **Android/mobile login**, add your app URL(s) to **Allowed OAuth redirect URLs** (e.g. `https://appclaw.xyz`, `https://appclaw.xyz/`) so the X redirect flow works.

## Run

```bash
npm run dev
```

## Campaign & Airdrop (Repost flow — minimal X API cost)

1. **Start campaign**: `POST /api/campaign/start` — Posts the campaign tweet via X API, stores tweet ID. (Requires X API v2 write access.)

2. **User action**: User reposts (retweets) the campaign tweet. In-app, the Claw Airdrop mini app shows a **one-tap "Repost to claim"** button (`GET /api/campaign` provides the retweet URL). No login or PWA install required to repost.

3. **Cron – fetch retweeters**: `npx tsx scripts/fetch-retweeters.ts` — Calls X once per run (`GET /2/tweets/:id/retweeted_by`), then **only processes new retweeters** (skips already-registered users to save Privy/DB work). Run **2–4x per day** (e.g. 0:00, 6:00, 12:00, 18:00 UTC) to keep X API cost low while keeping good UX (eligibility within hours).

4. **Cron – batch airdrop**: `npx tsx scripts/batch-airdrop.ts` — Transfers APPCLAW to pending registrations.

**Minimizing X API cost (pay-per-use):** Run fetch-retweeters 2–4x per day, not every few minutes. One campaign tweet; one retweeted_by fetch per run; no search or extra user lookups.

**Env for scripts**: `TWITTER_BEARER_TOKEN`, `PRIVY_APP_SECRET`, `DATABASE_URL`, `PRIVATE_KEY`, `TOKEN_ADDRESS`, `AIRDROP_AMOUNT` (default 1000). Optional: `CAMPAIGN_TWEET_ID` (fallback if campaign start not used).

## Token

The APPCLAW token contract is built in a separate project. Set `TOKEN_ADDRESS` when running the batch-airdrop script.

## Mini App Submission (Developers)

1. Go to **Submit App** in the app grid (or `/submit`)
2. Fill in: name, description, icon URL, app URL, optional manifest URL and tags
3. Submit. Apps appear in the store automatically (no review).

## AppClaw Wallet Bridge (For 3rd Party Mini Apps)

When your app is embedded in AppClaw (`/app/view?url=...`), users get their AppClaw (Privy) wallet via a **postMessage bridge**. No re-login; the parent holds the session.

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

3. Every sign/send goes through AppClaw's confirmation UI. Mini apps cannot drain the wallet directly.

## Architecture

- **PWA**: Next.js, manifest, install prompt
- **Wallet**: Privy (Twitter-only login, embedded wallet) on Base
- **Mini apps**: Loaded in iframe; receive wallet via postMessage bridge (no re-login, secure)
