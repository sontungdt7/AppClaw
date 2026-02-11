import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, http, parseAbi } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { prisma } from '@/lib/db'

const airdropChain = process.env.ENVIRONMENT === 'DEVELOPMENT' ? baseSepolia : base

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

    const privateKey = process.env.PRIVATE_KEY
    const tokenAddress = process.env.TOKEN_ADDRESS
    const amountPerUser = process.env.AIRDROP_AMOUNT ?? '1000'
    if (!privateKey || !tokenAddress) {
      return NextResponse.json(
        { error: 'Airdrop not configured (PRIVATE_KEY or TOKEN_ADDRESS)' },
        { status: 503 }
      )
    }

    const address = wallet.toLowerCase()
    const reg = await prisma.airdropRegistration.findFirst({
      where: { walletAddress: address },
    })
    if (!reg) {
      return NextResponse.json({ error: 'Not registered. Link X first.' }, { status: 400 })
    }
    if (!reg.repostedAt) {
      return NextResponse.json({ error: 'Repost the campaign tweet first.' }, { status: 400 })
    }
    if (reg.airdroppedAt) {
      return NextResponse.json({
        success: true,
        alreadyClaimed: true,
        amount: reg.amount,
        message: 'Airdrop already sent to your wallet.',
      })
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`)
    const client = createWalletClient({
      account,
      chain: airdropChain,
      transport: http(),
    })
    const amountWei = BigInt(amountPerUser) * BigInt(10) ** BigInt(18)

    const hash = await client.writeContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [address as `0x${string}`, amountWei],
    })

    await prisma.airdropRegistration.update({
      where: { id: reg.id },
      data: { airdroppedAt: new Date(), amount: amountPerUser },
    })

    return NextResponse.json({
      success: true,
      txHash: hash,
      chainId: airdropChain.id,
      amount: amountPerUser,
      message: `Sent ${amountPerUser} APPCLAW to your wallet.`,
    })
  } catch (e) {
    console.error('airdrop claim error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Claim failed' },
      { status: 500 }
    )
  }
}
