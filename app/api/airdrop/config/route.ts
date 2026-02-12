import { NextResponse } from 'next/server'

const BASE_MAINNET_ID = 8453
const BASE_SEPOLIA_ID = 84532

/**
 * GET /api/airdrop/config — Returns public airdrop token config for the frontend.
 * Used by Wallet mini app to display token balance.
 */
export async function GET() {
  const tokenAddress = process.env.TOKEN_ADDRESS
  const symbol = process.env.AIRDROP_TOKEN_SYMBOL ?? 'APPCLAW'
  const decimals = parseInt(process.env.AIRDROP_TOKEN_DECIMALS ?? '18', 10)
  const amount = process.env.AIRDROP_AMOUNT ?? '1000'
  const chainId = process.env.ENVIRONMENT === 'DEVELOPMENT' ? BASE_SEPOLIA_ID : BASE_MAINNET_ID

  const airdropStarted = process.env.AIRDROP_STARTED === 'true'

  if (!tokenAddress) {
    return NextResponse.json({
      tokenAddress: null,
      symbol,
      decimals,
      amount,
      chainId,
      airdropStarted,
    })
  }

  return NextResponse.json({
    tokenAddress,
    symbol,
    decimals,
    amount,
    chainId,
    airdropStarted,
  })
}
