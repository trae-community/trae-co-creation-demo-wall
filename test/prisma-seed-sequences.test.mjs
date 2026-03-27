import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const seedSource = fs.readFileSync(path.join(rootDir, 'prisma/seed.ts'), 'utf8')

test('seed realigns imported table sequences before creating admin records', () => {
  assert.match(seedSource, /pg_get_serial_sequence/)
  assert.match(seedSource, /setval/)
  assert.match(seedSource, /Resetting imported table sequences/)

  const resetIndex = seedSource.indexOf('Resetting imported table sequences')
  const adminIndex = seedSource.indexOf('Initializing default admin user')

  assert.notEqual(resetIndex, -1)
  assert.notEqual(adminIndex, -1)
  assert.ok(resetIndex < adminIndex, 'sequence reset must happen before admin upsert')
})
