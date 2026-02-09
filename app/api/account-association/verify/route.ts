import { NextRequest, NextResponse } from 'next/server'
import { recoverMessageAddress } from 'viem'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain, signature, nonce, timestamp } = body

    if (!domain || !signature || !nonce || !timestamp) {
      return NextResponse.json(
        { error: 'Missing domain, signature, nonce, or timestamp' },
        { status: 400 }
      )
    }

    const filtered = String(domain).trim().toLowerCase()
    if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(filtered) && filtered !== 'localhost') {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
    }

    const message = `AppClaw domain verification

Domain: ${filtered}
Timestamp: ${timestamp}
Nonce: ${nonce}

Sign this message to associate your wallet with this domain.`

    const recoveredAddress = await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`,
    })

    const header = Buffer.from(
      JSON.stringify({ type: 'appclaw', version: 1 })
    ).toString('base64url')
    const payload = Buffer.from(
      JSON.stringify({
        domain: filtered,
        address: recoveredAddress,
        timestamp: Number(timestamp),
        nonce,
      })
    ).toString('base64url')

    const accountAssociation = {
      header,
      payload,
      signature,
    }

    return NextResponse.json({
      accountAssociation,
      manifest: {
        version: '1',
        name: 'App',
        accountAssociation,
        homeUrl: `https://${filtered}`,
      },
    })
  } catch (e) {
    console.error('account-association verify error:', e)
    return NextResponse.json(
      { error: 'Invalid signature or verification failed' },
      { status: 400 }
    )
  }
}
