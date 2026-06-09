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
  const filePath = process.argv[2]

  const uploaded = filePath
    ? await narvi.baas.files.upload(filePath)
    : await narvi.baas.files.upload({
        file: { data: Buffer.from('Hello from narvi-node examples\n'), name: 'hello.txt' },
      })

  console.log('Uploaded file:')
  console.log('  pid:     ', uploaded.pid)
  console.log('  name:    ', uploaded.name)
  console.log('  size:    ', uploaded.size)
  console.log('  mimetype:', uploaded.mimetype)

  const metadata = await narvi.baas.files.retrieve(uploaded.pid)
  console.log('\nRetrieved metadata:', metadata)
}

main().catch((err) => {
  console.error('\nRequest failed:', err?.type ?? err?.name ?? 'Error')
  console.error(err?.message ?? err)
  process.exit(1)
})
