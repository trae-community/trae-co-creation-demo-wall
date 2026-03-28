import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const workCardSource = fs.readFileSync(
  path.join(rootDir, 'src/components/work/work-card.tsx'),
  'utf8',
)
const detailViewSource = fs.readFileSync(
  path.join(rootDir, 'src/app/[language]/works/[id]/work-detail-view.tsx'),
  'utf8',
)

test('work cards carry the current list URL into detail navigation', () => {
  assert.match(workCardSource, /useSearchParams/)
  assert.match(workCardSource, /usePathname/)
  assert.match(workCardSource, /from ["']next\/navigation["']/)
  assert.match(workCardSource, /searchParams\.toString\(\)/)
  assert.match(workCardSource, /from=\$\{encodeURIComponent\(/)
})

test('detail view back link prefers the explicit source list URL', () => {
  assert.match(detailViewSource, /useSearchParams/)
  assert.match(detailViewSource, /searchParams\.get\('from'\)/)
  assert.match(detailViewSource, /onClick=\{\(\) => router\.push\(returnToListHref\)\}/)
})
