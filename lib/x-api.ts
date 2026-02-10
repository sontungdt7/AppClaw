/**
 * X/Twitter API helpers. Used by fetch-retweeters and batch-airdrop.
 */
export async function getRetweeters(tweetId: string): Promise<{ id: string; username?: string }[]> {
  const token = process.env.TWITTER_BEARER_TOKEN
  if (!token) throw new Error('Missing TWITTER_BEARER_TOKEN')

  const users: { id: string; username?: string }[] = []
  let nextToken: string | undefined

  do {
    const params = new URLSearchParams({ max_results: '100' })
    if (nextToken) params.set('pagination_token', nextToken)
    const res = await fetch(
      `https://api.twitter.com/2/tweets/${tweetId}/retweeted_by?${params}&user.fields=username`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) throw new Error(`Twitter API error: ${res.status} ${await res.text()}`)
    const data = (await res.json()) as {
      data?: { id: string; username?: string }[]
      meta?: { next_token?: string }
    }
    if (data.data) users.push(...data.data)
    nextToken = data.meta?.next_token
  } while (nextToken)

  return users
}
