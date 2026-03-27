import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const compose2c8g = fs.readFileSync(
  path.join(rootDir, 'docker-compose.2c8g.yml'),
  'utf8',
)
const composeProd = fs.readFileSync(
  path.join(rootDir, 'docker-compose.prod.yml'),
  'utf8',
)

for (const [name, source, appNames] of [
  ['2c8g', compose2c8g, ['app-1', 'app-2']],
  ['prod', composeProd, ['app-1', 'app-2', 'app-3', 'app-4']],
]) {
  test(`${name} compose uses an explicit one-shot app-init service`, () => {
    assert.match(source, /\n\s{2}app-init:\n/)
    assert.match(source, /RUN_DB_INIT:\s*"true"|RUN_DB_INIT=true/)
    assert.match(source, /NEXTAUTH_URL:\s*\$\{NEXTAUTH_URL\}|NEXTAUTH_URL=\$\{NEXTAUTH_URL\}/)
    assert.doesNotMatch(source, /NEXTAUTH_URL=http:\/\/localhost/)
    assert.match(source, /x-app-service:[\s\S]*RUN_DB_INIT:\s*"false"/)
    assert.match(source, /x-app-service:[\s\S]*service_completed_successfully/)

    for (const appName of appNames) {
      assert.match(source, new RegExp(`\\n\\s{2}${appName}:\\n`))
    }
  })
}
