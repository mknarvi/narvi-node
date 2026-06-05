
const { test, describe } = require('node:test')
const assert = require('node:assert/strict')

const Narvi = require('../cjs/narvi.cjs.node.js')

const EXPECTED =
  '6936d3cca9f93be1967f17addb241a00a5a4a7f3472d8c1820c8e20ac6a83062'

const UNSORTED_PAYLOAD = {
  fee: 0,
  pid: '7C7Y2WH6A0752IDH',
  kind: 'DEBIT',
  added: '1739926645.229513',
  amount: 600,
  sender: {
    city: 'Helsinki',
    name: 'Example User',
    number: 'FI4279600195333487',
    address: 'Example address',
    country: 'FI',
    zip_code: '12345',
  },
  source: 'WEB',
  status: 'PENDING',
  currency: 'EUR',
  recipient: {
    city: 'Helsinki',
    name: 'Second Account',
    number: 'FI3379600112347627',
    address: 'Example address',
    country: 'FI',
    zip_code: '54321',
  },
  account_pid: 'SOXKOXRPNU3H51T0',
  remittance_information: { ustrd: 'Test transfer' },
}

const golden = (overrides = {}) => ({
  url: 'https://example.com/webhook/path?param1=abc&param2=123',
  secret: 'ws_A4OC2WMTNVUS2Q3DAED0JMHX3QK8CJUG7Z6BG71GQ41JU6JTPWRPD5RWYNFS8',
  payload: UNSORTED_PAYLOAD,
  headers: {
    'WEBHOOK-REQUEST-SIGNATURE': EXPECTED,
    'WEBHOOK-REQUEST-TIMESTAMP': '1739926662538',
    'WEBHOOK-REQUEST-EVENT-TYPE': 'transaction.created',
    'WEBHOOK-REQUEST-EVENT-PID': 'AH0867T9UUW61JXT',
  },
  ...overrides,
})

describe('webhooks: golden vector (matches the published Narvi example)', () => {
  test('signature() reproduces the documented hash', () => {
    const sig = Narvi.webhooks.signature({
      url: 'https://example.com/webhook/path',
      method: 'POST',
      nonce: '1739926662538',
      eventType: 'transaction.created',
      eventPID: 'AH0867T9UUW61JXT',
      queryParams: { param1: 'abc', param2: '123' },
      payload: UNSORTED_PAYLOAD,
      webhookSecret:
        'ws_A4OC2WMTNVUS2Q3DAED0JMHX3QK8CJUG7Z6BG71GQ41JU6JTPWRPD5RWYNFS8',
    })
    assert.equal(sig, EXPECTED)
  })

  test('verifySignature accepts the golden vector (payload object, query from url)', () => {
    assert.equal(Narvi.webhooks.verifySignature(golden()), true)
  })

  test('verifySignature accepts when payload is the raw (unsorted, pretty) body string', () => {
    const body = JSON.stringify(UNSORTED_PAYLOAD, null, 2)
    assert.equal(Narvi.webhooks.verifySignature(golden({ payload: body })), true)
  })

  test('header lookup is case-insensitive', () => {
    const headers = {
      'webhook-request-signature': EXPECTED,
      'webhook-request-timestamp': '1739926662538',
      'webhook-request-event-type': 'transaction.created',
      'webhook-request-event-pid': 'AH0867T9UUW61JXT',
    }
    assert.equal(Narvi.webhooks.verifySignature(golden({ headers })), true)
  })

  test('explicit fields work instead of a headers object', () => {
    assert.equal(
      Narvi.webhooks.verifySignature(
        golden({
          headers: undefined,
          signature: EXPECTED,
          timestamp: '1739926662538',
          eventType: 'transaction.created',
          eventPID: 'AH0867T9UUW61JXT',
        }),
      ),
      true,
    )
  })
})

describe('webhooks: rejects tampering (the verifier must discriminate)', () => {
  test('tampered payload -> false', () => {
    const payload = { ...UNSORTED_PAYLOAD, amount: 601 }
    assert.equal(Narvi.webhooks.verifySignature(golden({ payload })), false)
  })

  test('wrong secret -> false', () => {
    assert.equal(
      Narvi.webhooks.verifySignature(golden({ secret: 'ws_WRONG' })),
      false,
    )
  })

  test('tampered event type header -> false', () => {
    const headers = { ...golden().headers, 'WEBHOOK-REQUEST-EVENT-TYPE': 'transaction.updated' }
    assert.equal(Narvi.webhooks.verifySignature(golden({ headers })), false)
  })

  test('tampered timestamp -> false', () => {
    const headers = { ...golden().headers, 'WEBHOOK-REQUEST-TIMESTAMP': '0000000000000' }
    assert.equal(Narvi.webhooks.verifySignature(golden({ headers })), false)
  })

  test('tampered query params -> false', () => {
    assert.equal(
      Narvi.webhooks.verifySignature(
        golden({ url: 'https://example.com/webhook/path?param1=abc&param2=999' }),
      ),
      false,
    )
  })

  test('missing signature header -> false (not a throw)', () => {
    const headers = { ...golden().headers }
    delete headers['WEBHOOK-REQUEST-SIGNATURE']
    assert.equal(Narvi.webhooks.verifySignature(golden({ headers })), false)
  })

  test('malformed signature (wrong length) -> false, no throw', () => {
    const headers = { ...golden().headers, 'WEBHOOK-REQUEST-SIGNATURE': 'deadbeef' }
    assert.equal(Narvi.webhooks.verifySignature(golden({ headers })), false)
  })
})

describe('webhooks: round-trip + constructEvent', () => {
  test('round-trip: a freshly signed event verifies', () => {
    const url = 'https://my-app.example/hook'
    const nonce = '1700000000000'
    const eventType = 'entity.updated'
    const eventPID = 'EVT123ABC456DEF7'
    const secret = 'ws_roundtrip_secret_value'
    const payload = { pid: 'X', status: 'ACCEPTED', nested: { b: 2, a: 1 } }

    const signature = Narvi.webhooks.signature({
      url,
      nonce,
      eventType,
      eventPID,
      payload,
      webhookSecret: secret,
    })

    assert.equal(
      Narvi.webhooks.verifySignature({
        url,
        secret,
        payload,
        signature,
        timestamp: nonce,
        eventType,
        eventPID,
      }),
      true,
    )
  })

  test('constructEvent returns the typed event for a valid signature', () => {
    const event = Narvi.webhooks.constructEvent(golden())
    assert.equal(event.type, 'transaction.created')
    assert.equal(event.pid, 'AH0867T9UUW61JXT')
    assert.equal(event.timestamp, '1739926662538')
    assert.equal(event.payload.account_pid, 'SOXKOXRPNU3H51T0')
  })

  test('constructEvent throws NarviSignatureVerificationError on a bad signature', () => {
    const headers = { ...golden().headers, 'WEBHOOK-REQUEST-SIGNATURE': EXPECTED.replace('6', '7') }
    assert.throws(
      () => Narvi.webhooks.constructEvent(golden({ headers })),
      (err) => err instanceof Narvi.errors.NarviSignatureVerificationError,
    )
  })
})
