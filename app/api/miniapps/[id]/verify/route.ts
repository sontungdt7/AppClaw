import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Verification not configured' }, { status: 501 })
  }
  const body = await request.json().catch(() => ({}))
  if (body.secret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const delegate = (prisma as { miniApp?: { update: (args: object) => Promise<unknown> } }).miniApp
  if (!delegate) {
    return NextResponse.json({ error: 'Mini app registry not ready' }, { status: 503 })
  }
  try {
    await delegate.update({
      where: { id } as { id: string },
      data: { verified: true },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
