import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const address = body?.address as string | undefined

    if (!address || typeof address !== 'string') {
      return NextResponse.json({ error: 'Missing address' }, { status: 400 })
    }

    // Validate Base address format (0x + 40 hex chars)
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid address format' }, { status: 400 })
    }

    await prisma.installEvent.upsert({
      where: { address: address.toLowerCase() },
      create: {
        address: address.toLowerCase(),
        userAgent: request.headers.get('user-agent') ?? undefined,
      },
      update: {
        userAgent: request.headers.get('user-agent') ?? undefined,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('register-install error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
