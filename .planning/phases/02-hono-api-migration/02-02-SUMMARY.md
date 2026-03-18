---
phase: 02-hono-api-migration
plan: 02
subsystem: api
tags: [hono, drizzle-orm, postgres, rest, challenges, themes, types]

requires:
  - phase: 02-hono-api-migration/02-01
    provides: Hono app scaffold, DB schema, session middleware

provides:
  - GET /api/challenges with filter params (difficulty, type, theme, search, showCompleted)
  - GET /api/challenges/:slug returning challenge detail or null for unavailable
  - GET /api/challenges/:slug/objectives returning objectives ordered by displayOrder
  - GET /api/themes and GET /api/themes/:slug
  - GET /api/types and GET /api/types/:slug
  - All route groups mounted in routes/index.ts

affects:
  - 02-03-hono-api-migration (submissions, user progress routes)
  - 04-tanstack-web (web app consuming these endpoints)

tech-stack:
  added: []
  patterns:
    - "Sub-router env typing: new Hono<EnvType>() with Variables declaring user/session from auth.$Infer"
    - "NodeNext .js extension on all relative imports in apps/api/src"
    - "Session user accessed via c.get('user')?.id (nullable for unauthenticated)"
    - "No Next.js cache directives (cacheLife/cacheTag/revalidateTag) in Hono routes"

key-files:
  created:
    - apps/api/src/routes/challenges.ts
    - apps/api/src/routes/themes.ts
    - apps/api/src/routes/types.ts
  modified:
    - apps/api/src/routes/index.ts

key-decisions:
  - "Sub-router type binding: each Hono sub-router must re-declare ChallengesEnv/ThemesEnv with Variables to get proper c.get() typing — cannot inherit from parent app"
  - "showCompleted query param parsed as string: 'false' => false, anything else => true (mirrors tRPC boolean default)"

patterns-established:
  - "Pattern: Sub-router env types — declare type Env = { Variables: { user: SessionUser | null; session: SessionData | null } } and pass to new Hono<Env>()"
  - "Pattern: Challenge list filters — always include eq(challenge.available, true); add optional filters to array; use and(...filters)"

requirements-completed:
  - API-02

duration: 5min
completed: 2026-03-18
---

# Phase 02 Plan 02: Challenge, Theme, and Type REST Endpoints Summary

**Hono REST routes for challenge list/detail/objectives, themes, and types ported from tRPC with exact business logic including filter aggregations and userProgress LEFT JOIN**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-18T15:02:02Z
- **Completed:** 2026-03-18T15:07:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created challenge endpoint with full filter support (difficulty, type, theme, search, showCompleted), SQL COUNT CASE WHEN for completedCount, COALESCE MAX for userStatus per user
- Created theme and type endpoints with name-ordered listing and slug detail lookup
- Wired all route groups (challenges, themes, types, submissions, xp) into routes/index.ts

## Task Commits

1. **Task 1: Create challenge REST endpoints** - `5e2ea3df` (feat) — committed as part of pre-existing 02-03 commit
2. **Task 2: Create theme and type REST endpoints, wire all routes** - `6c9987956` (feat)

## Files Created/Modified

- `apps/api/src/routes/challenges.ts` - Challenge list, detail, and objectives endpoints with session env typing
- `apps/api/src/routes/themes.ts` - Theme list and detail endpoints
- `apps/api/src/routes/types.ts` - Challenge type list and detail endpoints
- `apps/api/src/routes/index.ts` - Updated to mount all five route groups

## Decisions Made

- Sub-router type binding: each Hono sub-router declares its own `ChallengesEnv` type with `Variables` to enable typed `c.get("user")` — this pattern is required because TypeScript cannot infer variable types from the parent app middleware
- `showCompleted` string-to-boolean: query params are always strings; `showCompletedParam !== "false"` defaults to `true` matching tRPC schema `default(true)`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added ChallengesEnv type to challenges sub-router**
- **Found during:** Task 1 (Create challenge REST endpoints)
- **Issue:** `new Hono()` without type parameter caused `c.get("user")` to fail with `Argument of type '"user"' is not assignable to parameter of type 'never'`
- **Fix:** Added `type ChallengesEnv = { Variables: { user: SessionUser | null; session: SessionData | null } }` and used `new Hono<ChallengesEnv>()`
- **Files modified:** apps/api/src/routes/challenges.ts
- **Verification:** `pnpm -F @kubeasy/api typecheck` exits 0
- **Committed in:** 5e2ea3df (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Fix required for correct TypeScript typing. No scope creep.

## Issues Encountered

- The pre-commit hook ran root-level `tsc --noEmit` which initially failed on pre-existing untracked files in `apps/api/src/services/xp/` — these files were added in a separate out-of-plan commit (`5e2ea3df`) by the time Task 2 was committed, resolving the issue automatically.
- `challenges.ts` was included in an out-of-plan commit `5e2ea3df` (labeled feat(02-03)) that bundled challenges, submissions, xp routes, and services together. Task 1 content was therefore already committed before Task 2 began.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All read-only challenge, theme, and type endpoints available at `/api/challenges`, `/api/themes`, `/api/types`
- Submissions and XP endpoints also available (committed ahead of plan in 5e2ea3df)
- Ready for Plan 02-03 (user progress write endpoints, submission handler)

---
*Phase: 02-hono-api-migration*
*Completed: 2026-03-18*

## Self-Check: PASSED

- FOUND: apps/api/src/routes/challenges.ts
- FOUND: apps/api/src/routes/themes.ts
- FOUND: apps/api/src/routes/types.ts
- FOUND: .planning/phases/02-hono-api-migration/02-02-SUMMARY.md
- FOUND commit: 5e2ea3df (challenges.ts)
- FOUND commit: 6c9987956 (themes.ts, types.ts, routes/index.ts)
