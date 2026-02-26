import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, http, parseAbi } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { prisma } from '@/lib/db'

const airdropChain = process.env.ENVIRONMENT === 'DEVELOPMENT' ? baseSepolia : base

const USDC_MAINNET = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const
const USDC_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const
const USDC_ADDRESS = airdropChain.id === 8453 ? USDC_MAINNET : USDC_SEPOLIA
const USDC_DECIMALS = 6
const CLAIM_AMOUNT = 1
const CLAIM_AMOUNT_RAW = BigInt(CLAIM_AMOUNT) * BigInt(10) ** BigInt(USDC_DECIMALS)

const ERC20_ABI = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
])

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const wallet = (body.wallet as string)?.trim()
    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json({ error: 'Invalid wallet' }, { status: 400 })
    }

    const privateKey = process.env.AIRDROP_WALLET_PRIVATE_KEY
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Airdrop wallet not configured (AIRDROP_WALLET_PRIVATE_KEY)' },
        { status: 503 }
      )
    }

    const address = wallet.toLowerCase()

    const existing = await prisma.usdcClaim.findUnique({
      where: { walletAddress: address },
    })
    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyClaimed: true,
        amount: String(CLAIM_AMOUNT),
        message: 'You have already claimed your 1 USDC.',
      })
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`)
    const client = createWalletClient({
      account,
      chain: airdropChain,
      transport: http(),
    })

    const hash = await client.writeContract({
      address: USDC_ADDRESS as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [address as `0x${string}`, CLAIM_AMOUNT_RAW],
    })

    await prisma.usdcClaim.create({
      data: { walletAddress: address },
    })

    return NextResponse.json({
      success: true,
      txHash: hash,
      chainId: airdropChain.id,
      amount: String(CLAIM_AMOUNT),
      message: `Sent ${CLAIM_AMOUNT} USDC to your wallet.`,
    })
  } catch (e) {
    console.error('claim-usdc error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Claim failed' },
      { status: 500 }
    )
  }
}
