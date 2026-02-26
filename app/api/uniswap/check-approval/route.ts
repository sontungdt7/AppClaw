import { NextRequest, NextResponse } from 'next/server'

const UNISWAP_API = 'https://trade-api.gateway.uniswap.org/v1'

export async function POST(request: NextRequest) {
  const apiKey = process.env.UNISWAP_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Uniswap API not configured (UNISWAP_API_KEY)' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const res = await fetch(`${UNISWAP_API}/check_approval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.detail ?? data?.message ?? 'Check approval failed' },
        { status: res.status }
      )
    }
    return NextResponse.json(data)
  } catch (e) {
    console.error('uniswap check-approval error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Check approval failed' },
      { status: 500 }
    )
  }
}
