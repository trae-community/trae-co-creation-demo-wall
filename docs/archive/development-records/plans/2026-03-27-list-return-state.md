# List Return State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the full homepage list state when a user opens a work detail page and then uses the "back to list" action.

**Architecture:** Reuse the existing URL-based homepage state as the source of truth. Pass the current list URL into detail links via a `from` query parameter, then make the detail page back link prefer that explicit source over the generic homepage fallback.

**Tech Stack:** Next.js App Router, `next-intl` navigation helpers, Node.js `node:test` static source assertions.

---

### Task 1: Lock The Behavior With A Regression Test

**Files:**
- Create: `test/list-navigation-state.test.mjs`

- [ ] **Step 1: Write the failing test**

Assert that:
- `src/components/work/work-card.tsx` reads current search params and appends a `from` query parameter to detail links
- `src/app/[language]/works/[id]/work-detail-view.tsx` reads `from` and uses it for the back-to-list link

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/list-navigation-state.test.mjs`
Expected: FAIL because work cards currently link to `/works/${id}` and detail view currently hardcodes `/`

### Task 2: Pass The List URL Into Detail Navigation

**Files:**
- Modify: `src/components/work/work-card.tsx`

- [ ] **Step 1: Read current pathname and search params**

Use `usePathname()` and `useSearchParams()` to reconstruct the current list URL.

- [ ] **Step 2: Append the encoded list URL to the detail href**

Change the work card link target from `/works/${work.id}` to `/works/${work.id}?from=...`.

- [ ] **Step 3: Run regression test**

Run: `node --test test/list-navigation-state.test.mjs`
Expected: still FAIL until detail page back link is updated

### Task 3: Restore The Exact List State On Back Navigation

**Files:**
- Modify: `src/app/[language]/works/[id]/work-detail-view.tsx`

- [ ] **Step 1: Read the `from` search param**

Use `useSearchParams()` and resolve a safe fallback of `/`.

- [ ] **Step 2: Update the back-to-list link**

Use the resolved `from` value for the back link, preserving filters, search, sorting, and pagination.

- [ ] **Step 3: Run regression test**

Run: `node --test test/list-navigation-state.test.mjs`
Expected: PASS

- [ ] **Step 4: Re-run related seed regression**

Run: `npm run test:seed`
Expected: PASS
