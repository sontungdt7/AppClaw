import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get('domain')
  if (!domain || typeof domain !== 'string') {
    return NextResponse.json({ error: 'Missing domain' }, { status: 400 })
  }

  const filtered = domain.trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(filtered) && filtered !== 'localhost') {
    return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
  }

  const nonce = randomBytes(16).toString('hex')
  const timestamp = Date.now()
  const message = `AppClaw domain verification

Domain: ${filtered}
Timestamp: ${timestamp}
Nonce: ${nonce}

Sign this message to associate your wallet with this domain.`

  return NextResponse.json({
    message,
    nonce,
    timestamp,
  })
}
