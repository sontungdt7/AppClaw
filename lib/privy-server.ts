const PRIVY_API = 'https://auth.privy.io/api/v1'

function getAuthHeader(): string {
  const secret = process.env.PRIVY_APP_SECRET
  if (!secret) throw new Error('Missing PRIVY_APP_SECRET')
  return `Bearer ${secret}`
}

export async function getPrivyUserByTwitterSubject(twitterSubject: string) {
  const res = await fetch(
    `${PRIVY_API}/users/twitter_subject/${encodeURIComponent(twitterSubject)}`,
    { headers: { Authorization: getAuthHeader() } }
  )
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Privy API error: ${res.status} ${await res.text()}`)
  return res.json()
}

export async function createPrivyUserWithTwitter(twitterSubject: string, twitterUsername?: string) {
  const linkedAccounts: { type: string; subject: string; username?: string }[] = [
    { type: 'twitter', subject: twitterSubject, ...(twitterUsername && { username: twitterUsername }) },
  ]
  const res = await fetch(`${PRIVY_API}/users`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ linked_accounts: linkedAccounts }),
  })
  if (!res.ok) throw new Error(`Privy create user error: ${res.status} ${await res.text()}`)
  return res.json()
}

export async function pregeneratePrivyWallet(userId: string): Promise<{ address?: string }> {
  const res = await fetch(`${PRIVY_API}/users/${userId}/wallets/pregenerate`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chain_type: 'ethereum' }),
  })
  if (!res.ok) throw new Error(`Privy pregenerate wallet error: ${res.status} ${await res.text()}`)
  return res.json()
}

export function getWalletAddressFromPrivyUser(user: {
  linked_accounts?: Array<{ type: string; address?: string }>
  wallet?: { address?: string }
}): string | null {
  const wallet = user.linked_accounts?.find((a) => a.type === 'wallet' && a.address)
  if (wallet?.address) return wallet.address
  return user.wallet?.address ?? null
}
