# Phase 2: Hono API Migration - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Build `apps/api` from scratch as a Hono 4.x + `@hono/node-server` Node.js long-lived process. Port all tRPC business logic to REST endpoints validated by `@kubeasy/api-schemas`. Replace the Neon serverless driver with postgres.js. Install Better Auth with Drizzle adapter (no OAuth providers yet — those are Phase 3).

Out of scope for Phase 2: OAuth configuration, API key management, email preferences, onboarding flow, web frontend.

</domain>

<decisions>
## Implementation Decisions

### Router scope

**Phase 2 ports these tRPC routers to REST:**
- `challenge` — list with filters (difficulty, theme, type), detail by slug
- `theme` — list all themes
- `type` — challenge types/categories (used in challenge listing filters)
- `user` — user profile/settings (needed for XP display and dashboard)
- `userProgress` — progression status, submission history, latest validation status per challenge
- `xpTransaction` — XP balance and transaction history

**Deferred to Phase 3:**
- `apiKey` — API key CRUD (depends on Better Auth apiKey plugin)
- `emailPreference` — email settings (user lifecycle, Phase 3+)
- `onboarding` — onboarding flow (Phase 3+)

### CLI transition strategy

- The Go CLI does NOT call tRPC endpoints — it calls `/api/cli/...` REST endpoints already
- Phase 2 exposes CLI submission endpoints at **both** `/api/cli/...` (existing path, preserved) and the canonical REST path `/api/challenges/:slug/submit`
- No alias routes for tRPC paths needed — the concern in STATE.md was based on a wrong assumption
- CLI-facing endpoints mounted in a dedicated Hono route group under `/api/cli`

### Auth middleware (Better Auth in Phase 2)

- Install Better Auth with Drizzle adapter in Phase 2 (no OAuth providers)
- Session reading works from Phase 2 onward — manually-created sessions usable for dev/testing
- OAuth provider configuration (GitHub, Google, Microsoft) deferred to Phase 3
- Better Auth handler mounted at `GET/POST /api/auth/*` with CORS middleware before it
- Drizzle adapter points to the **migrated schema in `apps/api`** (not the legacy `server/db/schema/`)
- Protected endpoints return 401 when no session exists — consistent with final behavior

### DB schema migration

- `server/db/schema/` migrated as-is into `apps/api/src/db/schema/` — no schema changes
- All 5 schema files migrated: auth, challenge, email, onboarding (even if not used in Phase 2 routes)
- Drizzle config in `apps/api` points to `apps/api/src/db/schema/`
- postgres.js replaces `@neondatabase/serverless` as the Drizzle driver

### Development workflow

- `docker-compose up` starts infra only: PostgreSQL, Redis, OTel Collector
- `turbo dev` from repo root starts `apps/api` (tsx watch) alongside other apps
- `apps/api` uses `tsx watch` as the dev runner — fast, no compilation step, ESM-compatible
- No `apps/api` service in docker-compose — apps run on host, infra runs in Docker

### Claude's Discretion

- Internal Hono route file structure (flat vs domain groups)
- Middleware stack ordering (cors → logger → session → routes)
- Rate limiting threshold for CLI submission endpoint (sliding window, ioredis)
- Error response shape (consistent 4xx/5xx JSON structure)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing tRPC routers (source of truth for business logic to port)
- `server/api/routers/challenge.ts` — challenge list/filter/detail logic
- `server/api/routers/theme.ts` — theme list logic
- `server/api/routers/type.ts` — challenge type list logic
- `server/api/routers/user.ts` — user profile logic
- `server/api/routers/userProgress.ts` — progress, submission, validation status logic
- `server/api/routers/xpTransaction.ts` — XP balance and history logic

### DB schema to migrate
- `server/db/schema/auth.ts` — user, session, account, verification, apikey tables
- `server/db/schema/challenge.ts` — challenge, theme, userProgress, userSubmission, xpTransaction, challengeObjective tables
- `server/db/schema/email.ts` — email preference table
- `server/db/schema/onboarding.ts` — onboarding table
- `server/db/schema/index.ts` — schema exports

### Shared packages (already built in Phase 1)
- `packages/api-schemas/src/challenges.ts` — Zod schemas for challenge endpoints
- `packages/api-schemas/src/themes.ts` — Zod schemas for theme endpoints
- `packages/api-schemas/src/progress.ts` — Zod schemas for progress/validation endpoints
- `packages/api-schemas/src/xp.ts` — Zod schemas for XP endpoints
- `packages/api-schemas/src/submissions.ts` — Zod schemas for CLI submission endpoint
- `packages/api-schemas/src/auth.ts` — Zod schemas for auth

### Requirements
- `.planning/REQUIREMENTS.md` §API — API-01 through API-08 (full requirements for this phase)

### Existing CLI integration (understand current contract)
- `types/cli-api.ts` — ObjectiveResult and Objective types used in submission payload

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/api-schemas` — All Zod request/response schemas already defined. Downstream agents should import from here, not redefine inline.
- `packages/jobs` — Queue definitions and JobPayload types. Import in apps/api for BullMQ dispatch.
- `server/db/schema/` — Complete Drizzle schema. Migrate as-is to `apps/api/src/db/schema/`.
- `drizzle.config.ts` — Reference for Drizzle config pattern (update driver and schema path for apps/api).
- `lib/auth.ts` — Current Better Auth config. Reference for adapter setup; apps/api gets its own instance.

### Established Patterns
- JIT package strategy (Phase 1 decision): `@kubeasy/api-schemas` and `@kubeasy/jobs` are TypeScript source, no build step. `tsx` in apps/api handles transpilation.
- `turbo dev` orchestration: apps start via turbo, infra via docker-compose. `apps/api` participates in the turbo dev pipeline.
- Rate limiting: Plan 02-04 uses ioredis sliding window (replaces Upstash). Threshold: HTTP 429 after threshold exceeded — verify with 100 req/10s script per success criteria.

### Integration Points
- `apps/api` connects to: PostgreSQL (postgres.js), Redis (ioredis), OTel Collector (OTLP HTTP)
- CLI calls `POST /api/cli/challenges/:slug/submit` — must also be available at `POST /api/challenges/:slug/submit`
- Better Auth mounts at `/api/auth/*` — CORS middleware must run before this handler
- turbo.json needs a `dev` pipeline entry for `apps/api`

</code_context>

<specifics>
## Specific Ideas

- The CLI currently calls `/api/cli/...` — this was a surprise finding (STATE.md assumption was wrong). Both path variants must be supported.
- Better Auth installed early (Phase 2) so session reading works from day one. OAuth wired in Phase 3.
- `turbo dev` as the single-command dev entrypoint — docker-compose for infra, turbo for apps.

</specifics>

<deferred>
## Deferred Ideas

- `apiKey` router — Phase 3 (requires Better Auth apiKey plugin)
- `emailPreference` router — Phase 3+
- `onboarding` router — Phase 3+
- OAuth providers (GitHub, Google, Microsoft) — Phase 3
- OpenAPI spec generation (`@hono/zod-openapi`) — v2 requirement (OPENAPI-01)

</deferred>

---

*Phase: 02-hono-api-migration*
*Context gathered: 2026-03-18*
