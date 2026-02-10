import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/campaign — Returns the active campaign so the frontend can show
 * a one-tap retweet link (minimizes friction, no extra X API cost).
 */
export async function GET() {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    })
    if (!campaign) {
      return NextResponse.json({ campaignTweetId: null, retweetUrl: null })
    }
    const retweetUrl = `https://twitter.com/intent/retweet?tweet_id=${campaign.campaignTweetId}`
    return NextResponse.json({
      campaignTweetId: campaign.campaignTweetId,
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
