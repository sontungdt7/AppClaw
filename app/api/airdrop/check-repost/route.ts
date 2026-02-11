import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRetweeters } from '@/lib/x-api'

const DEFAULT_CAMPAIGN_TWEET_ID = '2020402202884579469'

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes – avoid calling Twitter on every "Check" click
let retweetersCache: { tweetId: string; ids: string[]; expiresAt: number } | null = null

async function getRetweeterIdsCached(tweetId: string): Promise<string[]> {
  const now = Date.now()
  if (retweetersCache && retweetersCache.tweetId === tweetId && retweetersCache.expiresAt > now) {
    return retweetersCache.ids
  }
  const retweeters = await getRetweeters(tweetId)
  const ids = [...new Set(retweeters.map((u) => u.id))]
  retweetersCache = { tweetId, ids, expiresAt: now + CACHE_TTL_MS }
  return ids
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const wallet = (body.wallet as string)?.trim()
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return NextResponse.json({ error: 'Invalid wallet' }, { status: 400 })
  }
  const walletLower = wallet.toLowerCase()

  try {
    const reg = await prisma.airdropRegistration.findFirst({
      where: { walletAddress: walletLower },
    })
    if (!reg) {
      return NextResponse.json({ hasReposted: false })
    }

    const campaign = await prisma.campaign.findFirst({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    })
    const tweetId = campaign?.campaignTweetId ?? process.env.CAMPAIGN_TWEET_ID ?? DEFAULT_CAMPAIGN_TWEET_ID

    const retweeterIds = await getRetweeterIdsCached(tweetId)

    await prisma.airdropRegistration.updateMany({
      where: { twitterUserId: { in: retweeterIds } },
      data: { repostedAt: new Date() },
    })

    const updated = await prisma.airdropRegistration.findFirst({
      where: { walletAddress: walletLower },
      select: { repostedAt: true },
    })
    return NextResponse.json({ hasReposted: !!updated?.repostedAt })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Check failed'
    console.error('check-repost error:', e)
    if (message.includes('429') || message.includes('Too Many Requests')) {
      const existing = await prisma.airdropRegistration.findFirst({
        where: { walletAddress: walletLower },
        select: { repostedAt: true },
      })
      if (existing?.repostedAt) {
        return NextResponse.json({ hasReposted: true })
      }
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a few minutes.', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
