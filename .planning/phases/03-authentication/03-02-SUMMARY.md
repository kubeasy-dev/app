---
phase: 03-authentication
plan: 02
subsystem: auth
tags: [better-auth, hono, api-key, middleware, cli]

# Dependency graph
requires:
  - phase: 03-authentication
    provides: "Better Auth setup with apiKey plugin enabled in apps/api/src/lib/auth.ts (plan 03-01)"
provides:
  - "apiKeyMiddleware at apps/api/src/middleware/api-key.ts validates Bearer tokens for CLI routes"
  - "CLI routes at /api/cli/* secured with apiKeyMiddleware before route handlers"
affects: [phase-04-tanstack-web, cli-authentication]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "API key middleware follows same createMiddleware factory pattern as sessionMiddleware"
    - "c.set('user', ...) / c.set('session', null) ensures uniform context shape across auth strategies"
    - "cli.use('/*', middleware) pattern applies middleware to all sub-routes in Hono"

key-files:
  created:
    - apps/api/src/middleware/api-key.ts
  modified:
    - apps/api/src/routes/cli/index.ts

key-decisions:
  - "Use result.key.referenceId (not result.key.userId) for user lookup — better-auth 1.5+ renamed this field"
  - "session set to null for API key auth since no session object exists — same Variables shape as sessionMiddleware"
  - "AUTH-06 (apps/web Better Auth client) deferred to Phase 4 — apps/web does not exist yet"
  - "All failure cases (missing header, invalid key, user not found) return 401 — no distinction to prevent enumeration"

patterns-established:
  - "API key auth pattern: extract Bearer token -> verifyApiKey -> DB lookup via referenceId -> c.set(user)"
  - "401-only pattern: never return 403 or distinguish between missing vs invalid keys"

requirements-completed: [AUTH-05, AUTH-06]

# Metrics
duration: 2min
completed: 2026-03-18
---

# Phase 3 Plan 02: API Key Middleware Summary

**Hono apiKeyMiddleware for CLI Bearer token auth using better-auth verifyApiKey with referenceId-based user lookup, wired to /api/cli/* routes**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-18T16:43:09Z
- **Completed:** 2026-03-18T16:44:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `apiKeyMiddleware` that validates `Authorization: Bearer <key>` headers via `auth.api.verifyApiKey()` and injects the authenticated user into Hono context with the same shape as `sessionMiddleware`
- Used `result.key.referenceId` (not `result.key.userId`) for DB user lookup per better-auth 1.5+ field rename
- Wired `apiKeyMiddleware` to all CLI routes via `cli.use("/*", apiKeyMiddleware)` in `apps/api/src/routes/cli/index.ts`
- AUTH-06 documented as deferred to Phase 4 (apps/web scaffold does not exist yet)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create API key middleware** - `bff11ce5a` (feat)
2. **Task 2: Wire apiKeyMiddleware to CLI routes** - `e24545fb4` (feat)

**Plan metadata:** *(created next)*

## Files Created/Modified

- `apps/api/src/middleware/api-key.ts` - New middleware validating Bearer tokens via better-auth verifyApiKey, fetching user from DB, injecting into Hono context
- `apps/api/src/routes/cli/index.ts` - Added apiKeyMiddleware applied to all CLI routes before submit sub-router

## Decisions Made

- Used `result.key.referenceId` (not `result.key.userId`) — better-auth 1.5+ renamed this field per research in 03-RESEARCH.md
- All failure cases return 401: missing header, invalid key, and user not found in DB — prevents API enumeration
- `session` set to `null` in Hono context for API key auth since no session object exists; `requireAuth` in the submit router only checks `c.get("user")`, so it still passes
- AUTH-06 (apps/web createAuthClient pointing to API URL) deferred to Phase 4 — apps/web TanStack Start app is Phase 4's responsibility

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CLI API key authentication is fully wired: CLI can authenticate via Bearer tokens to POST /api/cli/challenges/:slug/submit
- Phase 3 authentication phase complete — Better Auth, session middleware, API key middleware all in place
- Phase 4 (TanStack Start web app) can scaffold apps/web with `createAuthClient` pointing to API URL to satisfy AUTH-06

---
*Phase: 03-authentication*
*Completed: 2026-03-18*

## Self-Check: PASSED

- FOUND: apps/api/src/middleware/api-key.ts
- FOUND: apps/api/src/routes/cli/index.ts
- FOUND: commit bff11ce5a (Task 1)
- FOUND: commit e24545fb4 (Task 2)
- FOUND: commit 632a9c193 (plan metadata)
