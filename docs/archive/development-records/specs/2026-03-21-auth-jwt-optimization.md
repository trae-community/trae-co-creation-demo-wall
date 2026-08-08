# Auth Optimization: Trust Clerk JWT (方案 A)

**Date**: 2026-03-21
**Status**: Reviewed & Updated

## Background

Every API request currently calls `getOrSyncUser()` which:
1. Calls `currentUser()` → network round-trip to Clerk servers
2. Calls `prisma.sysUser.findUnique()` → DB read
3. Calls `prisma.sysUser.upsert()` → DB write (every single request)
4. Sometimes calls `clerkClient().users.updateUserMetadata()` → another Clerk network call

Additionally `SiteLayout` (rendered on every page) unconditionally calls `fetch('/api/profile')` to determine nav visibility, triggering the full chain above on every page load.

## Goal

- Remove per-request Clerk network calls entirely
- Remove per-request DB upsert
- Keep user data eventually consistent via Clerk Webhooks
- Keep `/api/works` dict data from hitting DB on every request

## Approach: Trust Clerk JWT

Clerk signs a JWT for each session. The JWT's `publicMetadata` already contains `roles` and `userId` (we sync this in `auth.ts`). We read identity from the JWT locally (no network) via `auth()` from `@clerk/nextjs/server`.

User data sync moves to a Webhook handler triggered by Clerk on `user.created` and `user.updated` events.

## Architecture

### Before

```
Request → middleware (clerkMiddleware) → API handler
                                           └─ getOrSyncUser()
                                                ├─ currentUser() ←→ Clerk Network
                                                ├─ DB findUnique
                                                └─ DB upsert
```

### After

```
Request → middleware (clerkMiddleware, JWT verified locally)
        → API handler
             └─ getAuthUser()  ← reads auth() from local JWT, no network
                  └─ (optional) DB findUnique for non-JWT data (bio, phone)

Clerk event → /api/webhooks/clerk → DB upsert (only when user actually changes)
```

---

## Implementation Plan

### Step 1 — New `getAuthUser()` in `src/lib/auth.ts`

Replace `getOrSyncUser()` with a new `getAuthUser()` function:

```ts
// Returns identity from JWT claims — zero network calls
export async function getAuthUser(): Promise<AuthUser | null>
```

`AuthUser` shape:
```ts
type AuthUser = {
  clerkId: string
  userId: bigint | null  // null if webhook hasn't fired yet (first login race window)
  roles: string[]        // from JWT publicMetadata.roles
}
```

Implementation details:
- Uses `auth()` from `@clerk/nextjs/server` (reads local JWT — no network)
- Reads `sessionClaims.publicMetadata.userId` (stored as string, convert via `BigInt(userId)`) and `sessionClaims.publicMetadata.roles`
- **Returns `null` if not authenticated** (no `userId` in JWT yet → also return `null` to be safe)
- The `userId` string→bigint conversion must be explicit: `BigInt(sessionClaims.publicMetadata.userId as string)`
- No DB call, no Clerk network call

**First-login edge case**: Between `user.created` webhook firing and Clerk writing `userId` back to `publicMetadata`, `userId` will be absent from the JWT. `getAuthUser()` returns `null` in this case. API routes that need `userId` (e.g. `/api/submit`) respond with HTTP 503 "Account setup in progress, please retry in a moment."

Keep `getOrSyncUser()` but rename it to `syncUserFromClerk()` — used only by the Webhook handler.

### Step 2 — Clerk Webhook handler `src/app/api/webhooks/clerk/route.ts`

New file. Handles:
- `user.created` → create SysUser + assign `common` role + write auth log
- `user.updated` → update email/username/avatarUrl in SysUser
- `session.created` (optional) → update `lastSignInAt`

Uses `svix` (already in dependencies) to verify the webhook signature with `CLERK_WEBHOOK_SECRET`.

Must be excluded from clerkMiddleware auth protection (it's a public endpoint).

### Step 3 — Update all API routes to use `getAuthUser()`

Files to update:
- `src/app/api/submit/route.ts` — replace `getOrSyncUser()` with `getAuthUser()`
- `src/app/api/profile/route.ts` — replace `getOrSyncUser()` with `getAuthUser()`, fetch user from DB by `userId` for profile data
- `src/app/api/users/route.ts` — replace `getOrSyncUser()` with `getAuthUser()` for operator logging
- `src/app/api/roles/route.ts` — replace `getOrSyncUser()` with `getAuthUser()` for operator logging

For `profile/route.ts` specifically:
- GET: after `getAuthUser()` returns `userId`, do a single `prisma.sysUser.findUnique()` to get `bio`/`phone`/etc. — but no upsert. Also remove the second independent `currentUser()` call on line 93 that reads `profileCountry`/`profileCity` from Clerk metadata. Replace it with reading from `auth().sessionClaims.publicMetadata` directly.
- PUT: same — replace `getOrSyncUser()` with `getAuthUser()`, and replace the second `currentUser()` call on line 156 with `auth().sessionClaims`.

### Step 4 — Fix `SiteLayout`: remove `/api/profile` fetch for role check

`site-layout.tsx` currently fetches `/api/profile` in `useEffect` only to get `roles`.

Replace with Clerk's client-side `useAuth()` hook:
```ts
const { sessionClaims } = useAuth()
const roles = (sessionClaims?.publicMetadata?.roles as string[]) ?? []
const showConsole = roles.some(r => r === 'root' || r === 'admin')
```

This reads from the local JWT in memory — zero network call.

### Step 5 — Fix `console/layout.tsx`: replace full role logic

The current `console/layout.tsx` fetches `/api/profile` and stores `{ id: number; roleCode: string }[]`. After migration, the shape changes entirely.

Replace the `fetch('/api/profile')` with `useAuth().sessionClaims`:
```ts
const { sessionClaims } = useAuth()
const roles = (sessionClaims?.publicMetadata?.roles as string[]) ?? []
```

Then rewrite all role checks throughout the file to use roleCode strings:
- `isRoot`: `roles.includes('root')` (was: `role.id === 1`)
- `isAdmin`: `roles.includes('admin')` (was: `role.id === 2`)
- `allowedItems` filtering: unchanged logic, just roleCode-based gate

Remove the `userRoles` state, `isLoading` state, and the `useEffect` that fetches `/api/profile`. The `isLoading` guard (`if (isLoading) return null`) is also removed — role data is available synchronously from `sessionClaims`.

### Step 6 — Add dict caching to `/api/works`

Wrap only the raw `prisma.sysDict.findUnique()` calls with Next.js `unstable_cache` (TTL 300s). The cache boundary stops **before** `resolveLabelMap()` — that function is language-dependent and must run per-request with the current `lang` param.

```ts
const getRawDictionaries = unstable_cache(
  async () => {
    const [countryDict, cityDict, categoryDict, honorDict] = await Promise.all([
      prisma.sysDict.findUnique({ where: { dictCode: 'country' }, include: { items: true } }),
      prisma.sysDict.findUnique({ where: { dictCode: 'city' }, include: { items: true } }),
      prisma.sysDict.findUnique({ where: { dictCode: 'category_code' }, include: { items: true } }),
      prisma.sysDict.findUnique({ where: { dictCode: 'honor_type' }, include: { items: true } }),
    ])
    return { countryDict, cityDict, categoryDict, honorDict }
  },
  ['works-raw-dicts'],
  { revalidate: 300 }
)

// Then per-request:
const { countryDict, cityDict, categoryDict, honorDict } = await getRawDictionaries()
const countryLabelMap = resolveLabelMap(countryDict?.items ?? [], lang)
// etc.
```

### Step 7 — Update middleware to exclude webhook route

In `middleware.ts`, add `/api/webhooks(.*)` to the list of unprotected routes so Clerk doesn't block incoming webhook requests.

### Step 8 — Environment variable + Clerk Dashboard setup

Add `CLERK_WEBHOOK_SECRET` to `.env.local`.

In Clerk Dashboard:
- Create Webhook endpoint pointing to `<domain>/api/webhooks/clerk`
- Subscribe to: `user.created`, `user.updated`

---

## File Change Summary

| File | Change |
|------|--------|
| `src/lib/auth.ts` | Add `getAuthUser()`, keep `syncUserFromClerk()` for webhook use |
| `src/app/api/webhooks/clerk/route.ts` | **New file** — Clerk webhook handler |
| `src/app/api/submit/route.ts` | `getOrSyncUser()` → `getAuthUser()` |
| `src/app/api/profile/route.ts` | `getOrSyncUser()` → `getAuthUser()` + DB read by userId |
| `src/app/api/users/route.ts` | `getOrSyncUser()` → `getAuthUser()` |
| `src/app/api/roles/route.ts` | `getOrSyncUser()` → `getAuthUser()` |
| `src/components/layout/site-layout.tsx` | Remove `fetch('/api/profile')`, use `useAuth().sessionClaims` |
| `src/app/[language]/console/layout.tsx` | Remove `fetch('/api/profile')`, use `useAuth().sessionClaims` |
| `src/app/api/works/route.ts` | Wrap dict queries with `unstable_cache` |
| `src/middleware.ts` | Add `/api/webhooks(.*)` to public routes |
| `.env.local` | Add `CLERK_WEBHOOK_SECRET=...` |

---

## Key Decisions

### Why not remove DB lookup from profile API?
Profile data (`bio`, `phone`, work list) is not in the JWT. For `/api/profile` GET, we still need one `findUnique` — but we go from `findUnique + upsert + Clerk network` → just `findUnique`.

### Why role check uses roleCode not role.id?
`site-layout.tsx` currently checks `role.id === 1 || role.id === 2`. JWT `publicMetadata.roles` stores `roleCode` strings (e.g. `"root"`, `"admin"`). We update the check to use `roleCode`.

Requires confirming the roleCodes in the database: based on `auth.ts` which syncs `role.roleCode` to Clerk metadata.

### First-time login
With Webhooks, user creation happens asynchronously. On first login, there's a small window where the user exists in Clerk but not yet in DB. The Webhook should fire within ~1s. For `/api/submit`, we add a fallback: if `userId` from JWT doesn't exist in DB yet, return a clear error ("account setup in progress, retry").

### JWT staleness for roles
If an admin updates a user's role in console, the JWT won't reflect it until the session refreshes (default 1hr). This is acceptable for this app — role changes are rare admin actions. If needed, we can force token refresh from the Webhook handler by calling `clerkClient().sessions.revokeSession()`.

---

## Out of Scope

- Caching `/api/profile` response (user-specific data, caching adds complexity)
- Converting `SiteLayout` to a Server Component (requires significant restructure)
- Redis or external cache (not in current stack)
