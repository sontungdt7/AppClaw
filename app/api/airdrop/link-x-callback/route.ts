import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

const X_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token'
const X_USER_ME = 'https://api.twitter.com/2/users/me?user.fields=username'
const PKCE_COOKIE = 'appclaw_airdrop_pkce'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/app/airdrop?error=missing_params', request.url)
    )
  }

  const wallet = decodeURIComponent(state)
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return NextResponse.redirect(
      new URL('/app/airdrop?error=invalid_state', request.url)
    )
  }

  const cookieStore = await cookies()
  const raw = cookieStore.get(PKCE_COOKIE)?.value
  cookieStore.delete(PKCE_COOKIE)
  if (!raw) {
    return NextResponse.redirect(
      new URL('/app/airdrop?error=expired', request.url)
    )
  }
  let pkce: { state: string; verifier: string }
  try {
    pkce = JSON.parse(raw) as { state: string; verifier: string }
  } catch {
    return NextResponse.redirect(
      new URL('/app/airdrop?error=invalid_cookie', request.url)
    )
  }
  if (pkce.state !== wallet) {
    return NextResponse.redirect(
      new URL('/app/airdrop?error=state_mismatch', request.url)
    )
  }

  const clientId = process.env.X_OAUTH2_CLIENT_ID
  const clientSecret = process.env.X_OAUTH2_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL('/app/airdrop?error=config', request.url)
    )
  }

  const redirectUri = `${request.nextUrl.origin}/api/airdrop/link-x-callback`
  const body = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code_verifier: pkce.verifier,
  })
  const tokenRes = await fetch(X_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: body.toString(),
  })
  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    console.error('X token error:', tokenRes.status, err)
    return NextResponse.redirect(
      new URL('/app/airdrop?error=token', request.url)
    )
  }
  const tokenData = (await tokenRes.json()) as { access_token?: string }
  const accessToken = tokenData.access_token
  if (!accessToken) {
    return NextResponse.redirect(
      new URL('/app/airdrop?error=no_token', request.url)
    )
  }

  const userRes = await fetch(X_USER_ME, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!userRes.ok) {
    return NextResponse.redirect(
      new URL('/app/airdrop?error=user', request.url)
    )
  }
  const userData = (await userRes.json()) as {
    data?: { id: string; username?: string }
  }
  const twitterUserId = userData.data?.id
  const twitterUsername = userData.data?.username ?? null
  if (!twitterUserId) {
    return NextResponse.redirect(
      new URL('/app/airdrop?error=no_user', request.url)
    )
  }

  const walletLower = wallet.toLowerCase()
  await prisma.airdropRegistration.upsert({
    where: { twitterUserId },
    create: {
      twitterUserId,
      twitterUsername,
      walletAddress: walletLower,
      amount: process.env.AIRDROP_AMOUNT ?? '1000',
    },
    update: {
      twitterUsername,
      walletAddress: walletLower,
    },
  })

  return NextResponse.redirect(new URL('/app/airdrop?linked=1', request.url))
}
