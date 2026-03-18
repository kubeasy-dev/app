---
phase: 04-web-migration
plan: "02"
subsystem: apps/web
tags: [api-client, tanstack-query, fetch, typed, credentials]
dependency_graph:
  requires: [04-01]
  provides: [api-client-layer, query-option-factories]
  affects: [apps/web/src]
tech_stack:
  added: []
  patterns: [typed-fetch-wrapper, query-options-factory, tdd-red-green]
key_files:
  created:
    - apps/web/src/lib/api-client.ts
    - apps/web/src/lib/query-options.ts
    - apps/web/src/__tests__/api-client.test.ts
    - apps/web/vitest.config.ts
  modified: []
decisions:
  - "Progress routes use /:slug pattern (GET /progress/:slug, POST /progress/:slug/start, DELETE /progress/:slug/reset) — not body-based /start and /reset endpoints as specified in plan"
  - "Latest validation endpoint lives at GET /submissions/:slug/latest (not /progress/latest-validation/:slug) — moved to submissions router in api"
  - "XP transactions endpoint is /xp/history (not /xp/transactions) — plan spec was incorrect"
  - "User name update uses PATCH (not PUT) — corrected from plan spec"
  - "No /user/stats endpoint exists in api — omitted from api object"
metrics:
  duration_seconds: 167
  completed_date: "2026-03-18"
  tasks_completed: 2
  files_created: 4
  files_modified: 0
---

# Phase 4 Plan 2: Typed API Client Layer Summary

Typed fetch wrappers backed by `@kubeasy/api-schemas` Zod types with `credentials: 'include'` on every call, plus TanStack Query option factories covering all Hono API endpoints consumed by apps/web.

## What Was Built

**`apps/web/src/lib/api-client.ts`** — Central fetch layer for apps/web:
- `apiFetch<T>()` generic wrapper: always sets `credentials: 'include'`, adds `Content-Type: application/json` for non-GET, throws with status code on non-ok responses
- `api` object with namespaced methods: `challenges`, `themes`, `types`, `progress`, `submissions`, `user`, `xp`, `admin`
- All return types are `z.infer<>` from `@kubeasy/api-schemas` subpath imports
- Zero `@trpc` imports anywhere in `apps/web/src/`

**`apps/web/src/lib/query-options.ts`** — TanStack Query option factories:
- 13 exported factory functions using `queryOptions({ queryKey, queryFn })`
- Usable with `ensureQueryData()` in route loaders (SSR prefetch) and `useSuspenseQuery()` in components
- Single import point — page components never call `api.*` directly

**`apps/web/vitest.config.ts`** — Vitest config with `root: 'src'`, node environment

**`apps/web/src/__tests__/api-client.test.ts`** — 9 passing tests covering credentials, URL construction, error handling, and filter serialization

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Progress endpoint paths corrected from plan spec**
- **Found during:** Task 1 (reading actual route files)
- **Issue:** Plan specified `/progress/status/:slug`, `POST /progress/start` with body, `POST /progress/reset` with body. Actual Hono routes use `GET /progress/:slug`, `POST /progress/:slug/start`, `DELETE /progress/:slug/reset`
- **Fix:** Implemented with correct path patterns matching actual Hono router
- **Files modified:** `apps/web/src/lib/api-client.ts`

**2. [Rule 1 - Bug] Latest validation endpoint moved to submissions router**
- **Found during:** Task 1 (reading actual route files)
- **Issue:** Plan specified `GET /progress/latest-validation/:slug`. Actual route is `GET /submissions/:slug/latest` in the submissions router
- **Fix:** `api.submissions.latestValidation(slug)` calls `/submissions/${slug}/latest`; `latestValidationOptions()` updated accordingly
- **Files modified:** `apps/web/src/lib/api-client.ts`, `apps/web/src/lib/query-options.ts`

**3. [Rule 1 - Bug] XP endpoint is /xp/history not /xp/transactions**
- **Found during:** Task 1 (reading `apps/api/src/routes/xp.ts`)
- **Issue:** Plan specified `GET /xp/transactions`. Actual route is `GET /xp/history`
- **Fix:** `api.xp.transactions()` calls `/xp/history`
- **Files modified:** `apps/web/src/lib/api-client.ts`

**4. [Rule 1 - Bug] User name update uses PATCH not PUT**
- **Found during:** Task 1 (reading `apps/api/src/routes/user.ts`)
- **Issue:** Plan specified `PUT /user/name`. Actual route is `PATCH /user/name`
- **Fix:** `api.user.updateName()` uses `method: 'PATCH'`
- **Files modified:** `apps/web/src/lib/api-client.ts`

## Commits

| Task | Description | Hash |
|------|-------------|------|
| 1 | Typed API client layer with vitest config and tests | 287e02f78 |
| 2 | TanStack Query option factories for all API endpoints | ea5dce517 |

## Self-Check: PASSED

All 4 created files verified on disk. Both task commits (287e02f78, ea5dce517) verified in git log.
