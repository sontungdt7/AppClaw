/**
 * Cron job: Fetch tweets from X/Twitter matching campaign (#AppClaw)
 * Parse wallet addresses from tweet text (format: #AppClaw 0x...)
 * Filter to addresses in InstallEvent table (PWA install required)
 * Store in AirdropRegistration
 *
 * Requires: TWITTER_BEARER_TOKEN (X API v2)
 * Run: npx tsx scripts/fetch-tweets.ts
 */

const TWEET_FORMAT_REGEX = /#AppClaw\s+(0x[a-fA-F0-9]{40})/g
const CAMPAIGN_QUERY = '#AppClaw'

async function fetchTweets() {
  const token = process.env.TWITTER_BEARER_TOKEN
  if (!token) {
    console.error('Missing TWITTER_BEARER_TOKEN')
    process.exit(1)
  }

  const params = new URLSearchParams({
    query: CAMPAIGN_QUERY,
    max_results: '100',
    'tweet.fields': 'created_at,text',
  })

  const res = await fetch(
    `https://api.twitter.com/2/tweets/search/recent?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  if (!res.ok) {
    console.error('Twitter API error:', res.status, await res.text())
    process.exit(1)
  }

  const data = (await res.json()) as { data?: { id: string; text: string }[] }
  const tweets = data.data ?? []

  for (const tweet of tweets) {
    const matches = [...tweet.text.matchAll(TWEET_FORMAT_REGEX)]
    for (const match of matches) {
      const address = match[1].toLowerCase()
      console.log(`Found: ${address} from tweet ${tweet.id}`)
      // TODO: Check InstallEvent, insert into AirdropRegistration
    }
  }

  console.log(`Processed ${tweets.length} tweets`)
}

fetchTweets().catch((e) => {
  console.error(e)
  process.exit(1)
})
