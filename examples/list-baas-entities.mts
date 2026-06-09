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
  const { results: privateEntities } = (await narvi.baas.privateEntities.list()) as unknown as {
    results: Array<{ pid: string; first_name: string; last_name: string }>
  }
  console.log(`Private entities (${privateEntities.length}):`)
  for (const entity of privateEntities) {
    console.log(`  ${entity.pid}  ${entity.first_name} ${entity.last_name}`)
  }

  const { results: businessEntities } = (await narvi.baas.businessEntities.list()) as unknown as {
    results: Array<{ pid: string; kind: string }>
  }
  console.log(`\nBusiness entities (${businessEntities.length}):`)
  for (const entity of businessEntities) {
    console.log(`  ${entity.pid}  (${entity.kind})`)
  }
}

main().catch((err) => {
  console.error('\nRequest failed:', err?.type ?? err?.name ?? 'Error')
  console.error(err?.message ?? err)
  process.exit(1)
})
