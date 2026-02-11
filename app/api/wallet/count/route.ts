import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const count = await prisma.walletSignup.count()
    return Response.json({ count })
  } catch {
    return Response.json({ count: 0 })
  }
}
