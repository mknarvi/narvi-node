
const { test, describe, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const http = require('node:http')

const Narvi = require('../cjs/narvi.cjs.node.js')
const jsonStringify = require('json-stable-stringify')

const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'P-256',
})
const pemPath = path.join(os.tmpdir(), `narvi-pipeline-key-${process.pid}.pem`)

let server
let port
let lastReq
let nextResponse

const OK = { status: 200, body: '{"results":[]}', ctype: 'application/json' }

function client(overrides) {
  return Narvi({
    apiKeyId: 'TESTKEY',
    privateKeyFilePath: pemPath,
    host: '127.0.0.1',
    port,
    protocol: 'http',
    maxNetworkRetries: 0,
    ...overrides,
  })
}

function signatureValid(descriptor, signatureB64) {
  const digest = crypto.createHash('sha256').update(descriptor).digest()
  return crypto.verify(
    'sha256',
    digest,
    publicKey,
    Buffer.from(signatureB64, 'base64'),
  )
}

before(async () => {
  fs.writeFileSync(pemPath, privateKey.export({ type: 'pkcs8', format: 'pem' }))
  await new Promise((resolve) => {
    server = http.createServer((req, res) => {
      const chunks = []
      req.on('data', (c) => chunks.push(c))
      req.on('end', () => {
        lastReq = {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        }
        res.writeHead(nextResponse.status, { 'Content-Type': nextResponse.ctype })
        res.end(nextResponse.body)
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
  try {
    fs.unlinkSync(pemPath)
  } catch {}
})

beforeEach(() => {
  nextResponse = { ...OK }
  lastReq = undefined
})

describe('request routing (_getRequestOpts)', () => {
  test('GET retrieve: interpolates the url param into the path, no body', async () => {
    await client().accounts.retrieve('ACC123')
    assert.equal(lastReq.method, 'GET')
    assert.equal(lastReq.url, '/rest/v1.0/account/retrieve/ACC123')
    assert.equal(lastReq.body, '')
  })

  test('GET list: data goes to the query string, not the body', async () => {
    await client().transactions.list({ account_pid: 'ACC1', kind: 'CREDIT' })
    assert.equal(lastReq.method, 'GET')
    const [pathPart, query] = lastReq.url.split('?')
    assert.equal(pathPart, '/rest/v1.0/transactions/list')
    assert.equal(query, 'account_pid=ACC1&kind=CREDIT')
    assert.equal(lastReq.body, '')
  })

  test('POST create: data goes to the JSON body, not the query', async () => {
    const payload = {
      account_pid: 'ACC1',
      currency: 'EUR',
      amount: 100,
      recipient: { name: 'John Doe', number: 'FI8379600186405354' },
      remittance_information: { ustrd: 'invoice' },
    }
    await client().transactions.create(payload)
    assert.equal(lastReq.method, 'POST')
    assert.equal(lastReq.url, '/rest/v1.0/transactions/create')
    assert.deepEqual(JSON.parse(lastReq.body), payload)
  })

  test('PATCH update: interpolates url param AND sends the body', async () => {
    await client().transactions.update('TX9', { accept_vop: true })
    assert.equal(lastReq.method, 'PATCH')
    assert.equal(lastReq.url, '/rest/v1.0/transactions/update/TX9')
    assert.deepEqual(JSON.parse(lastReq.body), { accept_vop: true })
  })

  test('DELETE with two url params: both interpolated, no body', async () => {
    await client().baas.businessAdmins.delete('BIZ1', 'ADM2')
    assert.equal(lastReq.method, 'DELETE')
    assert.equal(
      lastReq.url,
      '/baas/v1.0/entity/business/BIZ1/admin/ADM2/delete',
    )
    assert.equal(lastReq.body, '')
  })

  test('GET with two url params (account balance) interpolates both', async () => {
    await client().baas.accounts.balance('ACC1', '2024-01-01')
    assert.equal(lastReq.method, 'GET')
    assert.equal(lastReq.url, '/baas/v1.0/account/ACC1/balance/2024-01-01')
  })

  test('every request carries the auth headers', async () => {
    await client().accounts.list()
    assert.equal(lastReq.headers['api-key-id'], 'TESTKEY')
    assert.match(lastReq.headers['api-request-id'], /[0-9a-f-]{36}/)
    assert.ok(lastReq.headers['api-request-signature'])
  })
})

describe('request signing (_makeRequest descriptor)', () => {
  test('POST: signature verifies over url + method + id + canonical body', async () => {
    const payload = { account_pid: 'ACC1', currency: 'EUR', amount: 100 }
    await client().transactions.create(payload)
    const descriptor =
      'http://127.0.0.1' +
      lastReq.url +
      'POST' +
      lastReq.headers['api-request-id'] +
      lastReq.body
    assert.equal(lastReq.body, jsonStringify(payload))
    assert.ok(
      signatureValid(descriptor, lastReq.headers['api-request-signature']),
    )
  })

  test('GET: signature verifies over url-without-query + canonical query', async () => {
    const query = { account_pid: 'ACC1', kind: 'CREDIT' }
    await client().transactions.list(query)
    const pathPart = lastReq.url.split('?')[0]
    const descriptor =
      'http://127.0.0.1' +
      pathPart +
      'GET' +
      lastReq.headers['api-request-id'] +
      jsonStringify(query)
    assert.ok(
      signatureValid(descriptor, lastReq.headers['api-request-signature']),
    )
  })

  test('tampering with the captured body breaks verification (sanity)', async () => {
    await client().transactions.create({ amount: 100 })
    const descriptor =
      'http://127.0.0.1' +
      lastReq.url +
      'POST' +
      lastReq.headers['api-request-id'] +
      '{"amount":999}'
    assert.equal(
      signatureValid(descriptor, lastReq.headers['api-request-signature']),
      false,
    )
  })
})

describe('error mapping (_jsonResponseHandler)', () => {
  const errBody = (type) =>
    JSON.stringify({ error: { type, message: 'boom' } })

  test('401 -> NarviAuthenticationError', async () => {
    nextResponse = { status: 401, body: errBody('authentication_error'), ctype: 'application/json' }
    await assert.rejects(
      () => client().accounts.list(),
      (e) => e instanceof Narvi.errors.NarviAuthenticationError,
    )
  })

  test('403 -> NarviPermissionError', async () => {
    nextResponse = { status: 403, body: errBody('permission_error'), ctype: 'application/json' }
    await assert.rejects(
      () => client().accounts.list(),
      (e) => e instanceof Narvi.errors.NarviPermissionError,
    )
  })

  test('429 -> NarviRateLimitError', async () => {
    nextResponse = { status: 429, body: errBody('rate_limit_error'), ctype: 'application/json' }
    await assert.rejects(
      () => client().accounts.list(),
      (e) => e instanceof Narvi.errors.NarviRateLimitError,
    )
  })

  test('500 with type api_error -> NarviAPIError (via generate)', async () => {
    nextResponse = { status: 500, body: errBody('api_error'), ctype: 'application/json' }
    await assert.rejects(
      () => client().accounts.list(),
      (e) => e instanceof Narvi.errors.NarviAPIError,
    )
  })

  test('non-JSON error body surfaces as NarviAPIError (current behaviour)', async () => {
    nextResponse = { status: 404, body: '<!DOCTYPE html><title>Not found</title>', ctype: 'text/html' }
    await assert.rejects(
      () => client().accounts.list(),
      (e) =>
        e instanceof Narvi.errors.NarviAPIError &&
        /Invalid JSON received/.test(e.message),
    )
  })

  test('errors.generate maps the raw error type to the right class', () => {
    assert.ok(
      Narvi.errors.generate({ type: 'rate_limit_error' }) instanceof
        Narvi.errors.NarviRateLimitError,
    )
    assert.ok(
      Narvi.errors.generate({ type: 'idempotency_error' }) instanceof
        Narvi.errors.NarviIdempotencyError,
    )
    assert.ok(
      Narvi.errors.generate({ type: 'something_new' }) instanceof
        Narvi.errors.NarviUnknownError,
    )
  })
})
