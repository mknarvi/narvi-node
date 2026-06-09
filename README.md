# Narvi API Documentation

[![npm version](https://img.shields.io/npm/v/narvi.svg)](https://www.npmjs.com/package/narvi)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D12-brightgreen.svg)](https://nodejs.org/)

Welcome to the Narvi API documentation! This guide provides detailed information on using the Narvi API, which follows
REST principles for ease of integration. The Node.js library wraps the API and now covers:

- **Business Banking** — list and manage the accounts and transactions of your own Narvi account (`narvi.accounts`, `narvi.transactions`).
- **Banking-as-a-Service (BaaS)** — provision and manage entities, accounts, transactions, KYC files and challenges on behalf of your customers (`narvi.baas.*`).
- **Webhooks** — verify the signature of inbound events and turn them into typed event objects (`narvi.webhooks`).

Request signing — the double SHA-256 descriptor hash signed with your private key that every endpoint requires — is handled
**automatically** by the library, so you can call resources directly. Here are some key points to keep in mind:

## Table of Contents

- [API Basics](#api-basics)
- [Object Updates](#object-updates)
- [Installation](#installation)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Business Banking](#business-banking)
  - [Accounts](#accounts)
  - [Transactions](#transactions)
  - [Transaction payload](#transaction-payload)
  - [Verification of Payee (VOP)](#verification-of-payee-vop)
- [Banking-as-a-Service (BaaS)](#banking-as-a-service-baas)
  - [Private entities](#private-entities)
  - [Business entities](#business-entities)
  - [Business admins](#business-admins)
  - [BaaS accounts](#baas-accounts)
  - [BaaS transactions](#baas-transactions)
  - [Challenges and challenge signatures](#challenges-and-challenge-signatures)
  - [Files](#files)
- [Webhooks](#webhooks)
- [Pagination](#pagination)
- [Filtering](#filtering)
- [Helper reference](#helper-reference)

## API Basics

- **Resource-Oriented URLs**: The Narvi API uses resource-oriented URLs to structure endpoints.
- **JSON Request and Response**: You can send JSON-encoded request bodies and expect JSON-encoded responses.
- **Standard HTTP Codes**: Narvi utilizes standard HTTP response codes for indicating success or failure.
- **Authentication**: Authentication is handled using API keys and private keys, and the library signs every request for you.
- **Two product lines**: Business Banking endpoints live at the top level (`narvi.accounts`, `narvi.transactions`); Banking-as-a-Service endpoints are grouped under `narvi.baas.*`.

## Object Updates

Please note that the Narvi API does not support bulk updates. Each API request is designed to work on only one object at
a time.

## Installation

To get started with our Node.js library, run the following command to install it:

```bash
npm install --save narvi
```

The library requires **Node.js 12 or later** and ships both CommonJS and ES module builds together with TypeScript
type definitions, so it works out of the box in either module system:

```javascript
// CommonJS
const Narvi = require('narvi');

// ES modules / TypeScript
import Narvi from 'narvi';
```

## Authentication

Authentication for the Narvi API is crucial for security. We use API keys and private keys to verify requests. To manage
your API keys, visit our web application
at [https://my.narvi.com/app/developers/config/api-keys](https://my.narvi.com/app/developers/config/api-keys)

Remember, your API keys grant significant privileges, so keep them secure! Avoid sharing your secret API keys in
publicly accessible areas such as GitHub or client-side code.

To authenticate using our Node.js library, use the following code snippet:

```javascript
const Narvi = require('narvi');
const narvi = Narvi({
  apiKeyId: 'XXXXXXXX',
  privateKeyFilePath: './narvi_private.pem',
});
```

Once configured, the same `narvi` instance exposes every product line: `narvi.accounts`, `narvi.transactions`,
`narvi.baas.*` and `narvi.webhooks`.

## Error Handling

Narvi employs conventional HTTP response codes to indicate the success or failure of an API request. Here's a general
breakdown:

- Codes in the 2xx range indicate success.
- Codes in the 4xx range signify an error resulting from the provided information (e.g., missing required parameters,
  charge failure, etc.).
- Codes in the 5xx range denote server errors, although these are rare.

Here are some specific error codes and their meanings:

- **200 - OK**: Everything worked as expected.
- **400 - Bad Request**: The request was unacceptable, often due to missing a required parameter.
- **401 - Unauthorized**: No valid API key or private key provided, which caused the request to have a bad signature.
- **402 - Request Failed**: The parameters were valid, but the request failed.
- **403 - Forbidden**: The API key lacks permissions to perform the request.
- **404 - Not Found**: The requested resource doesn't exist.
- **409 - Conflict**: The request conflicts with another request, perhaps due to using the same idempotent key.
- **429 - Too Many Requests**: Too many requests hit the API too quickly. We recommend an exponential backoff for your
  requests.
- **500, 502, 503, 504 - Server Errors**: Something went wrong on Narvi's end.

Errors are thrown as typed exceptions. Each one exposes a `type` (the error class name) and a `statusCode` (the HTTP
status), so you can branch on the failure mode:

```javascript
try {
  await narvi.transactions.create(TRANSACTION_PAYLOAD)
} catch (err) {
  switch (err.type) {
    case 'NarviAuthenticationError': // 401 — invalid credentials or bad request signature
      break
    case 'NarviPermissionError':     // 403 — the API key lacks the required permission
      break
    case 'NarviRateLimitError':      // 429 — back off and retry with exponential backoff
      break
    default:                         // NarviAPIError (5xx / invalid JSON), NarviConnectionError, ...
      break
  }
}
```

## Business Banking

Narvi provides a range of API endpoints to interact with your account and perform transactions.

### Accounts

1. **List accounts** — Retrieve a list of accounts associated with your account.

   ```typescript
   const response = await narvi.accounts.list()
   ```

2. **Retrieve account** — Fetch detailed information about a specific account by providing its unique identifier.

   ```typescript
   const response = await narvi.accounts.retrieve(ACCOUNT_ID)
   ```

### Transactions

3. **List transactions** — Retrieve a list of transactions associated with a specific account.

   ```typescript
   const response = await narvi.transactions.list({ account_pid: ACCOUNT_ID })
   ```

4. **Retrieve transaction** — Access detailed information about a specific transaction using its unique identifier.

   ```typescript
   const response = await narvi.transactions.retrieve(TRANSACTION_ID)
   ```

5. **Create transaction** — Initiate a new transaction within the Narvi platform.

   ```typescript
   const response = await narvi.transactions.create(TRANSACTION_PAYLOAD)
   ```

6. **Update transaction** — Confirm or cancel a transaction that is being held for [Verification of Payee](#verification-of-payee-vop).

   ```typescript
   const response = await narvi.transactions.update(TRANSACTION_ID, { accept_vop: true })
   ```

### Transaction payload

To create a new transaction using the Narvi API, you'll need to provide a payload object with the following structure:

```typescript
interface TransactionPayload {
  account_pid: string; // Unique identifier for the Narvi account, e.g., 'A2ERSYBWO9KTC4I4'
  currency: string;    // Currency code, e.g., 'EUR'
  amount: number;      // Transaction amount in cents. For "EUR 120,00.99" it would be: 12099
  recipient: {
    name: string;      // Recipient's name, e.g. 'Simo Hayha'
    number: string;    // Recipient's bank account number e.g. 'FI4179600176830755'
    address: string    // Recipient's address, usually a street name with number, e.g., 'Lapinlahdenkatu 16'
    city: string;      // Recipient's city name, e.g., 'Helsinki'
    zip_code: string;  // Recipient's zip code, e.g., '00180'
    country: string;   // Recipient's country code, e.g., 'FI'
  };
  remittance_information: {
    ustrd: string;     // Transfer title, e.g., 'Payment for educational course'
  };
}
```

### Verification of Payee (VOP)

When you create a SEPA transaction, Narvi checks whether the recipient name matches the records held by the recipient's
bank. If the result is anything other than a full match (`MTCH`), the transaction is **held** with a `CREATED` status and
a `vop` object is returned (and delivered through the `vop.created` [webhook](#webhooks)):

```json
{
  "vop": {
    "match_type": "CMTC",
    "recipient_matching_name": "John Smith"
  }
}
```

You must then explicitly confirm or cancel the transaction. The library exposes this through `transactions.update`:

```typescript
// Accept the discrepancy and let the transfer proceed
await narvi.transactions.update(TRANSACTION_ID, { accept_vop: true })

// Reject — the transaction is cancelled
await narvi.transactions.update(TRANSACTION_ID, { accept_vop: false })
```

This endpoint only applies while the transaction is in `CREATED` status with a `match_type` other than `MTCH`. As an
alternative, you can respond to the `vop.created` webhook in real time (see the official
[VOP webhook guide](https://api.narvi.com/docs/business-banking/vop-webhook)).

## Banking-as-a-Service (BaaS)

Banking-as-a-Service lets you build your own banking product on top of Narvi: onboard private and business customers,
open accounts for them, move money, run KYC and respond to challenges. All BaaS endpoints are grouped under the
`narvi.baas.*` namespace and share the same authentication, pagination and error handling as the rest of the library.

```typescript
const { results } = await narvi.baas.accounts.list()
```

> The full request/response schema for every endpoint (including the KYC fields expected when creating entities) is
> documented in the [BaaS API reference](https://api.narvi.com/docs/baas/api).

### Private entities

A private entity represents an individual customer.

| Method | Description |
| --- | --- |
| `narvi.baas.privateEntities.create(params)` | Onboard a new private entity (KYC payload) |
| `narvi.baas.privateEntities.retrieve(pid)` | Retrieve a private entity |
| `narvi.baas.privateEntities.update(pid, params)` | Update a private entity |
| `narvi.baas.privateEntities.list(params?)` | List private entities (paginated) |
| `narvi.baas.privateEntities.settingsUpdateInit(params)` | Start a challenge-protected settings update |
| `narvi.baas.privateEntities.settingsUpdateComplete(params)` | Submit the signed challenge |
| `narvi.baas.privateEntities.settingsUpdateFinish(params)` | Finalize the settings update |

```typescript
const entity = await narvi.baas.privateEntities.create({
  first_name: 'Simo',
  last_name: 'Hayha',
  email: 'simo@example.com',
  // ...remaining KYC fields, see the BaaS API reference
})

const { results } = await narvi.baas.privateEntities.list()
```

Sensitive changes are guarded by a challenge (`settingsUpdateInit` → sign → `settingsUpdateComplete` →
`settingsUpdateFinish`); see [Challenges and challenge signatures](#challenges-and-challenge-signatures).

### Business entities

A business entity represents a company customer.

| Method | Description |
| --- | --- |
| `narvi.baas.businessEntities.create(params)` | Onboard a new business entity |
| `narvi.baas.businessEntities.retrieve(pid)` | Retrieve a business entity |
| `narvi.baas.businessEntities.update(pid, params)` | Update a business entity |
| `narvi.baas.businessEntities.list(params?)` | List business entities (paginated) |

### Business admins

Administrators (natural persons) authorized to act on behalf of a business entity.

| Method | Description |
| --- | --- |
| `narvi.baas.businessAdmins.add(businessPid, params)` | Add an admin to a business entity |
| `narvi.baas.businessAdmins.delete(businessPid, adminPid)` | Remove an admin |
| `narvi.baas.businessAdmins.list(businessPid)` | List the admins of a business entity (paginated) |

```typescript
await narvi.baas.businessAdmins.add(BUSINESS_PID, {
  first_name: 'Aino',
  last_name: 'Virtanen',
  email: 'aino@example.com',
})

const { results } = await narvi.baas.businessAdmins.list(BUSINESS_PID)
```

### BaaS accounts

Accounts opened for your BaaS customers.

| Method | Description |
| --- | --- |
| `narvi.baas.accounts.create(params)` | Open an account for an entity |
| `narvi.baas.accounts.retrieve(pid)` | Retrieve an account |
| `narvi.baas.accounts.update(pid, params)` | Update an account |
| `narvi.baas.accounts.list(params?)` | List accounts (paginated) |
| `narvi.baas.accounts.balance(pid, date)` | Retrieve the account balance on a given date |

```typescript
const account = await narvi.baas.accounts.create({
  owner_pid: ENTITY_PID,
  owner_kind: 'PRIVATE', // or 'BUSINESS'
  currency: 'EUR',
})

const balance = await narvi.baas.accounts.balance(account.pid, '2026-06-01')
```

### BaaS transactions

Move money between BaaS accounts and external recipients.

| Method | Description |
| --- | --- |
| `narvi.baas.transactions.create(params)` | Create a transaction |
| `narvi.baas.transactions.retrieve(pid)` | Retrieve a transaction |
| `narvi.baas.transactions.list(params)` | List transactions for an account (paginated) |

```typescript
const transaction = await narvi.baas.transactions.create({
  account_pid: ACCOUNT_PID,
  currency: 'EUR',
  kind: 'DEBIT', // or 'FEE'
  amount: 12099, // amount in cents
  recipient: {
    name: 'Simo Hayha',
    number: 'FI4179600176830755',
    country: 'FI',
  },
  remittance_information: { ustrd: 'Payment for educational course' },
})

const { results } = await narvi.baas.transactions.list({ account_pid: ACCOUNT_PID })
```

### Challenges and challenge signatures

Some sensitive BaaS operations (for example updating a private entity's settings) are protected by a **challenge**: Narvi
issues a one-time code over email or SMS that you must confirm with a signature generated from your private key.

```typescript
// 1. Retrieve the challenge issued by the API (e.g. after settingsUpdateInit)
const challenge = await narvi.baas.challenges.retrieve(CHALLENGE_PID)
// challenge -> { pid, kind: 'EMAIL' | 'SMS', target, number, ... }

// 2. Sign it with your private key
const signature = Narvi.getNarviChallengeSignature({
  privateKey,                 // a crypto.KeyObject, e.g. crypto.createPrivateKey({ key: pem })
  challengePid: challenge.pid,
  target: challenge.target,   // the email or phone number the code was sent to
  privatePid: PRIVATE_ENTITY_PID,
})

// 3. Submit the signature to complete the protected operation
```

The signature is `base64( sign('sha256', sha256(challengePid + target + privatePid)) )` — the same scheme the library
uses internally for request signing.

### Files

KYC and supporting documents are uploaded as files and referenced by their `pid`. There is **no `list` endpoint** for
files — keep track of the `pid` values returned by `upload`.

| Method | Description |
| --- | --- |
| `narvi.baas.files.upload(file, options?)` | Upload a file (multipart) |
| `narvi.baas.files.retrieve(pid)` | Retrieve file metadata |
| `narvi.baas.files.download(pid)` | Download the raw file contents |

`upload` accepts a filesystem path, a `Buffer`/`Uint8Array`, a readable stream, or an object that lets you override the
name and content type:

```typescript
// From a path (the file name is derived from the path)
const file = await narvi.baas.files.upload('./documents/passport.pdf')
// file -> { pid, name, size, mimetype }

// Override the file name / content type
await narvi.baas.files.upload({
  file: './documents/passport.pdf',
  name: 'passport.pdf',
  type: 'application/pdf',
})

// From a Buffer or stream
await narvi.baas.files.upload({ file: { data: buffer, name: 'id.jpg' } })
await narvi.baas.files.upload({ file: { data: fs.createReadStream('./id.jpg'), name: 'id.jpg' } })
```

The signature for an upload is computed over the SHA-256 hash of the file content, and the request is sent as
`multipart/form-data` — the library handles both for you. The stored `mimetype` is detected by Narvi from the file
content, so the `type` you pass is advisory.

Retrieve metadata and download the bytes:

```typescript
const metadata = await narvi.baas.files.retrieve(file.pid)   // { pid, name, size, mimetype }
const contents = await narvi.baas.files.download(file.pid)   // raw file bytes
fs.writeFileSync('./passport.pdf', contents)
```

## Webhooks

Narvi can notify your application about events (such as `transaction.created`, `transaction.updated`, `vop.created`,
`entity.updated` and `change_request.updated`) by sending a signed HTTP request to your webhook endpoint. The library
verifies these signatures so you can trust the payload before acting on it.

A webhook signature is `sha256(hex)` of the request descriptor concatenated with your webhook secret (it is **not** an
HMAC). The verification is constant-time and reads the `WEBHOOK-REQUEST-*` headers case-insensitively.

Use `narvi.webhooks.constructEvent` to verify and parse an event in one step — it throws a
`NarviSignatureVerificationError` if the signature does not match:

```typescript
const express = require('express')
const app = express()

// Capture the raw body so the signature can be verified
app.post('/narvi/webhooks', express.json({ verify: (req, _res, buf) => (req.rawBody = buf) }), (req, res) => {
  let event
  try {
    event = narvi.webhooks.constructEvent({
      url: `https://your-app.com${req.originalUrl}`, // full URL, including any query string
      method: 'POST',
      headers: req.headers,                          // WEBHOOK-REQUEST-* are read case-insensitively
      payload: req.rawBody.toString(),               // raw string or already-parsed object
      secret: process.env.NARVI_WEBHOOK_SECRET,
    })
  } catch (err) {
    return res.status(400).send('Webhook signature verification failed')
  }

  switch (event.type) {
    case 'transaction.created':
      // event.pid, event.timestamp, event.payload
      break
    case 'vop.created':
      // a transaction is held pending Verification of Payee
      break
    // entity.updated, change_request.updated, ...
  }

  res.json({ received: true })
})
```

If you only need a boolean, use `narvi.webhooks.verifySignature(params)` (same parameters, returns `true`/`false` and
never throws). To recompute a signature yourself, use `narvi.webhooks.signature(params)` (also exposed as the static
`Narvi.getNarviWebhookSignature(params)`).

## Pagination

Narvi's API incorporates a robust pagination system that is designed to efficiently handle large datasets. This system utilizes cursor-based pagination, allowing you to navigate through lists of resources with ease. To work with the pagination system, you'll primarily interact with the `ApiSearchResult` interface, which is used for paginated responses, and the `RangeQueryParam` interface, which is used for filtering resources within a specific range. Every `list()` method (Business Banking and BaaS alike) returns this shape.

### Pagination with `ApiSearchResult`

The `ApiSearchResult` interface defines the structure of paginated responses in Narvi's API. Here are its key properties:

- `results`: An array containing the current page of results. These are the resources you requested. Maximum of 20 items per one request.

- `next`: The absolute URL with a cursor token to use when fetching the next page of results. If `next` is `null`, it indicates that there are no further results to retrieve.

- `previous`: The absolute URL with a cursor token to use when fetching the previous page of results. If `previous` is `null`, it means you are on the first page of results.

### Using cursors to retrieve resources

#### Retrieving the next page

To retrieve the next page of results, you can use the `next` cursor token provided in the `ApiSearchResult`. Here's an example of how to use it:

```typescript
const nextPageUrl = response.next; // an absolute URL to fetch the next page
const nextPageCursor = Narvi.getPaginationCursor(nextPageUrl); // Helper function to extract the cursor query param from the url
const nextPageResponse = await narvi.someEndpoint.list({ cursor: nextPageCursor });
```

This code fetches the next page of results using the `next` cursor obtained from the previous response.

#### Starting from a specific cursor

If you want to start fetching resources from a specific cursor obtained from a previous `ApiSearchResult` query, you can directly pass that cursor to the `.list({ cursor: string })` endpoint. Here's how to do it:

```typescript
const specificCursor = // Your specific cursor obtained from a previous response;
const specificCursorResponse = await narvi.someEndpoint.list({ cursor: specificCursor });
```

By using the cursor, you can pinpoint the exact position in the paginated dataset to begin fetching resources, providing fine-grained control over your data retrieval process.

## Filtering

Additionally, Narvi's API provides the `RangeQueryParam` interface, which you can use to filter resources based on specific criteria such as date range or amount range. These filters can be applied when making requests to certain endpoints that support filtering.

**Timestamp values must be Unix timestamps in milliseconds passed as strings**
(13-digit numbers stringified, e.g. `'1669815899170'`). This matches the
[OpenAPI specification](https://api.narvi.com/docs/business-banking/api) and the
[narvi-python SDK](https://github.com/narvicom/narvi-python), and is required for
the request signature to validate server-side.

Example usage for filtering based on date range:

```typescript
const response = await narvi.someFilteredEndpoint.list({
  added__gte: startTime,  // Unix timestamp in milliseconds, as string
  added__lte: endTime,    // Unix timestamp in milliseconds, as string
});

// Example - return all CREDIT transactions for a specific account between a date range
const response = await narvi.transactions.list({
  account_pid: 'KFGKJ5L27ASGTZAO',
  kind: 'CREDIT',
  added__gte: '1669815899170',
  added__lte: '1669815899360',
});
```

You can customize the filter criteria according to your application's needs.

By leveraging the pagination system, cursor-based navigation, and filtering capabilities, you can efficiently manage and retrieve the data you require from Narvi's API while ensuring a smooth user experience in your application.

## Helper reference

In addition to the resource methods, the library exposes a few static and instance helpers:

| Helper | Returns | Use |
| --- | --- | --- |
| `Narvi.getPaginationCursor(url)` | `string` | Extract the `cursor` query parameter from a `next`/`previous` URL |
| `Narvi.getNarviChallengeSignature(params)` | `string` (base64) | Sign a BaaS challenge to authorize a protected operation |
| `Narvi.getNarviWebhookSignature(params)` | `string` (hex) | Recompute a webhook signature manually |
| `narvi.webhooks.verifySignature(params)` | `boolean` | Verify an inbound webhook signature (constant-time, never throws) |
| `narvi.webhooks.constructEvent(params)` | `NarviWebhookEvent` | Verify and parse an inbound webhook (throws on mismatch) |

The `webhooks` helpers are available both on the instance (`narvi.webhooks`) and statically (`Narvi.webhooks`).

For more details and examples, please refer to our official [Narvi API documentation](https://api.narvi.com/).

Happy integrating with Narvi! 🚀
