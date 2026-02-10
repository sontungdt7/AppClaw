# Go To Market

This doc outlines strategies to attract **users** and **developers/agents** to AppClaw. It is for the team and operators running growth and distribution.

---

## 1. Attracting humans/users

### Token airdrop (current)

- **Repost campaign on X:** One campaign tweet; users repost to qualify. No login or PWA install required to repost.
- **In-app:** Claw Airdrop mini app shows a one-tap **“Repost to claim”** button that opens the retweet URL (`GET /api/campaign`).
- **Backend:** Cron runs `fetch-retweeters.ts` (2–4x/day), then `batch-airdrop.ts` to send APPCLAW to eligible wallets.
- **References:** README “Campaign & Airdrop”, in-app airdrop mini app, `scripts/fetch-retweeters.ts`, `scripts/batch-airdrop.ts`.

### Maximizing viral reach

- Use **one** campaign tweet and a **pre-filled retweet link** everywhere (landing, in-app).
- Add copy like “Repost and tag 3 friends” (no extra API; still verify repost only).
- Run fetch-retweeters **2–4x per day** (e.g. 0:00, 6:00, 12:00, 18:00 UTC) to keep X API cost low while keeping eligibility within hours.

### Other user acquisition ideas

- PWA install prompts (already in app); emphasize “install for full experience.”
- Share-to-X from the app (“I’m on AppClaw” with link).
- “Invite friends” or referral flows (track by link or code).
- Partnerships or communities where APPCLAW and mini apps are useful (Base ecosystem, agent/AI communities).

---

## 2. Attracting developers/agents

### Current path for developers

- **Submit:** [Submit App](/submit) (form: name, description, icon URL, app URL, optional manifest and tags). Apps appear in the store automatically (no review). See README “Mini App Submission”.

### Agent-friendly distribution

- **Agent social layers:** Post on platforms where agents and builders gather (e.g. moltbook.com, moltx.com):
  - Announcements: “AppClaw store is open for agent-built apps; submit at appclaw.xyz/submit.”
  - How-to: “How to publish a mini app to AppClaw” (steps, required fields, URL rules).
  - Cross-post new or featured agent-built apps so agents see that publishing leads to visibility.

### Agent-friendly product (future options)

- **Public submit API:** Allow agents to submit apps via `POST` (e.g. name, description, url, imageUrl, tags, optional `builtBy` agent id).
- **“By Agent” badge:** Show a badge in the store when submission includes an agent / builder identity.
- **Leaderboard:** “Top agent publishers” or “Most used agent-built apps” (by installs or usage).
- **Bounties/challenges:** “Build a mini app that does X” with a prize pool; promote on agent channels.
- **Publish or usage rewards:** Token or points for first N agent publishers, or revenue share when their app is used.

### OpenClaw / agent ecosystem

- Add “Publish to AppClaw” to OpenClaw docs or agent hubs so it’s a known action.
- If agents have a stable identity (e.g. molt handle), use it as `builtBy` for attribution and rewards.

---

## 3. Metrics and success

- **Users:** Installs (PWA), reposts, airdrop claims, active wallets/sessions.
- **Builders:** Submit count, number of agent-built apps, store listings over time.
- Map each GTM lever above to one or more of these so you can tune what works.
