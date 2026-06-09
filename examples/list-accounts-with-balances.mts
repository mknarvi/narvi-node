import Narvi from 'narvi'

const apiKeyId = process.env.NARVI_API_KEY_ID
const privateKeyFilePath = process.env.NARVI_PRIVATE_KEY_PATH

if (!apiKeyId || !privateKeyFilePath) {
  console.error(
    'Set NARVI_API_KEY_ID and NARVI_PRIVATE_KEY_PATH first (see examples/README.md).',
  )
  process.exit(1)
}

const narvi = new Narvi({
  apiKeyId,
  privateKeyFilePath,
  ...(process.env.NARVI_API_ADDRESS ? { host: process.env.NARVI_API_ADDRESS } : {}),
})

async function main() {
  const { results } = (await narvi.accounts.list()) as unknown as {
    results: Array<{ name: string; number: string; balance: number; currency: string }>
  }

  if (!results.length) {
    console.log('No accounts found.')
    return
  }

  for (const account of results) {
    const balance = (account.balance / 100).toFixed(2)
    console.log(`${account.name} (${account.number}): ${balance} ${account.currency}`)
  }
}

main().catch((err) => {
  console.error('\nRequest failed:', err?.type ?? err?.name ?? 'Error')
  console.error(err?.message ?? err)
  process.exit(1)
})
