import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const CAMPAIGN_TWEET_TEXT = 'I am claiming my airdrop on appclaw.xyz. Retweet to claim yours.'

async function postTweet(text: string): Promise<{ data?: { id: string } }> {
  const token = process.env.TWITTER_BEARER_TOKEN
  if (!token) throw new Error('Missing TWITTER_BEARER_TOKEN')

  const res = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error(`Twitter API error: ${res.status} ${await res.text()}`)
  return res.json()
}

export async function POST() {
  try {
    const { data } = await postTweet(CAMPAIGN_TWEET_TEXT)
    const tweetId = data?.id
    if (!tweetId) throw new Error('No tweet ID returned')

    await prisma.campaign.upsert({
      where: { campaignTweetId: tweetId },
      create: { campaignTweetId: tweetId, status: 'active' },
      update: { status: 'active' },
    })

    return NextResponse.json({ ok: true, campaignTweetId: tweetId })
  } catch (e) {
    console.error('campaign/start error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to start campaign' },
      { status: 500 }
    )
  }
}
