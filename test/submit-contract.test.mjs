import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const submitFormSource = fs.readFileSync(
  path.join(rootDir, 'src/app/[language]/submit/submission-form.tsx'),
  'utf8',
)
const submitApiSource = fs.readFileSync(
  path.join(rootDir, 'src/app/api/submit/route.ts'),
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

test('submit form requires 1-5 highlights to match the backend submit contract', () => {
  assert.match(submitFormSource, /highlights:[\s\S]*\.min\(1,\s*t\('validationHighlightsMin'\)\)/)
  assert.match(submitFormSource, /highlights:[\s\S]*\.max\(5,\s*t\('validationHighlightsMax'\)\)/)
  assert.match(
    submitFormSource,
    /highlights:\s*\[\s*\{\s*value:\s*''\s*\}\s*\]/,
  )
})

test('submit success screen navigates away from the old form instead of reopening it for duplicate submission', () => {
  assert.match(submitFormSource, /submittedWorkId/)
  assert.match(submitFormSource, /setSubmittedWorkId\(result\.id\)/)
  assert.match(submitFormSource, /t\('viewProject'\)/)
  assert.match(submitFormSource, /t\('backHome'\)/)
  assert.doesNotMatch(submitFormSource, /window\.location\.reload\(\)/)
  assert.doesNotMatch(submitFormSource, /setIsSubmitted\(false\)/)
  assert.doesNotMatch(submitFormSource, /t\('continueSubmit'\)/)
  assert.doesNotMatch(submitFormSource, /t\('viewSubmission'\)/)
})

test('submit form requires team intro and rejects empty team members at both frontend and api contract', () => {
  assert.match(
    submitFormSource,
    /team:\s*z[\s\S]*\.array\(z\.object\(\{\s*value:\s*z\.string\(\)\.min\(1,\s*t\('validationTeamMemberRequired'\)\)\s*\}\)\)\s*\.min\(1,\s*t\('validationTeamMin'\)\)/,
  )
  assert.match(
    submitFormSource,
    /teamIntro:\s*z\.string\(\)\.min\(1,\s*t\('validationTeamIntro'\)\)/,
  )
  assert.match(
    submitApiSource,
    /team:\s*z\.string\(\)\.refine\(/,
  )
  assert.match(
    submitApiSource,
    /JSON\.parse\(value\)/,
  )
  assert.match(
    submitApiSource,
    /typeof member === ['"]string['"] && member\.trim\(\)\.length > 0/,
  )
  assert.match(
    submitApiSource,
    /teamIntro:\s*z\.string\(\)\.min\(1\)/,
  )
})
