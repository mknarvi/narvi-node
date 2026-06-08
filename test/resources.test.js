
const { test, describe, before, after } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const Narvi = require('../cjs/narvi.cjs.node.js')

const pemPath = path.join(os.tmpdir(), `narvi-surface-key-${process.pid}.pem`)
let client

before(() => {
  const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' })
  fs.writeFileSync(pemPath, privateKey.export({ type: 'pkcs8', format: 'pem' }))
  client = Narvi({ apiKeyId: 'TEST', privateKeyFilePath: pemPath, host: 'devapi.narvi.com' })
})

after(() => {
  try {
    fs.unlinkSync(pemPath)
  } catch {}
})

describe('SDK surface', () => {
  test('baas namespace mounts every resource', () => {
    const expected = [
      'privateEntities',
      'businessEntities',
      'businessAdmins',
      'accounts',
      'transactions',
      'challenges',
      'files',
    ]
    for (const r of expected) {
      assert.ok(client.baas[r], `missing baas.${r}`)
    }
  })

  test('baas resource methods exist', () => {
    assert.equal(typeof client.baas.files.upload, 'function')
    assert.equal(typeof client.baas.files.download, 'function')
    assert.equal(typeof client.baas.accounts.balance, 'function')
    assert.equal(typeof client.baas.businessAdmins.delete, 'function')
    assert.equal(typeof client.baas.transactions.create, 'function')
    assert.equal(typeof client.baas.challenges.retrieve, 'function')
    assert.equal(typeof client.baas.privateEntities.settingsUpdateInit, 'function')
  })

  test('banking resources expose the full method set (including update)', () => {
    assert.equal(typeof client.accounts.retrieve, 'function')
    assert.equal(typeof client.accounts.list, 'function')
    for (const m of ['create', 'retrieve', 'list', 'update']) {
      assert.equal(typeof client.transactions[m], 'function', `transactions.${m}`)
    }
  })

  test('signature + webhook helpers are exposed statically', () => {
    const statics = [
      'getNarviRequestSignature',
      'getNarviRequestHeaders',
      'getNarviRequestSignaturePayload',
      'getNarviChallengeSignature',
      'getNarviWebhookSignature',
      'getPaginationCursor',
    ]
    for (const fn of statics) {
      assert.equal(typeof Narvi[fn], 'function', `Narvi.${fn}`)
    }
    assert.equal(typeof Narvi.webhooks.signature, 'function')
    assert.equal(typeof Narvi.webhooks.verifySignature, 'function')
    assert.equal(typeof Narvi.webhooks.constructEvent, 'function')
  })

  test('webhooks helper is also exposed on the instance', () => {
    assert.equal(typeof client.webhooks.verifySignature, 'function')
  })
})
