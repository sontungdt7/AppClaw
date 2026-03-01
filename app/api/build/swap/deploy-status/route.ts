import { NextRequest, NextResponse } from 'next/server'

function mapReadyState(readyState?: string) {
  const state = (readyState || '').toUpperCase()
  if (state === 'READY') return 'ready'
  if (state === 'BUILDING') return 'building'
  if (state === 'QUEUED' || state === 'INITIALIZING') return 'queued'
  if (state === 'ERROR' || state === 'CANCELED') return 'error'
  return 'queued'
}

type VercelDeploymentStatusResponse = {
  id?: string
  url?: string
  readyState?: string
  error?: { message?: string }
}

/**
 * GET /api/build/swap/deploy-status?id=...
 * Returns normalized deployment status for UI polling.
 */
export async function GET(request: NextRequest) {
  try {
    const deploymentId = request.nextUrl.searchParams.get('id')?.trim()
    if (!deploymentId) {
      return NextResponse.json({ error: 'Missing deployment id' }, { status: 400 })
    }

    const token = process.env.VERCEL_API_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'Missing VERCEL_API_TOKEN in server environment' }, { status: 500 })
    }

    const teamId = process.env.VERCEL_TEAM_ID
    const query = new URLSearchParams()
    if (teamId) query.set('teamId', teamId)
    const endpoint =
      query.size > 0
        ? `https://api.vercel.com/v13/deployments/${deploymentId}?${query.toString()}`
        : `https://api.vercel.com/v13/deployments/${deploymentId}`

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const data = (await response.json()) as VercelDeploymentStatusResponse

    if (!response.ok) {
      return NextResponse.json({ error: data?.error?.message || 'Failed to load deployment status' }, { status: 500 })
    }

    const appUrl = data?.url ? `https://${data.url}` : null
    return NextResponse.json({
      deploymentId,
      status: mapReadyState(data?.readyState),
      appUrl,
      rawReadyState: data?.readyState ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load deployment status' }, { status: 500 })
  }
}
