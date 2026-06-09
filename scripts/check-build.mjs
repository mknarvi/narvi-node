import { createRequire } from 'node:module'
import { generateKeyPairSync } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { writeFileSync, rmSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

const STATICS = [
  'getPaginationCursor',
  'getNarviRequestSignature',
  'getNarviChallengeSignature',
  'getNarviWebhookSignature',
  'webhooks',
]
const RESOURCES = ['accounts', 'transactions', 'baas']

let failures = 0
const check = (ok, label) => {
  console.log(`  ${ok ? '✓' : '✗'} ${label}`)
  if (!ok) failures += 1
}

const keyDir = mkdtempSync(join(tmpdir(), 'narvi-check-'))
writeFileSync(
  join(keyDir, 'key.pem'),
  generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey.export({
    type: 'pkcs8',
    format: 'pem',
  }),
)

function inspectEntry(Narvi, label) {
  check(typeof Narvi === 'function', `${label}: entry is the callable constructor`)
  for (const name of STATICS) {
    check(Narvi[name] != null, `${label}: static Narvi.${name}`)
  }
  const narvi = new Narvi({ apiKeyId: 'CHECK', privateKeyFilePath: join(keyDir, 'key.pem') })
  for (const name of RESOURCES) {
    check(narvi[name] != null && typeof narvi[name] === 'object', `${label}: resource narvi.${name}`)
  }
  check(typeof narvi.baas.files.upload === 'function', `${label}: narvi.baas.files.upload()`)
}

console.log('\nCommonJS build  (require)')
inspectEntry(require(join(root, 'cjs/narvi.cjs.node.js')), 'cjs')

console.log('\nESM build  (import)')
inspectEntry((await import(new URL('../esm/narvi.esm.node.js', import.meta.url))).default, 'esm')

console.log('\nType declarations  (tsc on a consumer fixture)')
const fixture = join(root, '__check-build-consumer.ts')
writeFileSync(
  fixture,
  [
    "import Narvi from 'narvi'",
    "const narvi = new Narvi({ apiKeyId: '', privateKeyFilePath: '' })",
    'void narvi.accounts.list()',
    'void narvi.baas.accounts.list()',
    "void narvi.baas.files.upload('x')",
    "const sig: string = Narvi.getNarviWebhookSignature({ url: '', method: 'POST', nonce: '', eventType: '', eventPID: '', webhookSecret: '' })",
    'void sig',
    '',
  ].join('\n'),
)
let typesOk = true
try {
  execFileSync(
    join(root, 'node_modules/.bin/tsc'),
    ['--noEmit', '--ignoreConfig', '--skipLibCheck', '--strict', '--module', 'esnext', '--moduleResolution', 'bundler', fixture],
    { cwd: root, stdio: 'pipe' },
  )
} catch (err) {
  typesOk = false
  process.stdout.write((err.stdout?.toString() || '') + (err.stderr?.toString() || ''))
} finally {
  rmSync(fixture, { force: true })
}
check(typesOk, 'consumer code type-checks against the published types')

rmSync(keyDir, { recursive: true, force: true })
console.log(
  failures
    ? `\nFAILED — ${failures} check(s) did not pass`
    : '\nOK — cjs, esm and type declarations load without errors',
)
process.exit(failures ? 1 : 0)
