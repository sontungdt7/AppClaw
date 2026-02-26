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
    const res = await fetch(`${UNISWAP_API}/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      let errMsg = data?.detail ?? data?.message ?? data?.error ?? 'Quote failed'
      if (Array.isArray(errMsg)) errMsg = errMsg.map((e: { msg?: string }) => e?.msg ?? JSON.stringify(e)).join('; ')
      else if (typeof errMsg !== 'string') errMsg = JSON.stringify(errMsg)
      return NextResponse.json({ error: errMsg }, { status: res.status })
    }
    return NextResponse.json(data)
  } catch (e) {
    console.error('uniswap quote error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Quote failed' },
      { status: 500 }
    )
  }
}
