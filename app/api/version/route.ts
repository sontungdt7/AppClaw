import { NextResponse } from 'next/server'

/**
 * Returns the current deploy/build version.
 * On Vercel: VERCEL_GIT_COMMIT_SHA. Else: BUILD_ID or timestamp.
 * Client polls this to detect new deploys; must not be cached.
 */
export async function GET() {
  const version =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.BUILD_ID ??
    process.env.NEXT_BUILD_ID ??
    null
  return NextResponse.json(
    { version: version ?? 'dev' },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
      },
    }
  )
}
