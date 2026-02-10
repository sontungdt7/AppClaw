import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const X_AUTH_URL = 'https://twitter.com/i/oauth2/authorize'
const PKCE_COOKIE = 'appclaw_airdrop_pkce'
const PKCE_MAX_AGE = 600 // 10 min

function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet')
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return NextResponse.json({ error: 'Invalid wallet' }, { status: 400 })
  }

  const clientId = process.env.X_OAUTH2_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'X OAuth not configured' }, { status: 500 })
  }

  const verifier = base64UrlEncode(crypto.randomBytes(32))
  const challenge = base64UrlEncode(
    crypto.createHash('sha256').update(verifier).digest()
  )
  const state = encodeURIComponent(wallet)

  const redirectUri = `${request.nextUrl.origin}/api/airdrop/link-x-callback`
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'tweet.read users.read',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  const cookieStore = await cookies()
  cookieStore.set(PKCE_COOKIE, JSON.stringify({ state: wallet, verifier }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: PKCE_MAX_AGE,
    path: '/',
  })

  return NextResponse.redirect(`${X_AUTH_URL}?${params.toString()}`)
}
