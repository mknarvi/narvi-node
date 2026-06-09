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
  const accountPid = process.env.NARVI_ACCOUNT_PID
  if (!accountPid) {
    console.error('Set NARVI_ACCOUNT_PID to the source account PID.')
    process.exit(1)
  }

  const payload = {
    account_pid: accountPid,
    currency: 'EUR',
    amount: 100,
    recipient: {
      name: 'Simo Hayha',
      number: 'FI4179600176830755',
      address: 'Lapinlahdenkatu 16',
      city: 'Helsinki',
      zip_code: '00180',
      country: 'FI',
    },
    remittance_information: { ustrd: 'Example transfer from narvi-node examples' },
  }

  if (process.env.NARVI_CONFIRM_SEND !== 'true') {
    console.log('Dry run — this transaction would be created:')
    console.log(JSON.stringify(payload, null, 2))
    console.log('\nSet NARVI_CONFIRM_SEND=true to actually send it.')
    return
  }

  const transaction = await narvi.transactions.create(payload)
  console.log('Created transaction:', transaction.pid, '-', transaction.status)
}

main().catch((err) => {
  console.error('\nRequest failed:', err?.type ?? err?.name ?? 'Error')
  console.error(err?.message ?? err)
  process.exit(1)
})
