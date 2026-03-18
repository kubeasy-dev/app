---
phase: 02-hono-api-migration
plan: "01"
subsystem: api
tags: [hono, postgres, drizzle-orm, better-auth, ioredis, typescript, nodejs]

# Dependency graph
requires:
  - phase: 01-monorepo-scaffold
    provides: pnpm workspace with packages/typescript-config and apps/* glob in pnpm-workspace.yaml
provides:
  - apps/api Hono 4.x Node.js process scaffold with postgres.js Drizzle connection
  - Migrated DB schema (auth, challenge, email, onboarding) in apps/api/src/db/schema/
  - Better Auth instance with Drizzle adapter and admin plugin (no OAuth)
  - sessionMiddleware and requireAuth middleware for Hono context
  - apps/api recognized as @kubeasy/api workspace package
affects:
  - 02-02-routes-challenges
  - 02-03-routes-progress
  - 02-04-routes-xp

# Tech tracking
tech-stack:
  added:
    - hono@^4.12.8
    - "@hono/node-server@^1.19.11"
    - postgres@^3.4.8
    - drizzle-orm@0.45.1 (apps/api copy)
    - better-auth@1.5.5 (apps/api copy)
    - "@better-auth/drizzle-adapter@1.5.5"
    - ioredis@^5.6.1
    - nanoid@5.1.6
    - tsx@4.21.0 (dev runner)
  patterns:
    - NodeNext moduleResolution requires .js extensions on all relative imports
    - Better Auth mounted at /api/auth/** with CORS before session middleware
    - sessionMiddleware sets c.var.user/session; requireAuth returns 401 when null
    - postgres.js replaces @neondatabase/serverless for DB connection

key-files:
  created:
    - apps/api/package.json
    - apps/api/tsconfig.json
    - apps/api/drizzle.config.ts
    - apps/api/src/db/index.ts
    - apps/api/src/db/schema/auth.ts
    - apps/api/src/db/schema/challenge.ts
    - apps/api/src/db/schema/email.ts
    - apps/api/src/db/schema/onboarding.ts
    - apps/api/src/db/schema/index.ts
    - apps/api/src/lib/auth.ts
    - apps/api/src/lib/redis.ts
    - apps/api/src/middleware/session.ts
    - apps/api/src/routes/index.ts
    - apps/api/src/app.ts
    - apps/api/src/index.ts
  modified:
    - pnpm-lock.yaml

key-decisions:
  - "Use @better-auth/drizzle-adapter as separate package (not better-auth/adapters/drizzle subpath which doesn't exist in v1.5.5)"
  - "Inline objectiveCategoryValues array in challenge.ts schema to eliminate @/schemas/challengeObjectives cross-dependency"
  - "All relative imports use .js extensions due to NodeNext moduleResolution in typescript-config/node.json"

patterns-established:
  - "Pattern: NodeNext .js extension rule - all relative imports in apps/api/src must use .js extension (e.g., from './auth.js')"
  - "Pattern: Middleware ordering - CORS -> logger -> sessionMiddleware -> routes (Better Auth reads Origin header)"
  - "Pattern: Better Auth handler mount at app.on(['GET','POST'], '/api/auth/**') after CORS"

requirements-completed: [API-01, API-06, API-07, API-08]

# Metrics
duration: 7min
completed: "2026-03-18"
---

# Phase 02 Plan 01: Hono API Scaffold Summary

**Hono 4.x + @hono/node-server Node.js API scaffold with postgres.js Drizzle connection, migrated DB schema, Better Auth (Drizzle adapter + admin plugin), session middleware, and health endpoint**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-18T14:52:29Z
- **Completed:** 2026-03-18T14:59:12Z
- **Tasks:** 3
- **Files modified:** 16

## Accomplishments
- apps/api recognized as @kubeasy/api workspace package with all required dependencies
- DB schema migrated from server/db/schema/ with ObjectiveTypeSchema cross-dependency eliminated (inline values)
- Hono app with CORS + session middleware + Better Auth handler + health endpoint compiling with zero type errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create apps/api package scaffold with dependencies and wire turbo.json** - `36554c034` (chore)
2. **Task 2: Migrate DB schema and create postgres.js Drizzle connection + Redis client** - `6ec775d10` (feat)
3. **Task 3: Create Hono app factory, Better Auth instance, session middleware, and entry point** - `0ce517558` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `apps/api/package.json` - @kubeasy/api manifest with hono, postgres, drizzle-orm, better-auth, ioredis
- `apps/api/tsconfig.json` - Extends @kubeasy/typescript-config/node.json with NodeNext module resolution
- `apps/api/drizzle.config.ts` - postgresql dialect pointing to ./src/db/schema
- `apps/api/src/db/index.ts` - postgres.js client + drizzle-orm/postgres-js connection
- `apps/api/src/db/schema/auth.ts` - Copied from server/db/schema/auth.ts (user, session, account, verification, apikey)
- `apps/api/src/db/schema/challenge.ts` - Copied with ObjectiveTypeSchema import replaced by inlined constant
- `apps/api/src/db/schema/email.ts` - Copied from server/db/schema/email.ts (emailTopic)
- `apps/api/src/db/schema/onboarding.ts` - Copied from server/db/schema/onboarding.ts (userOnboarding)
- `apps/api/src/db/schema/index.ts` - Re-exports all 4 schemas with .js extensions
- `apps/api/src/lib/auth.ts` - betterAuth with @better-auth/drizzle-adapter, admin plugin, no OAuth
- `apps/api/src/lib/redis.ts` - ioredis Redis client singleton
- `apps/api/src/middleware/session.ts` - sessionMiddleware and requireAuth (401 on missing session)
- `apps/api/src/routes/index.ts` - Route skeleton with /health endpoint
- `apps/api/src/app.ts` - Hono app factory exporting typed app and AppType
- `apps/api/src/index.ts` - Entry point with @hono/node-server on port 3001

## Decisions Made
- Used `@better-auth/drizzle-adapter` as a separate package (not `better-auth/adapters/drizzle` subpath which does not exist in v1.5.5)
- Inlined `objectiveCategoryValues` array directly in challenge.ts to avoid importing from `@/schemas/challengeObjectives` (Next.js path alias incompatible with apps/api)
- All relative imports use `.js` extensions due to `NodeNext` moduleResolution from shared tsconfig

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added .js extensions to all relative imports**
- **Found during:** Task 2 (DB schema migration)
- **Issue:** TypeScript TS2834/TS2835 errors — NodeNext moduleResolution requires explicit .js extensions on relative imports
- **Fix:** Updated all relative imports in db/schema/*.ts and db/index.ts to use .js extensions (e.g., `from "./auth.js"`)
- **Files modified:** apps/api/src/db/index.ts, apps/api/src/db/schema/challenge.ts, apps/api/src/db/schema/onboarding.ts, apps/api/src/db/schema/index.ts
- **Verification:** `pnpm -F @kubeasy/api typecheck` exits 0
- **Committed in:** 6ec775d10 (Task 2 commit)

**2. [Rule 3 - Blocking] Used @better-auth/drizzle-adapter instead of better-auth/adapters/drizzle subpath**
- **Found during:** Task 3 (Better Auth instance creation)
- **Issue:** Plan spec referenced `better-auth/adapters/drizzle` subpath export which does not exist in better-auth@1.5.5. The workspace uses `@better-auth/drizzle-adapter` as a separate package.
- **Fix:** Added `@better-auth/drizzle-adapter: 1.5.5` to apps/api/package.json dependencies and used it as import
- **Files modified:** apps/api/package.json, apps/api/src/lib/auth.ts
- **Verification:** `pnpm -F @kubeasy/api typecheck` exits 0
- **Committed in:** 0ce517558 (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes required for compilation. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required for this scaffold plan.

## Next Phase Readiness
- apps/api scaffold complete; Plans 02-02, 02-03, 02-04 can now add routes that import from `./db/index.js`, `./lib/auth.js`, and `./middleware/session.js`
- `pnpm -F @kubeasy/api typecheck` exits 0
- `pnpm -F @kubeasy/api exec echo ok` exits 0 (workspace resolution)
- turbo dev will start apps/api automatically via the "dev" task (cache:false, persistent:true)
- @neondatabase/serverless does NOT appear in apps/api dependency tree

---
*Phase: 02-hono-api-migration*
*Completed: 2026-03-18*
