import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

/**
 * GET /api/airdrop/registered — Returns number of users registered for airdrop.
 */
export async function GET() {
  try {
    const count = await prisma.airdropRegistration.count()
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
