import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const packageJson = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'),
)
const packageLock = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'package-lock.json'), 'utf8'),
)

test('docker builder declares the Linux glibc parcel watcher binary', () => {
  assert.equal(
    packageJson.optionalDependencies?.['@parcel/watcher-linux-x64-glibc'],
    '2.5.6',
  )

  assert.equal(
    packageLock.packages?.['node_modules/@parcel/watcher-linux-x64-glibc']
      ?.version,
    '2.5.6',
  )
})

test('docker builder declares the Linux glibc swc binary used by next-intl', () => {
  assert.equal(
    packageJson.optionalDependencies?.['@swc/core-linux-x64-gnu'],
    '1.15.18',
  )

  assert.equal(
    packageLock.packages?.['node_modules/@swc/core-linux-x64-gnu']?.version,
    '1.15.18',
  )
})
