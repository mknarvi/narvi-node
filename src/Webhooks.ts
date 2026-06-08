import * as crypto from 'crypto'
import * as qs from 'qs'
import { NarviSignatureVerificationError } from './errors/Errors'
import { getNarviWebhookSignature, getQueryFromUrl } from './utils/utils'
import { RequestData } from './Types'

const WEBHOOK_HEADER = {
  signature: 'webhook-request-signature',
  timestamp: 'webhook-request-timestamp',
  eventType: 'webhook-request-event-type',
  eventPID: 'webhook-request-event-pid',
}

type WebhookHeaders = Record<string, string | Array<string> | undefined>

export interface WebhookVerifyParams {
  url: string
  method?: string
  payload?: string | RequestData
  queryParams?: RequestData
  secret: string
  headers?: WebhookHeaders
  signature?: string
  timestamp?: string
  eventType?: string
  eventPID?: string
}

export interface NarviWebhookEvent {
  type: string
  pid: string
  timestamp: string
  payload: RequestData
}

function headerValue(
  headers: WebhookHeaders | undefined,
  name: string,
): string | undefined {
  if (!headers) {
    return undefined
  }
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === name) {
      const value = headers[key]
      return Array.isArray(value) ? value[0] : value
    }
  }
  return undefined
}

function resolveParts(params: WebhookVerifyParams) {
  const signature =
    params.signature ?? headerValue(params.headers, WEBHOOK_HEADER.signature)
  const nonce =
    params.timestamp ?? headerValue(params.headers, WEBHOOK_HEADER.timestamp)
  const eventType =
    params.eventType ?? headerValue(params.headers, WEBHOOK_HEADER.eventType)
  const eventPID =
    params.eventPID ?? headerValue(params.headers, WEBHOOK_HEADER.eventPID)

  const payload =
    typeof params.payload === 'string'
      ? params.payload.length
        ? JSON.parse(params.payload)
        : undefined
      : params.payload

  let queryParams = params.queryParams
  if (queryParams === undefined) {
    const query = getQueryFromUrl(params.url)
    queryParams = query ? (qs.parse(query) as RequestData) : undefined
  }

  return { signature, nonce, eventType, eventPID, payload, queryParams }
}

function safeHexCompare(a: string, b: unknown): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false
  }
  if (a.length === 0 || a.length !== b.length) {
    return false
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
  } catch {
    return false
  }
}

function verifySignature(params: WebhookVerifyParams): boolean {
  const { signature, nonce, eventType, eventPID, payload, queryParams } =
    resolveParts(params)

  if (!signature || !nonce || !eventType || !eventPID) {
    return false
  }

  const expected = getNarviWebhookSignature({
    url: params.url,
    method: params.method,
    nonce,
    eventType,
    eventPID,
    queryParams,
    payload,
    webhookSecret: params.secret,
  })

  return safeHexCompare(expected, signature)
}

function constructEvent(params: WebhookVerifyParams): NarviWebhookEvent {
  const { signature, nonce, eventType, eventPID, payload } =
    resolveParts(params)

  if (!verifySignature(params)) {
    throw new NarviSignatureVerificationError(
      String(signature ?? ''),
      typeof params.payload === 'string'
        ? params.payload
        : JSON.stringify(params.payload ?? ''),
      {
        message:
          'Webhook signature verification failed: the computed signature does not match WEBHOOK-REQUEST-SIGNATURE.',
      },
    )
  }

  return {
    type: eventType as string,
    pid: eventPID as string,
    timestamp: nonce as string,
    payload: payload as RequestData,
  }
}

export const webhooks = {
  signature: getNarviWebhookSignature,
  verifySignature,
  constructEvent,
}
