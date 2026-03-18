# Phase 5: Realtime SSE - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement real-time validation status updates: SSE endpoint on Hono (`GET /api/sse/validation/:challengeSlug`) subscribed to Redis pub/sub, `PUBLISH` call added to the submit route after enrichment and DB write, `useValidationSSE` hook in `ChallengeMission` that triggers `queryClient.invalidateQueries` on event, and BullMQ Worker instantiation in `apps/api` with graceful SIGTERM shutdown. No new user-facing features beyond the automatic refresh — feature parity with the original Upstash Realtime behavior.

</domain>

<decisions>
## Implementation Decisions

### SSE Authentication
- Cookie-based auth via `withCredentials: true` on the `EventSource` — the existing Better Auth session cookie is sent automatically on cross-origin SSE connections
- Return **HTTP 401 immediately** (before opening the stream) when no session is present — no reconnect loop, clean failure
- Use `requireAuth` middleware on the SSE route — consistent with all other protected routes, no inline auth logic needed

### SSE Endpoint (Hono)
- Route: `GET /api/sse/validation/:challengeSlug`
- Dedicated `ioredis` subscriber instance per connection — never share the subscriber with the main `redis` export (already locked in STATE.md)
- Subscribe to channel `validation:{userId}:{challengeSlug}` after connection opens
- Send a 30-second heartbeat to prevent proxy timeouts (already locked in STATE.md)
- Clean up the subscriber on abort signal — `c.req.raw.signal.addEventListener('abort', cleanup)` pattern

### Redis PUBLISH (submit route)
- After enrichment and DB write in `apps/api/src/routes/submit.ts`, publish to `validation:{userId}:{challengeSlug}` via the shared `redis` export (publisher)
- Publish the full enriched submission result as the message payload — this is what the SSE handler forwards to the browser as the event `data`

### Web Integration (apps/web)
- **`useValidationSSE(slug)` hook** — instantiated inside `ChallengeMission`, co-located with the `latestValidationOptions` query it invalidates
- Hook creates an `EventSource` with `{ withCredentials: true }` pointing to the API SSE endpoint
- On `message` event: calls `queryClient.invalidateQueries({ queryKey: ['submissions', 'latest', slug] })` — triggers a fresh fetch of validation status
- **Only active when challenge status is `in_progress`** — no SSE connection opened for `not_started` or `completed` challenges; reduces unnecessary subscriber connections
- No SSE-specific UI: silent background update — existing loading state covers any refetch flash

### BullMQ Worker Scope
- **All defined queues** get workers in `apps/api`: `user-lifecycle`, `challenge-submission`, `xp-award`
- Worker implementations in `apps/api/src/workers/` — one file per queue:
  - `user-lifecycle.worker.ts`
  - `challenge-submission.worker.ts`
  - `xp-award.worker.ts`
- Workers registered and managed in `apps/api/src/server.ts` (or equivalent entry point)
- Queue definitions and payload types remain in `packages/jobs` — workers import from there (unidirectional dependency preserved)

### SIGTERM Shutdown Sequence
1. `server.close()` — stop accepting new HTTP/SSE connections
2. `await Promise.all(workers.map(w => w.close()))` — drain in-flight BullMQ jobs
3. Close Redis connections (`redis.quit()`)
4. `process.exit(0)`

### Redis Configuration
- `maxmemory-policy noeviction` — already configured in docker-compose from Phase 1 (no change needed)
- The SSE subscriber creates a **new `ioredis` connection** per SSE client — not `.duplicate()` of the shared client, a fresh `new Redis(process.env.REDIS_URL)` instance

### Claude's Discretion
- SSE event type name (e.g. `validation-update` vs `message`)
- Heartbeat event format (comment `:`-style or named event)
- Error handling if Redis subscriber creation fails
- EventSource URL construction in the hook (env-based API base URL)
- BullMQ worker concurrency settings

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing code to modify
- `apps/api/src/routes/submit.ts` — add `redis.publish(...)` after enrichment and DB write; understand current flow
- `apps/api/src/lib/redis.ts` — existing Redis (ioredis) singleton; SSE handler must create a new subscriber, not use this shared instance
- `apps/api/src/routes/index.ts` — where the new SSE route group must be mounted
- `apps/web/src/components/challenge-mission.tsx` — where `useValidationSSE` hook is called; understand current query structure
- `apps/web/src/lib/query-options.ts` — `latestValidationOptions` query key `['submissions', 'latest', slug]` must match what `invalidateQueries` targets

### Packages
- `packages/jobs/src/index.ts` — queue names and payload types for all workers to implement

### Requirements
- `.planning/REQUIREMENTS.md` §Realtime SSE — REAL-01 through REAL-04 (full requirements for this phase)

### Prior SSE decisions
- `.planning/STATE.md` §Decisions — `[SSE]` entry: dedicated ioredis subscriber, abort signal cleanup, 30s heartbeat

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/api/src/lib/redis.ts`: existing `redis` ioredis export — use as the **publisher**; create new `Redis(process.env.REDIS_URL)` instances for subscribers
- `apps/api/src/middleware/session.ts`: `requireAuth` middleware pattern — mount it before the SSE handler identically to other protected routes
- `apps/api/src/routes/submit.ts`: submit handler already imports `redis` — just add `redis.publish(...)` at the end of the success path
- `packages/jobs/src/index.ts`: `QUEUE_NAMES`, `createQueue`, all payload types — workers import from here
- `apps/web/src/components/challenge-mission.tsx`: already has `challengeStatusOptions` query for `status` field — `useValidationSSE` should read `status` from this to gate the connection
- `apps/web/src/lib/query-options.ts`: `latestValidationOptions` — this is the query key to invalidate on SSE event

### Established Patterns
- `@hono/node-server` with `streamSSE` helper for SSE responses (Hono 4.x)
- All protected routes use `requireAuth` middleware before the handler
- BullMQ `createQueue(name, redis)` factory from `packages/jobs` — workers use the same pattern to connect
- Fire-and-forget style for BullMQ dispatch (Phase 1 decision) — workers can be synchronous internally

### Integration Points
- SSE route mounts at `/api/sse/...` in `apps/api/src/routes/index.ts`
- `submit.ts` publishes after the final `return c.json(...)` success path — publish must happen before the return
- `ChallengeMission` calls `useValidationSSE(slug)` as a side-effect hook — no return value needed in the component UI
- `queryClient` available via `useQueryClient()` from `@tanstack/react-query` inside the hook

</code_context>

<specifics>
## Specific Ideas

- No specific references — standard SSE + Redis pub/sub pattern as described in the requirements

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-realtime-sse*
*Context gathered: 2026-03-19*
