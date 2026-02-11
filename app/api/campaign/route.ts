import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/campaign — Returns the active campaign so the frontend can show
 * a one-tap retweet link (minimizes friction, no extra X API cost).
 */
const DEFAULT_CAMPAIGN_TWEET_ID = '2020402202884579469'

export async function GET() {
  try {
    let campaignTweetId: string | null = null
    const campaign = await prisma.campaign.findFirst({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    })
    if (campaign) {
      campaignTweetId = campaign.campaignTweetId
    } else {
      campaignTweetId = process.env.CAMPAIGN_TWEET_ID ?? DEFAULT_CAMPAIGN_TWEET_ID
    }
    if (!campaignTweetId) {
      return NextResponse.json({ campaignTweetId: null, retweetUrl: null })
    }
    const retweetUrl = `https://twitter.com/intent/retweet?tweet_id=${campaignTweetId}`
    return NextResponse.json({
      campaignTweetId,
      retweetUrl,
    })
  } catch (e) {
    console.error('GET /api/campaign error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to get campaign' },
      { status: 500 }
    )
  }
}
