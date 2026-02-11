import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const wallet = (body.wallet as string)?.trim()
    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return new Response(JSON.stringify({ error: 'Invalid wallet' }), { status: 400 })
    }
    const address = wallet.toLowerCase()
    await prisma.walletSignup.upsert({
      where: { walletAddress: address },
      create: { walletAddress: address },
      update: {},
    })
    return new Response(JSON.stringify({ ok: true }))
  } catch {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
}
