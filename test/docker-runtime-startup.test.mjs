import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const entrypoint = fs.readFileSync(path.join(rootDir, 'entrypoint.sh'), 'utf8')
const dockerfile = fs.readFileSync(path.join(rootDir, 'Dockerfile'), 'utf8')

test('dockerfile uses a shared base stage and a configurable Debian mirror for apt', () => {
  assert.match(dockerfile, /^FROM .+ AS base$/m)
  assert.match(dockerfile, /^ARG DEBIAN_MIRROR=/m)
  assert.match(dockerfile, /sed -i .*debian\.sources/)
  assert.match(dockerfile, /http:\/\/\$\{DEBIAN_MIRROR\}\/debian/)
  assert.doesNotMatch(dockerfile, /https:\/\/\$\{DEBIAN_MIRROR\}\/debian/)
  assert.match(dockerfile, /^FROM base AS builder$/m)
  assert.match(dockerfile, /^FROM base AS runner$/m)
})

test('startup uses checked-in local Prisma and tsx CLIs instead of npx downloads', () => {
  assert.doesNotMatch(entrypoint, /npx\s+prisma/)
  assert.doesNotMatch(entrypoint, /npx\s+tsx/)
  assert.match(entrypoint, /RUN_DB_INIT/)
  assert.match(entrypoint, /node\s+node_modules\/prisma\/build\/index\.js\s+db\s+push/)
  assert.match(entrypoint, /node\s+node_modules\/tsx\/dist\/cli\.mjs\s+prisma\/seed\.ts/)
})

test('runner image copies the runtime-only CLI packages startup depends on', () => {
  assert.match(
    dockerfile,
    /COPY --from=builder \/app\/node_modules\/prisma \.\/node_modules\/prisma/,
  )
  assert.match(
    dockerfile,
    /COPY --from=builder \/app\/node_modules\/@prisma \.\/node_modules\/@prisma/,
  )
  assert.match(
    dockerfile,
    /COPY --from=builder \/app\/node_modules\/tsx \.\/node_modules\/tsx/,
  )
  assert.match(
    dockerfile,
    /COPY --from=builder \/app\/node_modules\/esbuild \.\/node_modules\/esbuild/,
  )
  assert.match(
    dockerfile,
    /COPY --from=builder \/app\/node_modules\/get-tsconfig \.\/node_modules\/get-tsconfig/,
  )
  assert.match(
    dockerfile,
    /COPY --from=builder \/app\/node_modules\/@esbuild \.\/node_modules\/@esbuild/,
  )
  assert.match(
    dockerfile,
    /COPY --from=builder \/app\/node_modules\/resolve-pkg-maps \.\/node_modules\/resolve-pkg-maps/,
  )
  assert.match(
    dockerfile,
    /COPY --from=builder \/app\/node_modules\/bcryptjs \.\/node_modules\/bcryptjs/,
  )
})
