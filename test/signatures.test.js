
const { test, describe } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')

const Narvi = require('../cjs/narvi.cjs.node.js')
const jsonStringify = require('json-stable-stringify')

const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'P-256',
})

function verifyDescriptor(descriptor, signatureB64) {
  const digest = crypto.createHash('sha256').update(descriptor).digest()
  return crypto.verify(
    'sha256',
    digest,
    publicKey,
    Buffer.from(signatureB64, 'base64'),
  )
}

describe('getNarviRequestSignature', () => {
  test('GET with query params: canonical sorted query, round-trips', () => {
    const url = 'https://api.narvi.com/rest/v1.0/transactions/list'
    const queryParams = { kind: 'CREDIT', account_pid: 'KFGKJ5L27ASGTZAO' }
    const requestID = 'da43520e-800b-41c5-a4a9-7287a64c87fa'

    const sig = Narvi.getNarviRequestSignature({
      privateKey,
      url,
      method: 'GET',
      requestID,
      queryParams,
    })

    assert.equal(
      jsonStringify(queryParams),
      '{"account_pid":"KFGKJ5L27ASGTZAO","kind":"CREDIT"}',
    )
    assert.ok(
      verifyDescriptor(url + 'GET' + requestID + jsonStringify(queryParams), sig),
    )
  })

  test('POST payload matches the documented canonical example', () => {
    const payload = {
      account_pid: 'KFGKJ5L27ASGTZAO',
      amount: '100',
      currency: 'EUR',
      recipient: {
        name: 'John Doe',
        number: 'FI8379600186405354',
        bic: 'NARIFXX',
        country: 'FI',
      },
      remittance_information: { ustrd: 'test transfer' },
    }
    const expected =
      '{"account_pid":"KFGKJ5L27ASGTZAO","amount":"100","currency":"EUR","recipient":{"bic":"NARIFXX","country":"FI","name":"John Doe","number":"FI8379600186405354"},"remittance_information":{"ustrd":"test transfer"}}'
    assert.equal(jsonStringify(payload), expected)

    const url = 'https://api.narvi.com/rest/v1.0/transactions/create'
    const requestID = 'req-1'
    const sig = Narvi.getNarviRequestSignature({
      privateKey,
      url,
      method: 'POST',
      requestID,
      payload,
    })
    assert.ok(verifyDescriptor(url + 'POST' + requestID + expected, sig))
  })

  test('empty query/payload are omitted from the descriptor', () => {
    const url = 'https://api.narvi.com/x'
    const requestID = 'req-2'
    const bare = url + 'GET' + requestID

    const noPayload = Narvi.getNarviRequestSignature({
      privateKey,
      url,
      method: 'GET',
      requestID,
    })
    const emptyPayload = Narvi.getNarviRequestSignature({
      privateKey,
      url,
      method: 'GET',
      requestID,
      payload: {},
      queryParams: {},
    })

    assert.ok(verifyDescriptor(bare, noPayload))
    assert.ok(verifyDescriptor(bare, emptyPayload))
  })

  test('query string is stripped from the url in the descriptor', () => {
    const requestID = 'req-3'
    const sig = Narvi.getNarviRequestSignature({
      privateKey,
      url: 'https://api.narvi.com/x?a=1&b=2',
      method: 'GET',
      requestID,
    })
    assert.ok(verifyDescriptor('https://api.narvi.com/x' + 'GET' + requestID, sig))
  })

  test('file upload payload form { file: <sha256 hex> } round-trips', () => {
    const content = Buffer.from('hello narvi', 'utf8')
    const hex = crypto.createHash('sha256').update(content).digest('hex')
    const url = 'https://api.narvi.com/baas/v1.0/file/upload'
    const requestID = 'req-4'
    const sig = Narvi.getNarviRequestSignature({
      privateKey,
      url,
      method: 'POST',
      requestID,
      payload: { file: hex },
    })
    assert.ok(
      verifyDescriptor(url + 'POST' + requestID + `{"file":"${hex}"}`, sig),
    )
  })

  test('different request IDs produce different signatures', () => {
    const base = { privateKey, url: 'https://api.narvi.com/x', method: 'GET' }
    const a = Narvi.getNarviRequestSignature({ ...base, requestID: 'a' })
    const b = Narvi.getNarviRequestSignature({ ...base, requestID: 'b' })
    assert.notEqual(a, b)
  })
})

describe('getNarviChallengeSignature', () => {
  test('descriptor = challengePid + target + privatePid, round-trips', () => {
    const params = {
      challengePid: 'T83H6LH48MMYS497',
      target: 'example@example.com',
      privatePid: '68156984',
    }
    const sig = Narvi.getNarviChallengeSignature({ privateKey, ...params })
    assert.ok(
      verifyDescriptor(
        params.challengePid + params.target + params.privatePid,
        sig,
      ),
    )
  })
})

describe('helpers', () => {
  test('getNarviRequestSignaturePayload normalizes an empty payload to undefined', () => {
    const out = Narvi.getNarviRequestSignaturePayload({
      privateKey,
      url: 'u',
      method: 'GET',
      requestID: 'r',
      payload: {},
    })
    assert.equal(out.payload, undefined)
  })

  test('getPaginationCursor extracts the cursor from a url', () => {
    assert.equal(
      Narvi.getPaginationCursor('https://api.narvi.com/x?cursor=abc123'),
      'abc123',
    )
    assert.equal(Narvi.getPaginationCursor('https://api.narvi.com/x'), '')
  })
})
