---
phase: 11-admin-features
plan: 01
subsystem: api
tags: [hono, drizzle, zod, admin, rest-api, pagination]

# Dependency graph
requires:
  - phase: 10-micro-frontend-dev-proxy-admin-scaffold
    provides: admin router scaffold with requireAdmin middleware and challenges-sync route
provides:
  - "GET /api/admin/challenges — all challenges with starts/completions/submission metrics"
  - "GET /api/admin/challenges/stats — global submission and completion rates"
  - "PATCH /api/admin/challenges/:id/available — toggle challenge availability"
  - "GET /api/admin/users — paginated user list with completedChallenges and totalXp"
  - "GET /api/admin/users/stats — total/active/banned/admins counts"
  - "AdminUserItemSchema, AdminUserListOutputSchema, AdminUserStatsOutputSchema in @kubeasy/api-schemas/auth"
affects: [11-02, 11-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Admin routes use admin.use('/*', requireAdmin) global middleware — no per-route auth needed"
    - "sessionMiddleware applied globally in app.ts on /api/* — available in all admin routes via c.var.user"
    - "Drizzle sql<number> template for aggregate COUNT/SUM expressions in select"
    - "Correlated subqueries in Drizzle select for per-row aggregates (totalSubmissions per challenge)"

key-files:
  created:
    - packages/api-schemas/src/auth.ts (extended)
    - apps/api/src/routes/admin/challenges.ts
    - apps/api/src/routes/admin/users.ts
    - apps/api/src/__tests__/admin.test.ts
  modified:
    - apps/api/src/routes/admin/index.ts

key-decisions:
  - "sessionMiddleware confirmed in app.ts on /api/* — no additional session wiring needed in admin routes"
  - "correlated subqueries used for totalSubmissions/successfulSubmissions per challenge (avoids double groupBy complexity)"
  - "challenges.ts route registered AFTER challenges/sync so the sync route still matches correctly (Hono route priority)"

patterns-established:
  - "Admin route files follow Hono router pattern: new Hono(), export const adminX, mount in index.ts"
  - "Pagination pattern: page/limit query params, Math.max/Math.min guards, offset calculation"

requirements-completed: [ADMIN-11, ADMIN-12, ADMIN-13, ADMIN-14]

# Metrics
duration: 12min
completed: 2026-03-25
---

# Phase 11 Plan 01: Admin API Endpoints Summary

**Five Hono admin REST endpoints with Drizzle aggregate queries and three new Zod schemas in @kubeasy/api-schemas/auth**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-25T07:40:00Z
- **Completed:** 2026-03-25T07:52:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Extended @kubeasy/api-schemas/auth with AdminUserItemSchema, AdminUserListOutputSchema, AdminUserStatsOutputSchema and their TypeScript types
- Implemented GET /api/admin/challenges returning all challenges with per-challenge metrics (starts, completions, totalSubmissions, successfulSubmissions) via Drizzle aggregate queries
- Implemented GET /api/admin/challenges/stats, PATCH /api/admin/challenges/:id/available, GET /api/admin/users (paginated), and GET /api/admin/users/stats
- Created admin.test.ts stub file with it.todo() stubs for all 5 endpoints following project convention
- All endpoints protected by existing requireAdmin middleware in admin router — no per-route auth duplication

## Task Commits

1. **Task 1: Add admin user schemas to @kubeasy/api-schemas/auth + create test stub file** - `3c940a060` (feat)
2. **Task 2: Hono admin challenges routes (GET list, GET stats, PATCH toggle)** - `2334fa180` (feat)
3. **Task 3: Hono admin users routes (GET paginated list, GET stats)** - `baa91bb1f` (feat)

## Files Created/Modified

- `packages/api-schemas/src/auth.ts` — extended with AdminUserItemSchema, AdminUserListOutputSchema, AdminUserStatsOutputSchema
- `apps/api/src/routes/admin/challenges.ts` — 3 admin challenge endpoints with Drizzle aggregate queries
- `apps/api/src/routes/admin/users.ts` — 2 admin user endpoints with pagination and metrics
- `apps/api/src/routes/admin/index.ts` — updated to mount adminChallenges and adminUsers routers
- `apps/api/src/__tests__/admin.test.ts` — vitest todo stubs for all 5 endpoints

## Decisions Made

- sessionMiddleware is already applied globally on `/api/*` in app.ts — confirmed no additional wiring needed in admin routes
- Used correlated subqueries for totalSubmissions and successfulSubmissions per challenge to avoid complex double-groupBy with subquery joins
- Registered `admin.route("/challenges", adminChallenges)` after `admin.route("/challenges/sync", challengesSync)` to preserve sync route priority in Hono's routing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 5 admin REST endpoints are implemented and type-safe
- AdminUserItem, AdminUserListOutput, AdminUserStatsOutput exported from @kubeasy/api-schemas/auth — ready for plans 11-02 and 11-03 (UI)
- pnpm typecheck passes clean, pnpm --filter @kubeasy/api test:run passes (66 todos, 0 failures)
- No blockers for wave 2 plans

---
*Phase: 11-admin-features*
*Completed: 2026-03-25*
