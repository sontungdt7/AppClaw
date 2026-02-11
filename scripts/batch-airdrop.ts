/**
 * Batch airdrop to eligible AirdropRegistrations.
 * Eligibility: (1) linked X in airdrop app, (2) reposted campaign tweet, (3) not yet airdropped.
 * Capped at 300 recipients. Campaign ends after 3 days from start.
 * Run hourly via cron: fetch-retweeters.ts then batch-airdrop.ts
 *
 * Requires: TWITTER_BEARER_TOKEN, PRIVATE_KEY, TOKEN_ADDRESS, DATABASE_URL
 * Run: npx tsx scripts/batch-airdrop.ts
 */
import { createWalletClient, http, parseAbi } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { prisma } from '../lib/db'
import { getRetweeters } from '../lib/x-api'

const chain = process.env.USE_BASE_SEPOLIA === 'true' ? baseSepolia : base

const AIRDROP_MAX_RECIPIENTS = 300
const CAMPAIGN_DURATION_DAYS = 3

const ERC20_ABI = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
])

async function main() {
  const privateKey = process.env.PRIVATE_KEY
  const tokenAddress = process.env.TOKEN_ADDRESS
  const amountPerUser = process.env.AIRDROP_AMOUNT ?? '1000'

  if (!privateKey || !tokenAddress) {
    console.error('Missing PRIVATE_KEY or TOKEN_ADDRESS')
    process.exit(1)
  }

  const campaign = await prisma.campaign.findFirst({
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' },
  })
  const tweetId = campaign?.campaignTweetId ?? process.env.CAMPAIGN_TWEET_ID
  if (!tweetId) {
    console.error('No campaign tweet. Set CAMPAIGN_TWEET_ID or run POST /api/campaign/start')
    process.exit(1)
  }

  if (campaign) {
    const endAt = new Date(campaign.createdAt)
    endAt.setDate(endAt.getDate() + CAMPAIGN_DURATION_DAYS)
    if (new Date() > endAt) {
      console.log('Campaign ended (3 days passed). No more airdrops.')
      process.exit(0)
    }
  } else if (process.env.CAMPAIGN_START_DATE) {
    const start = new Date(process.env.CAMPAIGN_START_DATE)
    const endAt = new Date(start)
    endAt.setDate(endAt.getDate() + CAMPAIGN_DURATION_DAYS)
    if (new Date() > endAt) {
      console.log('Campaign ended (3 days passed). No more airdrops.')
      process.exit(0)
    }
  }

  const retweeterIds = new Set((await getRetweeters(tweetId)).map((u) => u.id))
  console.log(`${retweeterIds.size} retweeters`)

  const pending = await prisma.airdropRegistration.findMany({
    where: {
      airdroppedAt: null,
      twitterUserId: { in: [...retweeterIds] },
    },
    orderBy: { createdAt: 'asc' },
    take: AIRDROP_MAX_RECIPIENTS,
  })

  const alreadyAirdropped = await prisma.airdropRegistration.count({
    where: { airdroppedAt: { not: null } },
  })
  const capRemaining = Math.max(0, AIRDROP_MAX_RECIPIENTS - alreadyAirdropped)
  const toSend = pending.slice(0, capRemaining)

  console.log(`Airdropping ${amountPerUser} tokens to ${toSend.length} addresses (cap ${AIRDROP_MAX_RECIPIENTS}, ${alreadyAirdropped} already sent)`)

  const account = privateKeyToAccount(privateKey as `0x${string}`)
  const client = createWalletClient({
    account,
    chain,
    transport: http(),
  })
  const amountWei = BigInt(amountPerUser) * BigInt(10) ** BigInt(18)

  for (const reg of toSend) {
    try {
      const hash = await client.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [reg.walletAddress as `0x${string}`, amountWei],
      })
      console.log(`  OK: ${reg.walletAddress.slice(0, 10)}... tx ${hash}`)
      await prisma.airdropRegistration.update({
        where: { id: reg.id },
        data: { airdroppedAt: new Date(), amount: amountPerUser },
      })
    } catch (e) {
      console.error(`  FAIL: ${reg.walletAddress}`, e)
    }
  }

  console.log('Done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
