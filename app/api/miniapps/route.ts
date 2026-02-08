import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const delegate = (prisma as { miniApp?: { findMany: (args: object) => Promise<unknown[]> } }).miniApp
    if (!delegate) {
      return NextResponse.json([])
    }
    const apps = (await delegate.findMany({
      orderBy: { createdAt: 'desc' },
    })) as { id: string; name: string; description: string; imageUrl: string; url: string; manifestUrl: string | null; tags: string | null; devBalance: string | null; verified: boolean }[]
    return NextResponse.json(
      apps.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        imageUrl: a.imageUrl,
        url: a.url,
        manifestUrl: a.manifestUrl,
        devBalance: a.devBalance,
        tags: a.tags ? a.tags.split(',').map((t) => t.trim()) : [],
        verified: a.verified,
      }))
    )
  } catch (e) {
    console.error('miniapps GET error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const delegate = (prisma as { miniApp?: { create: (args: object) => Promise<{ id: string; name: string }> } }).miniApp
    if (!delegate) {
      return NextResponse.json(
        { error: 'Mini app registry not ready. Run: npx prisma generate && npx prisma db push' },
        { status: 503 }
      )
    }
    const body = await request.json()
    const { name, description, imageUrl, url, manifestUrl, tags, devBalance } = body

    if (!name || !description || !imageUrl || !url) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, imageUrl, url' },
        { status: 400 }
      )
    }

    if (typeof name !== 'string' || name.length > 64) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
    }
    if (typeof description !== 'string' || description.length > 256) {
      return NextResponse.json({ error: 'Invalid description' }, { status: 400 })
    }
    if (typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
      return NextResponse.json({ error: 'imageUrl must be a valid URL' }, { status: 400 })
    }
    if (typeof url !== 'string' || (!url.startsWith('http') && !url.startsWith('/'))) {
      return NextResponse.json({ error: 'url must be a valid URL or path' }, { status: 400 })
    }

    const tagsStr = Array.isArray(tags)
      ? tags.join(', ')
      : typeof tags === 'string'
        ? tags
        : null

    const app = await delegate.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        url: url.trim(),
        manifestUrl: typeof manifestUrl === 'string' ? manifestUrl.trim() || null : null,
        tags: tagsStr,
        devBalance: typeof devBalance === 'string' ? devBalance.trim() || null : null,
        verified: true,
      },
    })

    return NextResponse.json({
      id: app.id,
      name: app.name,
      message: 'Mini app is live in the store.',
    })
  } catch (e) {
    console.error('miniapps POST error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
