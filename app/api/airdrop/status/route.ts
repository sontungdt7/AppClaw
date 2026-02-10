import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet')
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return NextResponse.json({ error: 'Invalid wallet' }, { status: 400 })
  }

  const reg = await prisma.airdropRegistration.findFirst({
    where: { walletAddress: wallet.toLowerCase() },
  })
  if (!reg) {
    return NextResponse.json({
      linked: false,
      airdroppedAt: null,
      twitterUsername: null,
    })
  }

  return NextResponse.json({
    linked: true,
    twitterUsername: reg.twitterUsername ?? undefined,
    airdroppedAt: reg.airdroppedAt?.toISOString() ?? null,
    amount: reg.amount ?? undefined,
  })
}
