import { NextRequest, NextResponse } from 'next/server'

function generateMockResponse(input: string) {
  const normalized = input.toLowerCase()
  const appType = normalized.includes('swap')
    ? 'Swap mini app'
    : normalized.includes('airdrop')
      ? 'Airdrop growth app'
      : normalized.includes('game')
        ? 'Onchain game app'
        : 'Crypto utility app'

  return {
    summary: `Great direction. I can scaffold a ${appType} for Base with wallet-first onboarding and production-ready defaults.`,
    appSpec: {
      name: 'My Base App',
      chain: process.env.ENVIRONMENT === 'DEVELOPMENT' ? 'Base Sepolia' : 'Base',
      features: [
        'Wallet connect + session guard',
        'AppStore listing metadata',
        'Profile ownership panel',
      ],
      nextSteps: [
        'Confirm app name, audience, and core user action',
        'Choose monetization model (fee, subscription, token utility)',
        'Generate MVP scaffold and test with 5 users',
      ],
    },
    followUpQuestion: 'What is the single most important user action on day one?',
  }
}

/**
 * POST /api/build/mock
 * Request body: { prompt: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    return NextResponse.json(generateMockResponse(prompt))
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
