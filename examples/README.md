# Examples

Small, self-contained scripts that exercise the `narvi` library. Each file is standalone — run it directly with Node.

## Prerequisites

1. **Build the library once** (from the repository root) so the examples can resolve `narvi`:

   ```bash
   yarn install && yarn build
   ```

2. **Node.js 23.6+** runs the `.mts` files directly (it strips the TypeScript types on the fly). On Node 22.6–23.5
   add `--experimental-strip-types`:

   ```bash
   node examples/verify-webhook.mts                             # Node >= 23.6
   node --experimental-strip-types examples/verify-webhook.mts  # Node 22.6 - 23.5
   ```

3. **Credentials** for the examples that call the API. Copy `.env.example` to `.env`, fill it in, and either
   `export` the variables or pass the file to Node:

   ```bash
   node --env-file=examples/.env examples/list-accounts-with-balances.mts
   ```

## The examples

| File | What it does | Needs credentials |
| --- | --- | --- |
| `verify-webhook.mts` | Sign a webhook, then verify it and build the event (incl. a tampered-payload check) | No — runs offline |
| `challenge-signature.mts` | Generate a challenge signature with an ephemeral key | No — runs offline |
| `list-accounts-with-balances.mts` | List your accounts and print the balance of each | Yes |
| `create-transaction.mts` | Build a transaction payload and (optionally) send it | Yes |
| `upload-file.mts` | Upload a file via BaaS and read its metadata back | Yes |
| `list-baas-entities.mts` | List BaaS private and business entities | Yes |

Start with `verify-webhook.mts` and `challenge-signature.mts` — they need no credentials and run immediately.

## CommonJS or ES modules?

The examples use idiomatic ES module imports (`import Narvi from 'narvi'`) with the `.mts` extension, so they run
directly under Node. The package is dual-published, so a CommonJS project consumes it the same way with `require`:

```ts
import Narvi from 'narvi'      // ES modules
```

```js
const Narvi = require('narvi') // CommonJS
```

## Environment variables

| Variable | Used by | Description |
| --- | --- | --- |
| `NARVI_API_KEY_ID` | all live examples | API key ID from the [developer portal](https://my.narvi.com/app/developers/config/api-keys) |
| `NARVI_PRIVATE_KEY_PATH` | all live examples | Path to the PEM private key paired with the API key |
| `NARVI_API_ADDRESS` | all live examples | Optional API host override (defaults to `api.narvi.com`) |
| `NARVI_ACCOUNT_PID` | `create-transaction.mts` | Source account PID |
| `NARVI_CONFIRM_SEND` | `create-transaction.mts` | Must be `true` to actually send; otherwise the example is a dry run |
| `NARVI_WEBHOOK_SECRET` | `verify-webhook.mts` | Optional; falls back to a demo secret |

## Notes

- **`create-transaction.mts` is a dry run by default** and only prints the payload. Set `NARVI_CONFIRM_SEND=true`
  to actually move money.
- **`upload-file.mts`** uploads the path passed as the first argument, or a small in-memory file if none is given:

  ```bash
  node examples/upload-file.mts ./path/to/document.pdf
  ```

- `list()` resolves to a cursor page — `{ results, next, previous }` — which is why the list examples read
  `results` from the response.
