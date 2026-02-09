/**
 * Cron: Batch airdrop APPCLAW to eligible AirdropRegistrations
 * - Filter: airdroppedAt is null
 * - Uses viem to transfer ERC20
 *
 * Requires: PRIVATE_KEY (airdrop wallet), TOKEN_ADDRESS, DATABASE_URL
 * Run: npx tsx scripts/batch-airdrop.ts
 */

import { createWalletClient, http, parseAbi } from 'viem'
import { base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { prisma } from '../lib/db'

const ERC20_ABI = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
])

async function main() {
  const privateKey = process.env.PRIVATE_KEY
  const tokenAddress = process.env.TOKEN_ADDRESS
  const amountPerUser = process.env.AIRDROP_AMOUNT ?? '1000'

  if (!privateKey || !tokenAddress) {
    console.error('Missing PRIVATE_KEY or TOKEN_ADDRESS')
    process.exit(1)
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`)
  const client = createWalletClient({
    account,
    chain: base,
    transport: http(),
  })

  const amountWei = BigInt(amountPerUser) * (BigInt(10) ** BigInt(18))
  const pending = await prisma.airdropRegistration.findMany({
    where: { airdroppedAt: null },
  })

  console.log(`Airdropping ${amountPerUser} APPCLAW to ${pending.length} addresses`)

  for (const reg of pending) {
    try {
      const hash = await client.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [reg.walletAddress as `0x${string}`, amountWei],
      })
      console.log(`  OK: ${reg.walletAddress.slice(0, 10)}... tx ${hash}`)
      await prisma.airdropRegistration.update({
        where: { id: reg.id },
        data: { airdroppedAt: new Date(), amount: amountPerUser },
      })
    } catch (e) {
      console.error(`  FAIL: ${reg.walletAddress}`, e)
    }
  }

  console.log('Done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
