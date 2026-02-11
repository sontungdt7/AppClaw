/**
 * Batch airdrop APPCLAW to eligible AirdropRegistrations.
 * Eligibility: (1) linked X in airdrop app, (2) reposted campaign tweet, (3) not yet airdropped.
 * First campaign capped at 1000 recipients.
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

const AIRDROP_MAX_RECIPIENTS = 1000

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

  console.log(`Airdropping ${amountPerUser} APPCLAW to ${toSend.length} addresses (cap ${AIRDROP_MAX_RECIPIENTS}, ${alreadyAirdropped} already sent)`)

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
