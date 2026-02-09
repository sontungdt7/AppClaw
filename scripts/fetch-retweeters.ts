/**
 * Cron: Fetch retweeters of campaign tweet
 * For each retweeter: ensure Privy user + wallet exists, upsert AirdropRegistration
 *
 * Requires: TWITTER_BEARER_TOKEN, PRIVY_APP_SECRET, DATABASE_URL
 * Run: npx tsx scripts/fetch-retweeters.ts
 */

import { prisma } from '../lib/db'
import {
  getPrivyUserByTwitterSubject,
  createPrivyUserWithTwitter,
  pregeneratePrivyWallet,
  getWalletAddressFromPrivyUser,
} from '../lib/privy-server'

async function getRetweeters(tweetId: string): Promise<{ id: string; username?: string }[]> {
  const token = process.env.TWITTER_BEARER_TOKEN
  if (!token) throw new Error('Missing TWITTER_BEARER_TOKEN')

  const users: { id: string; username?: string }[] = []
  let nextToken: string | undefined

  do {
    const params = new URLSearchParams({ max_results: '100' })
    if (nextToken) params.set('pagination_token', nextToken)
    if (params.get('user.fields')) params.set('user.fields', 'username')

    const res = await fetch(
      `https://api.twitter.com/2/tweets/${tweetId}/retweeted_by?${params}&user.fields=username`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) throw new Error(`Twitter API error: ${res.status} ${await res.text()}`)

    const data = (await res.json()) as {
      data?: { id: string; username?: string }[]
      meta?: { next_token?: string }
    }
    if (data.data) users.push(...data.data)
    nextToken = data.meta?.next_token
  } while (nextToken)

  return users
}

async function ensureUserAndWallet(
  twitterUserId: string,
  twitterUsername?: string
): Promise<{ walletAddress: string; privyUserId?: string }> {
  let user = await getPrivyUserByTwitterSubject(twitterUserId)
  if (!user) {
    user = await createPrivyUserWithTwitter(twitterUserId, twitterUsername)
    const pregen = await pregeneratePrivyWallet(user.id)
    if (pregen?.address) return { walletAddress: pregen.address, privyUserId: user.id }
    user = await getPrivyUserByTwitterSubject(twitterUserId)
  }
  let address = getWalletAddressFromPrivyUser(user ?? {})
  if (!address && user?.id) {
    const pregen = await pregeneratePrivyWallet(user.id)
    address = pregen?.address ?? getWalletAddressFromPrivyUser(user ?? {})
  }
  if (!address) throw new Error(`No wallet address for twitter user ${twitterUserId}`)
  return { walletAddress: address, privyUserId: user?.id }
}

async function main() {
  const campaign = await prisma.campaign.findFirst({
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' },
  })
  const tweetId = campaign?.campaignTweetId ?? process.env.CAMPAIGN_TWEET_ID
  if (!tweetId) {
    console.error('No campaign tweet. Run POST /api/campaign/start or set CAMPAIGN_TWEET_ID')
    process.exit(1)
  }

  console.log(`Fetching retweeters of tweet ${tweetId}...`)
  const retweeters = await getRetweeters(tweetId)
  console.log(`Found ${retweeters.length} retweeters`)

  for (const u of retweeters) {
    try {
      const { walletAddress, privyUserId } = await ensureUserAndWallet(u.id, u.username)
      await prisma.airdropRegistration.upsert({
        where: { twitterUserId: u.id },
        create: {
          twitterUserId: u.id,
          twitterUsername: u.username ?? null,
          privyUserId: privyUserId ?? null,
          walletAddress,
          amount: process.env.AIRDROP_AMOUNT ?? '1000',
        },
        update: { twitterUsername: u.username ?? undefined, privyUserId, walletAddress },
      })
      console.log(`  OK: ${u.username ?? u.id} -> ${walletAddress.slice(0, 10)}...`)
    } catch (e) {
      console.error(`  FAIL: ${u.id}`, e)
    }
  }

  console.log('Done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
