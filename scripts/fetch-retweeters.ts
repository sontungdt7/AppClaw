/**
 * Cron: Sync Twitter usernames for existing AirdropRegistrations who retweeted.
 * Does NOT create new registrations (users register by linking X in the airdrop mini app).
 *
 * Run 2–4x per day. Requires: TWITTER_BEARER_TOKEN, DATABASE_URL
 * Run: npx tsx scripts/fetch-retweeters.ts
 */
import { prisma } from '../lib/db'
import { getRetweeters } from '../lib/x-api'

const DEFAULT_CAMPAIGN_TWEET_ID = '2020402202884579469'

async function main() {
  const campaign = await prisma.campaign.findFirst({
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' },
  })
  const tweetId = campaign?.campaignTweetId ?? process.env.CAMPAIGN_TWEET_ID ?? DEFAULT_CAMPAIGN_TWEET_ID
  if (!tweetId) {
    console.error('No campaign tweet. Run POST /api/campaign/start or set CAMPAIGN_TWEET_ID')
    process.exit(1)
  }

  console.log(`Fetching retweeters of tweet ${tweetId}...`)
  const retweeters = await getRetweeters(tweetId)
  console.log(`Found ${retweeters.length} retweeters`)

  const byId = new Map(retweeters.map((u) => [u.id, u]))
  const retweeterIds = [...byId.keys()]
  const existing = await prisma.airdropRegistration.findMany({
    where: { twitterUserId: { in: retweeterIds } },
    select: { id: true, twitterUserId: true, repostedAt: true },
  })

  for (const reg of existing) {
    const u = byId.get(reg.twitterUserId)
    const updates: { twitterUsername?: string; repostedAt?: Date } = {}
    if (u?.username) {
      updates.twitterUsername = u.username
    }
    if (!reg.repostedAt) {
      updates.repostedAt = new Date()
    }
    if (Object.keys(updates).length > 0) {
      await prisma.airdropRegistration.update({
        where: { id: reg.id },
        data: updates,
      })
      if (u?.username) console.log(`  Updated @${u.username}`)
    }
  }

  console.log('Done')
}

main().catch((e) => {
  console.error(e)
  if (e instanceof Error && (e.message.includes('429') || e.message.includes('Too Many Requests'))) {
    console.error('\nRate limit still in effect. Wait 15+ minutes without using the API (no "I\'ve reposted – Check" in app, no script runs), then run this script again.')
  }
  process.exit(1)
})
