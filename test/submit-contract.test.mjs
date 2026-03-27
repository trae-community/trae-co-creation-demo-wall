import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const submitFormSource = fs.readFileSync(
  path.join(rootDir, 'src/app/[language]/submit/submission-form.tsx'),
  'utf8',
)
const step1Source = fs.readFileSync(
  path.join(rootDir, 'src/app/[language]/submit/steps/Step1BasicInfo.tsx'),
  'utf8',
)

test('submit form uses tag arrays to match the backend submit contract', () => {
  assert.match(submitFormSource, /tags:\s*z[\s\S]*\.array\(z\.number\(\)\)/)
  assert.doesNotMatch(submitFormSource, /tags:\s*z\.number\(\)/)
  assert.match(submitFormSource, /tags:\s*\[\]/)
  assert.match(step1Source, /tags:\s*number\[\]/)
})

test('submit form requires 3-5 highlights to match the backend submit contract', () => {
  assert.match(submitFormSource, /highlights:[\s\S]*\.min\(3,\s*t\('validationHighlightsMin'\)\)/)
  assert.match(submitFormSource, /highlights:[\s\S]*\.max\(5,\s*t\('validationHighlightsMax'\)\)/)
  assert.match(
    submitFormSource,
    /highlights:\s*\[\s*\{\s*value:\s*''\s*\},\s*\{\s*value:\s*''\s*\},\s*\{\s*value:\s*''\s*\}\s*\]/,
  )
})
