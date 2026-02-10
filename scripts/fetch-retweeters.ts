/**
 * Cron: Sync Twitter usernames for existing AirdropRegistrations who retweeted.
 * Does NOT create new registrations (users register by linking X in the airdrop mini app).
 *
 * Run 2–4x per day. Requires: TWITTER_BEARER_TOKEN, DATABASE_URL
 * Run: npx tsx scripts/fetch-retweeters.ts
 */
import { prisma } from '../lib/db'
import { getRetweeters } from '../lib/x-api'

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

  const byId = new Map(retweeters.map((u) => [u.id, u]))
  const existing = await prisma.airdropRegistration.findMany({
    where: { twitterUserId: { in: [...byId.keys()] } },
    select: { id: true, twitterUserId: true },
  })

  for (const reg of existing) {
    const u = byId.get(reg.twitterUserId)
    if (!u?.username) continue
    await prisma.airdropRegistration.update({
      where: { id: reg.id },
      data: { twitterUsername: u.username },
    })
    console.log(`  Updated @${u.username}`)
  }

  console.log('Done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
