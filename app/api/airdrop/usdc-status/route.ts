import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet')
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return NextResponse.json({ error: 'Invalid wallet' }, { status: 400 })
  }

  const claim = await prisma.usdcClaim.findUnique({
    where: { walletAddress: wallet.toLowerCase() },
  })

  return NextResponse.json({
    claimed: !!claim,
    claimedAt: claim?.claimedAt?.toISOString() ?? null,
  })
}
