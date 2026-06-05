
const { test, describe, before, after } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const http = require('node:http')
const { Readable } = require('node:stream')

const Narvi = require('../cjs/narvi.cjs.node.js')

const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'P-256',
})
const pemPath = path.join(os.tmpdir(), `narvi-test-key-${process.pid}.pem`)
const samplePath = path.join(os.tmpdir(), `narvi-test-upload-${process.pid}.bin`)
const sampleBytes = crypto.randomBytes(4096)

let server
let port
let lastCapture

function client() {
  return Narvi({
    apiKeyId: 'TEST',
    privateKeyFilePath: pemPath,
    host: '127.0.0.1',
    port,
    protocol: 'http',
    maxNetworkRetries: 0,
  })
}

function parseMultipart(buf, contentType) {
  const boundary = /boundary=(.+)$/.exec(contentType)[1]
  const text = buf.toString('latin1')
  const headerEnd = text.indexOf('\r\n\r\n')
  const head = text.slice(0, headerEnd)
  const tail = `\r\n--${boundary}--\r\n`
  return {
    boundary,
    partType: /Content-Type: ([^\r\n]+)/.exec(head)[1],
    filename: /filename="([^"]*)"/.exec(head)[1],
    fileBytes: buf.subarray(headerEnd + 4, buf.length - Buffer.byteLength(tail)),
  }
}

before(async () => {
  fs.writeFileSync(pemPath, privateKey.export({ type: 'pkcs8', format: 'pem' }))
  fs.writeFileSync(samplePath, sampleBytes)
  await new Promise((resolve) => {
    server = http.createServer((req, res) => {
      const chunks = []
      req.on('data', (c) => chunks.push(c))
      req.on('end', () => {
        lastCapture = { headers: req.headers, body: Buffer.concat(chunks) }
        res.writeHead(201, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            pid: 'PID123',
            name: 'stored',
            size: lastCapture.body.length,
            mimetype: 'image/jpeg',
          }),
        )
      })
    })
    server.listen(0, '127.0.0.1', () => {
      port = server.address().port
      resolve()
    })
  })
})

after(() => {
  server.close()
  for (const p of [pemPath, samplePath]) {
    try {
      fs.unlinkSync(p)
    } catch {}
  }
})

describe('files.upload', () => {
  test('returns the parsed response object', async () => {
    const res = await client().baas.files.upload({ file: samplePath })
    assert.equal(res.pid, 'PID123')
    assert.equal(res.mimetype, 'image/jpeg')
  })

  test('path input: octet-stream default, filename = basename, bytes intact', async () => {
    await client().baas.files.upload({ file: samplePath })
    const part = parseMultipart(lastCapture.body, lastCapture.headers['content-type'])
    assert.equal(part.partType, 'application/octet-stream')
    assert.equal(part.filename, path.basename(samplePath))
    assert.ok(part.fileBytes.equals(sampleBytes), 'uploaded bytes must match exactly')
  })

  test('bare path (not wrapped in { file }) works', async () => {
    await client().baas.files.upload(samplePath)
    const part = parseMultipart(lastCapture.body, lastCapture.headers['content-type'])
    assert.ok(part.fileBytes.equals(sampleBytes))
  })

  test('Buffer input defaults to name "file" + octet-stream', async () => {
    await client().baas.files.upload({ file: sampleBytes })
    const part = parseMultipart(lastCapture.body, lastCapture.headers['content-type'])
    assert.equal(part.filename, 'file')
    assert.equal(part.partType, 'application/octet-stream')
    assert.ok(part.fileBytes.equals(sampleBytes))
  })

  test('object form { data, name, type } is honored', async () => {
    await client().baas.files.upload({
      file: { data: sampleBytes, name: 'scan.pdf', type: 'application/pdf' },
    })
    const part = parseMultipart(lastCapture.body, lastCapture.headers['content-type'])
    assert.equal(part.partType, 'application/pdf')
    assert.equal(part.filename, 'scan.pdf')
  })

  test('stream input is buffered correctly', async () => {
    await client().baas.files.upload({
      file: { data: Readable.from(sampleBytes), name: 'streamed.bin' },
    })
    const part = parseMultipart(lastCapture.body, lastCapture.headers['content-type'])
    assert.equal(part.filename, 'streamed.bin')
    assert.ok(part.fileBytes.equals(sampleBytes))
  })

  test('top-level type override applies even with a bare path', async () => {
    await client().baas.files.upload({ file: samplePath, type: 'image/png' })
    const part = parseMultipart(lastCapture.body, lastCapture.headers['content-type'])
    assert.equal(part.partType, 'image/png')
  })

  test('top-level name/type override wins over the object form', async () => {
    await client().baas.files.upload({
      file: { data: sampleBytes, name: 'inner', type: 'inner/type' },
      name: 'outer.bin',
      type: 'outer/type',
    })
    const part = parseMultipart(lastCapture.body, lastCapture.headers['content-type'])
    assert.equal(part.partType, 'outer/type')
    assert.equal(part.filename, 'outer.bin')
  })

  test('request signature is computed over the sha256 of the file content', async () => {
    await client().baas.files.upload({ file: samplePath })
    const hex = crypto.createHash('sha256').update(sampleBytes).digest('hex')
    const reqId = lastCapture.headers['api-request-id']
    const sig = lastCapture.headers['api-request-signature']
    const url = 'http://127.0.0.1/baas/v1.0/file/upload'
    const descriptor = url + 'POST' + reqId + `{"file":"${hex}"}`
    const digest = crypto.createHash('sha256').update(descriptor).digest()
    assert.ok(
      crypto.verify('sha256', digest, publicKey, Buffer.from(sig, 'base64')),
      'signature must verify against { file: <sha256 hex> }',
    )
    assert.equal(lastCapture.headers['api-key-id'], 'TEST')
  })

  test('rejects invalid file input', async () => {
    await assert.rejects(
      () => client().baas.files.upload({ file: 123 }),
      /must be a filesystem path/,
    )
  })
})
