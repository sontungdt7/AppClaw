import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const VERCEL_DEPLOYMENTS_API = 'https://api.vercel.com/v13/deployments'

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function buildStatusHtml(appName: string, logoUrl: string) {
  const safeName = escapeHtml(appName)
  const safeLogo = escapeHtml(logoUrl)
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeName} | Swap App</title>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        background: #fff;
        color: #111;
        display: grid;
        place-items: center;
        padding: 24px;
      }
      .card {
        width: 100%;
        max-width: 680px;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        padding: 24px;
        background: #fafafa;
      }
      .head {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }
      .logo {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        object-fit: cover;
        border: 1px solid #e5e7eb;
        background: #f3f4f6;
      }
      h1 { font-size: 22px; margin: 0; }
      p { margin: 0; line-height: 1.5; color: #4b5563; }
      .status {
        margin-top: 16px;
        border: 1px solid #bfdbfe;
        border-radius: 10px;
        background: #eff6ff;
        padding: 12px;
        color: #1d4ed8;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <section class="head">
        <img class="logo" src="${safeLogo}" alt="${safeName}" />
        <div>
          <h1>${safeName}</h1>
          <p>Swap App on Base</p>
        </div>
      </section>
      <p>This app is deployed by AppClaw Factory. Phase 1 provides a frontend status template; swap execution modules will be attached in next phases.</p>
      <div class="status">Deployment successful</div>
    </main>
  </body>
</html>`
}

type VercelDeployResponse = {
  url?: string
  id?: string
  readyState?: string
  error?: { message?: string }
}

function mapReadyState(readyState?: string) {
  const state = (readyState || '').toUpperCase()
  if (state === 'READY') return 'ready'
  if (state === 'BUILDING') return 'building'
  if (state === 'QUEUED' || state === 'INITIALIZING') return 'queued'
  if (state === 'ERROR' || state === 'CANCELED') return 'error'
  return 'queued'
}

async function deployToVercel(appName: string, logoUrl: string, slug: string, teamId?: string) {
  const token = process.env.VERCEL_API_TOKEN
  if (!token) {
    throw new Error('Missing VERCEL_API_TOKEN in server environment')
  }

  const query = new URLSearchParams()
  if (teamId) query.set('teamId', teamId)
  const endpoint = query.size > 0 ? `${VERCEL_DEPLOYMENTS_API}?${query.toString()}` : VERCEL_DEPLOYMENTS_API

  const body = {
    name: `appclaw-swap-${slug}`.slice(0, 96),
    target: 'production',
    public: true,
    files: [
      {
        file: 'index.html',
        data: buildStatusHtml(appName, logoUrl),
      },
    ],
    projectSettings: {
      framework: null,
    },
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = (await response.json()) as VercelDeployResponse
  if (!response.ok || !data?.url) {
    throw new Error(data?.error?.message || 'Vercel deployment failed')
  }

  return {
    deploymentId: data.id ?? null,
    appUrl: `https://${data.url}`,
    status: mapReadyState(data.readyState),
  }
}

/**
 * POST /api/build/swap/deploy
 * Body: { appName: string, logoUrl: string }
 *
 * Phase 1 behavior:
 * - Validate input
 * - Deploy a static status Swap app to Vercel
 * - Create a generated Swap app entry (when MiniApp table is available)
 * - Return deployed app URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const appName = typeof body?.appName === 'string' ? body.appName.trim() : ''
    const logoInput = typeof body?.logoUrl === 'string' ? body.logoUrl.trim() : ''

    if (!appName || !logoInput) {
      return NextResponse.json({ error: 'appName and logoUrl are required' }, { status: 400 })
    }

    if (!/^https?:\/\/.+/i.test(logoInput) && !logoInput.startsWith('/')) {
      return NextResponse.json({ error: 'logoUrl must be a valid URL or local path' }, { status: 400 })
    }

    const logoUrl = logoInput.startsWith('/')
      ? `${request.nextUrl.origin}${logoInput}`
      : logoInput

    const slugBase = toSlug(appName) || 'swap-app'
    const suffix = Date.now().toString(36)
    const slug = `${slugBase}-${suffix}`
    const teamId = process.env.VERCEL_TEAM_ID

    const deployment = await deployToVercel(appName, logoUrl, slug, teamId)

    const delegate = (prisma as { miniApp?: { create: (args: object) => Promise<{ id: string }> } }).miniApp
    if (delegate) {
      await delegate.create({
        data: {
          name: appName,
          description: 'Generated Swap app (Phase 1 status page).',
          imageUrl: logoUrl,
          url: deployment.appUrl,
          manifestUrl: null,
          tags: 'swap, generated, phase1',
          devBalance: 'new',
          verified: true,
        },
      })
    }

    return NextResponse.json({
      ok: true,
      appName,
      slug,
      status: 'deployed',
      appUrl: deployment.appUrl,
      deploymentId: deployment.deploymentId,
      deploymentStatus: deployment.status,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Deployment failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
