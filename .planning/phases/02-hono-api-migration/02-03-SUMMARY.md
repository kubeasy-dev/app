---
phase: 02-hono-api-migration
plan: "03"
subsystem: api
tags: [hono, xp, progress, submissions, cli, rest]
dependency_graph:
  requires: [02-01]
  provides: [progress-endpoints, xp-service, submit-endpoint, cli-alias]
  affects: [apps/api]
tech_stack:
  added: []
  patterns: [hono-route-groups, xp-service, atomic-progress-update, race-condition-guard]
key_files:
  created:
    - apps/api/src/services/xp/types.ts
    - apps/api/src/services/xp/constants.ts
    - apps/api/src/services/xp/calculateXPGain.ts
    - apps/api/src/services/xp/calculateLevel.ts
    - apps/api/src/services/xp/calculateStreak.ts
    - apps/api/src/services/xp/index.ts
    - apps/api/src/routes/submissions.ts
    - apps/api/src/routes/xp.ts
    - apps/api/src/routes/progress.ts
    - apps/api/src/routes/user.ts
    - apps/api/src/routes/submit.ts
    - apps/api/src/routes/cli/index.ts
  modified:
    - apps/api/src/routes/index.ts
decisions:
  - "Promise.all() used for parallel deletes in resetChallenge and resetProgress instead of better-all"
  - "CLI alias at /api/cli/challenges/:slug/submit re-uses the same submit Hono instance via cli.route"
  - "Import path for XP service DB imports: ../../db/index.js (not @/server/db)"
metrics:
  duration_min: 5
  tasks_completed: 3
  files_created: 12
  files_modified: 1
  completed_date: "2026-03-18"
---

# Phase 02 Plan 03: Progress, XP, and CLI Submission Endpoints Summary

**One-liner:** XP service ported with fixed imports plus progress/user/submit/CLI REST endpoints mirroring the tRPC submitChallenge business logic including race condition guard and XP distribution.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Copy XP service and create read-only endpoints (submissions, xp history) | 5e2ea3df1 | services/xp/*, routes/submissions.ts, routes/xp.ts |
| 2 | Create write endpoints (progress start/reset, user profile/reset, user stats) | 3b65859f5 | routes/progress.ts, routes/user.ts |
| 3 | Create CLI submission endpoint, CLI alias route, wire all routes | 01cdc64c8 | routes/submit.ts, routes/cli/index.ts, routes/index.ts |

## Endpoints Created

### Submissions (read-only)
- `GET /api/submissions/:slug` — all submissions for user+challenge ordered desc
- `GET /api/submissions/:slug/latest` — latest validation status with objectives

### XP History
- `GET /api/xp/history` — last 20 XP transactions with challenge JOIN (LEFT JOIN for null-safe challenge details)

### Progress
- `GET /api/progress/completion` — completion percentage with optional `splitByTheme` and `themeSlug` query params
- `GET /api/progress/:slug` — challenge status for authenticated user
- `POST /api/progress/:slug/start` — create or update progress to in_progress
- `DELETE /api/progress/:slug/reset` — delete progress + submissions + XP transactions, recalculate totalXp

### User
- `GET /api/user/xp` — XP earned and rank info via calculateLevel
- `GET /api/user/streak` — current streak count via calculateStreak
- `PATCH /api/user/name` — update user full name
- `DELETE /api/user/progress` — delete ALL user progress, XP, and transactions

### Submit (canonical + CLI alias)
- `POST /api/challenges/:slug/submit` — full 17-step business logic: slug lookup, completion fast-path check, objective metadata fetch, 422 validation for missing/unknown objectives, enrichment, submission storage, atomic progress update with race guard, XP calculation and distribution, rank detection
- `POST /api/cli/challenges/:slug/submit` — CLI alias re-using same submit Hono instance

## XP Service Files

| File | Change |
|------|--------|
| types.ts | Copied verbatim; import updated to use `./constants.js` |
| constants.ts | Copied verbatim |
| calculateXPGain.ts | Copied verbatim (pure function, no DB import) |
| calculateLevel.ts | `import db from "@/server/db"` → `import { db } from "../../db/index.js"` |
| calculateStreak.ts | `import db from "@/server/db"` → `import { db } from "../../db/index.js"` |
| index.ts | Copied verbatim; re-export paths updated to `.js` extension |

## Deviations from Plan

None — plan executed exactly as written.

## Success Criteria Verification

- [x] XP service copied with `../../db/index.js` import path (not `@/server/db`)
- [x] All 9 userProgress procedures ported to REST endpoints
- [x] xpTransaction.getRecentGains ported to GET /xp/history
- [x] user.updateName and user.resetProgress ported
- [x] Submit endpoint validates missing/unknown objectives (422)
- [x] Submit endpoint uses atomic progress update with race condition guard
- [x] Submit endpoint distributes XP with streak and first-challenge bonuses
- [x] CLI alias at /api/cli/challenges/:slug/submit available
- [x] `pnpm -F @kubeasy/api typecheck` exits 0
- [x] No forbidden imports (better-all, revalidateTag, @/server/db, trackChallenge, realtime.channel)
