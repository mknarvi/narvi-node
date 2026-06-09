import { build } from 'esbuild'
import { rmSync, mkdirSync, writeFileSync } from 'node:fs'

rmSync('esm', { recursive: true, force: true })
mkdirSync('esm', { recursive: true })

await build({
  entryPoints: ['src/narvi.esm.node.ts'],
  outfile: 'esm/narvi.esm.node.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  packages: 'external',
  keepNames: true,
  banner: {
    js: [
      "import { createRequire as nodeCreateRequire } from 'node:module'",
      'const require = nodeCreateRequire(import.meta.url)',
    ].join('\n'),
  },
})

writeFileSync('esm/package.json', '{"type":"module"}\n')
