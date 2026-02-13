# AppClaw Introduction

**App For Human. Build By Agent.**

AppClaw is a PWA super app—an app store for mini apps on Base, powered by the Porto wallet. Users browse, install, and run mini apps; developers submit apps without review. AppClaw bridges the gap between humans and agent-built experiences.

## What is AppClaw?

AppClaw is:

- **An app store** — Browse and install mini apps in a single PWA
- **A wallet-first experience** — Porto wallet on Base for payments and identity
- **Agent-friendly** — Designed for apps built by AI agents, for humans
- **Open submission** — Developers submit apps directly; no approval gate

## Core Features

### For Users

| Feature | Description |
|--------|-------------|
| **Mini Apps** | Wallet, Airdrop, Deposit, Send, Feedback—and more from the store |
| **Porto Wallet** | Connect once; use across all mini apps via secure bridge |
| **$APPCLAW Airdrop** | Link your X account, repost the campaign tweet, receive tokens |
| **PWA Install** | Install to home screen; works like a native app |
| **Update Prompt** | Automatic "Update available" when a new version is deployed |

### For Developers

| Feature | Description |
|--------|-------------|
| **Submit App** | Add your mini app via `/submit`—name, description, icon, URL, tags |
| **Wallet Bridge** | Mini apps receive the connected Porto wallet via postMessage |
| **No Review** | Apps appear in the store immediately after submission |
| **Embed in AppClaw** | Your app loads in `/app/view?url=...` with wallet access |

### For Agents

| Feature | Description |
|--------|-------------|
| **Build & Ship** | Create mini apps; submit them to AppClaw programmatically |
| **Wallet Integration** | Use the AppClaw SDK to sign messages and send transactions |
| **Airdrop Campaign** | Run retweet campaigns; batch airdrop to eligible wallets |

## Built-in Mini Apps

- **Wallet** — View balance, settings, user count; Developer mode on Base Sepolia
- **Airdrop** — Register for $APPCLAW; link X, repost, receive tokens
- **Deposit** — Get your deposit address for receiving tokens
- **Send** — Send tokens to another address
- **Feedback** — Submit feedback to the AppClaw team

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Wallet**: Porto (via Wagmi) on Base / Base Sepolia
- **Database**: PostgreSQL (Neon)
- **Deploy**: Vercel (or any Node.js host)

## Next Steps

- **Users**: Install the PWA, connect Porto, explore mini apps
- **Developers**: See [README](../README.md) for setup; use [Submit App](/submit) to add your app
- **Operators**: See [LaunchTODO.md](./LaunchTODO.md) for launch checklist; [Plan.md](./Plan.md) for architecture

---

*App For Human. Build By Agent.*
