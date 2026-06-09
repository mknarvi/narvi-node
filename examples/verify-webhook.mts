import Narvi from 'narvi'

const WEBHOOK_SECRET =
  process.env.NARVI_WEBHOOK_SECRET || 'ws_demo_secret_replace_with_your_own'

const url = 'https://your-app.com/narvi/webhooks'
const method = 'POST'
const eventType = 'transaction.created'
const eventPID = 'AH0867T9UUW61JXT'
const nonce = '1739926662538'
const payload = {
  pid: '7C7Y2WH6A0752IDH',
  account_pid: 'SOXKOXRPNU3H51T0',
  amount: 600,
  currency: 'EUR',
  kind: 'DEBIT',
  status: 'PENDING',
}

const signature = Narvi.getNarviWebhookSignature({
  url,
  method,
  nonce,
  eventType,
  eventPID,
  payload,
  webhookSecret: WEBHOOK_SECRET,
})

const headers = {
  'WEBHOOK-REQUEST-SIGNATURE': signature,
  'WEBHOOK-REQUEST-TIMESTAMP': nonce,
  'WEBHOOK-REQUEST-EVENT-TYPE': eventType,
  'WEBHOOK-REQUEST-EVENT-PID': eventPID,
}

const verifyParams = {
  url,
  method,
  headers,
  payload,
  secret: WEBHOOK_SECRET,
}

console.log('Signature is valid:', Narvi.webhooks.verifySignature(verifyParams))

const event = Narvi.webhooks.constructEvent(verifyParams)
console.log('Event type:', event.type)
console.log('Event pid: ', event.pid)
console.log('Payload:   ', event.payload)

try {
  Narvi.webhooks.constructEvent({
    ...verifyParams,
    payload: { ...payload, amount: 999999 },
  })
  console.log('Tampered payload: unexpectedly accepted')
} catch {
  console.log('Tampered payload: rejected (as expected)')
}
