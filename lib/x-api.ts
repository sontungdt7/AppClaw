// Twitter v2 rate limit is usually per 15-minute window; 1 min is not enough
const DEFAULT_RATE_LIMIT_WAIT_MS = 15 * 60 * 1000 // 15 minutes
const MAX_RETRIES = 2 // retry up to 2 times (3 attempts total)

function getRateLimitWaitMs(): number {
  const sec = process.env.TWITTER_RATE_LIMIT_WAIT_SECONDS
  if (sec != null && /^\d+$/.test(sec)) return parseInt(sec, 10) * 1000
  return DEFAULT_RATE_LIMIT_WAIT_MS
}

/**
 * X/Twitter API helpers. Used by fetch-retweeters and batch-airdrop.
 * Retries on 429 after waiting 15 minutes (or TWITTER_RATE_LIMIT_WAIT_SECONDS).
 */
export async function getRetweeters(tweetId: string): Promise<{ id: string; username?: string }[]> {
  const token = process.env.TWITTER_BEARER_TOKEN
  if (!token) throw new Error('Missing TWITTER_BEARER_TOKEN')

  const rateLimitWaitMs = getRateLimitWaitMs()
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const waitMin = Math.ceil(rateLimitWaitMs / 60000)
      console.error(`Rate limited (429). Waiting ${waitMin} min before retry ${attempt}/${MAX_RETRIES}...`)
      await new Promise((r) => setTimeout(r, rateLimitWaitMs))
    }
    lastError = null
    const users: { id: string; username?: string }[] = []
    let nextToken: string | undefined
    try {
      do {
        const params = new URLSearchParams({ max_results: '100' })
        if (nextToken) params.set('pagination_token', nextToken)
        const res = await fetch(
          `https://api.twitter.com/2/tweets/${tweetId}/retweeted_by?${params}&user.fields=username`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const text = await res.text()
        if (!res.ok) {
          lastError = new Error(`Twitter API error: ${res.status} ${text}`)
          if (res.status === 429 && attempt < MAX_RETRIES) break
          throw lastError
        }
        const data = JSON.parse(text) as {
          data?: { id: string; username?: string }[]
          meta?: { next_token?: string }
        }
        if (data.data) users.push(...data.data)
        nextToken = data.meta?.next_token
      } while (nextToken)
      if (!lastError) return users
    } catch (e) {
      if (e instanceof Error && e.message.includes('429') && attempt < MAX_RETRIES) {
        lastError = e
        continue
      }
      throw e
    }
    if (lastError && attempt < MAX_RETRIES) continue
    if (lastError) throw lastError
  }
  throw lastError ?? new Error('Failed to fetch retweeters')
}
