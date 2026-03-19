---
phase: 05-realtime-sse
plan: 02
subsystem: api
tags: [bullmq, redis, workers, graceful-shutdown, sigterm]

# Dependency graph
requires:
  - phase: 05-realtime-sse-01
    provides: Redis pub/sub infrastructure and SSE endpoint
provides:
  - BullMQ worker factory functions for user-lifecycle, challenge-submission, and xp-award queues
  - Graceful SIGTERM/SIGINT shutdown sequence in API entry point
  - Server reference captured from serve() for controlled HTTP listener shutdown
affects: [06-otel-observability, 07-railway-deploy]

# Tech tracking
tech-stack:
  added: [bullmq ^5.71.0]
  patterns: [worker factory function pattern (createXxxWorker), graceful shutdown sequence (server.close -> workers.close -> redis.quit -> exit)]

key-files:
  created:
    - apps/api/src/workers/user-lifecycle.worker.ts
    - apps/api/src/workers/challenge-submission.worker.ts
    - apps/api/src/workers/xp-award.worker.ts
  modified:
    - apps/api/src/index.ts
    - apps/api/package.json

key-decisions:
  - "Worker factory pattern: each worker exported as createXxxWorker() returning Worker instance, allowing index.ts to collect all workers into an array for batch shutdown"
  - "Connection via host/port parsed from REDIS_URL (not url string) — BullMQ ConnectionOptions uses host/port, not url"
  - "maxRetriesPerRequest: null required for BullMQ workers — without it blocking Redis commands fail"
  - "Both SIGTERM (Railway/Docker) and SIGINT (Ctrl+C) handled in shutdown — covers both prod and local dev"

patterns-established:
  - "Worker factory: export function createXxxWorker() { return new Worker(...) } — enables collection into array for batch close()"
  - "Graceful shutdown order: server.close() (sync) -> Promise.all(workers.map(w => w.close())) (async, drain in-flight) -> redis.quit() (async) -> process.exit(0)"

requirements-completed: [REAL-04]

# Metrics
duration: 2min
completed: 2026-03-19
---

# Phase 05 Plan 02: BullMQ Workers and Graceful Shutdown Summary

**Three BullMQ worker factories instantiated on API startup with SIGTERM/SIGINT graceful shutdown draining in-flight jobs before exit**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-19T08:14:19Z
- **Completed:** 2026-03-19T08:15:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created three BullMQ worker factory functions (user-lifecycle, challenge-submission, xp-award) consuming their respective queues from `@kubeasy/jobs`
- All workers configured with `maxRetriesPerRequest: null` and parsed host/port from `REDIS_URL`
- Modified API entry point to capture server reference, instantiate workers, and handle SIGTERM/SIGINT gracefully
- Shutdown sequence follows locked decision: server.close -> workers.close -> redis.quit -> process.exit(0)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create BullMQ worker files and add bullmq dependency** - `49bd289f1` (feat)
2. **Task 2: Capture server reference and implement SIGTERM graceful shutdown** - `f015ed584` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `apps/api/src/workers/user-lifecycle.worker.ts` - BullMQ Worker factory for USER_LIFECYCLE queue, processes UserSignupPayload
- `apps/api/src/workers/challenge-submission.worker.ts` - BullMQ Worker factory for CHALLENGE_SUBMISSION queue, processes ChallengeSubmissionPayload
- `apps/api/src/workers/xp-award.worker.ts` - BullMQ Worker factory for XP_AWARD queue, processes XpAwardPayload
- `apps/api/src/index.ts` - Rewritten to capture server, instantiate workers array, register SIGTERM/SIGINT handlers
- `apps/api/package.json` - Added bullmq ^5.71.0 as direct dependency

## Decisions Made
- Worker factory pattern chosen over direct instantiation to allow collecting all workers into an array for `Promise.all(workers.map(w => w.close()))` batch drain
- Connection uses parsed host/port from REDIS_URL because BullMQ `ConnectionOptions` interface uses host/port fields (not a url string)
- `maxRetriesPerRequest: null` is mandatory — without it BullMQ's blocking Redis commands (BRPOP) time out and throw

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three BullMQ queues now have corresponding workers — dispatched jobs will be consumed
- API shuts down cleanly on Railway SIGTERM without dropping in-flight jobs
- Worker implementations are placeholder TODOs — actual business logic (welcome emails, analytics, XP award side effects) is deferred to a future phase
- Ready for Phase 06: OTel observability

---
*Phase: 05-realtime-sse*
*Completed: 2026-03-19*

## Self-Check: PASSED

- apps/api/src/workers/user-lifecycle.worker.ts: FOUND
- apps/api/src/workers/challenge-submission.worker.ts: FOUND
- apps/api/src/workers/xp-award.worker.ts: FOUND
- apps/api/src/index.ts: FOUND
- Commit 49bd289f1 (Task 1): FOUND
- Commit f015ed584 (Task 2): FOUND
