/**
 * Cron job: Batch airdrop APPCLAW to eligible AirdropRegistrations
 * - Filter: airdroppedAt is null, address in InstallEvent
 * - Fixed amount per user (env: AIRDROP_AMOUNT, default 1000)
 * - Uses viem to send transactions
 *
 * Requires: PRIVATE_KEY (airdrop wallet), TOKEN_ADDRESS, AIRDROP_AMOUNT
 * Run: npx tsx scripts/batch-airdrop.ts
 */

const BASE_CHAIN_ID = 8453

async function batchAirdrop() {
  const privateKey = process.env.PRIVATE_KEY
  const tokenAddress = process.env.TOKEN_ADDRESS
  const amount = process.env.AIRDROP_AMOUNT ?? '1000' // APPCLAW (assume 18 decimals)

  if (!privateKey || !tokenAddress) {
    console.error('Missing PRIVATE_KEY or TOKEN_ADDRESS')
    process.exit(1)
  }

  console.log(`Batch airdrop: ${amount} APPCLAW per address`)
  console.log('TODO: Load AirdropRegistration from DB, filter by InstallEvent')
  console.log('TODO: Use viem writeContract to transfer ERC20')
  console.log('TODO: Update airdroppedAt after success')
}

batchAirdrop().catch((e) => {
  console.error(e)
  process.exit(1)
})
