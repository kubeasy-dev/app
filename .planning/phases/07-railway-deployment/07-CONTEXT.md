# Phase 7: Railway Deployment - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy both services to Railway in production: multi-stage Dockerfiles using `turbo prune --docker`, per-service watch paths via `railway.json`, Railway PostgreSQL + Redis plugins replacing docker-compose local infra, and SigNoz as the production observability backend (apps send OTLP directly — no OTel Collector on Railway).

</domain>

<decisions>
## Implementation Decisions

### OTel backend (supersedes DEPLOY-04 and ROADMAP.md Phase 7 goal)
- **DEPLOY-04 is superseded** — no OTel Collector on Railway in production
- Phase 6 context decision stands: apps send OTLP directly to SigNoz
- SigNoz runs as a Railway service in **the same Railway project** as api + web
- Both `apps/api` and `apps/web` SSR send OTLP to SigNoz in production
- `OTEL_EXPORTER_OTLP_ENDPOINT` = Railway internal hostname (e.g., `http://signoz.railway.internal:4318`)
- No public exposure of SigNoz endpoint needed — Railway internal networking used

### Railway service topology
- **Production only** — no staging environment for Phase 7 (can add later)
- One Railway project with the following services:
  - `api` — `apps/api` Hono Node.js server (Dockerfile)
  - `web` — `apps/web` TanStack Start SSR Node.js server (Dockerfile)
  - `signoz` — SigNoz service for observability
  - PostgreSQL plugin (Railway-managed)
  - Redis plugin (Railway-managed)
- Both `api` and `web` use multi-stage **Dockerfiles** (not Nixpacks) — required for `turbo prune --docker`
- `apps/web` runs as a Node.js SSR server that handles all requests; landing/blog pages pre-rendered at build time and served from the same process (no separate CDN or static host)

### Watch paths strategy
- All `packages/` changes trigger rebuild of **both** api and web services — no fine-grained per-package mapping
- Watch paths configured via **`railway.json` per app** (checked into git at `apps/api/railway.json` and `apps/web/railway.json`)
- Watch paths per service:
  - `api`: `apps/api/**`, `packages/**`
  - `web`: `apps/web/**`, `packages/**`

### Environment variable management
- Railway PostgreSQL plugin auto-injects `DATABASE_URL` — used as-is (no renaming)
- Railway Redis plugin auto-injects `REDIS_URL` — used as-is (no renaming)
- `OTEL_EXPORTER_OTLP_ENDPOINT` set to Railway internal SigNoz hostname for both api and web
- All other env vars (Better Auth, OAuth providers, Resend, PostHog) set as Railway service variables
- Variable naming stays ISO with docker-compose local env — same names, different values

### Production server entry points (confirmed from code + docs)
- **apps/api**: `node --import ./dist/instrumentation.js dist/index.js` (from `apps/api/package.json` start script — Dockerfile CMD must replicate exactly)
- **apps/web**: `node .output/server/index.mjs` (TanStack Start Vinxi build output — NOT `vite preview` which is dev-only)
- `apps/web/package.json` `start` script (`vite preview`) is wrong for production — Dockerfile must override with the correct command

### Dockerfile structure (Turborepo 3-stage pattern)
- **Stage 1 — Prepare**: Install turbo globally, run `turbo prune @kubeasy/<app> --docker` → produces `out/json` (package.json files only) and `out/full` (complete source)
- **Stage 2 — Builder**: Copy `out/json`, `pnpm install --frozen-lockfile`, copy `out/full`, run `turbo run build --filter=@kubeasy/<app>`
- **Stage 3 — Runner**: Copy only built artifacts from builder, set `NODE_ENV=production`, non-root user, expose port, set CMD
- Base image: `node:22-alpine` (current LTS at time of Phase 6)
- Non-root user: create `appgroup`/`appuser` in alpine pattern (`addgroup -S` / `adduser -S`)
- `pnpm` must be installed in the Prepare and Builder stages (not available by default in alpine)

### apps/web prerender (already configured)
- `vite.config.ts` already has `prerender: { enabled: true, crawlLinks: true, autoStaticPathsDiscovery: true }` — static pages are pre-rendered at build time automatically, no extra config needed
- After `vite build`, `.output/server/index.mjs` serves both pre-rendered static pages and SSR pages from the same Node.js process

### Claude's Discretion
- SigNoz Docker image version and Railway service config
- Health check endpoint config (`/health` route on api) and Railway health check settings
- Exact `.dockerignore` contents per app
- Whether to use `turbo run build --filter=@kubeasy/<app>` or `pnpm build` in builder stage

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 6 context (observability decisions that carry into this phase)
- `.planning/phases/06-observability/06-CONTEXT.md` — SigNoz as prod backend, no Collector on Railway, OTLP direct from apps, `OTEL_EXPORTER_OTLP_ENDPOINT` usage

### Existing infra
- `docker-compose.yml` — Local postgres + redis services; env var names must match Railway plugin injected names
- `apps/api/package.json` — `start` script: `node --import ./dist/instrumentation.js dist/index.js` — Dockerfile CMD must replicate this exactly
- `apps/web/vite.config.ts` — Prerender config (`crawlLinks`, `autoStaticPathsDiscovery`) already in place; `tanstackStart` plugin with `server.entry: './src/server.tsx'`
- `apps/web/src/server.tsx` — SSR entry: `createStartHandler(defaultStreamHandler)` from `@tanstack/react-start/server`

### External documentation reviewed
- [TanStack Start hosting guide](https://tanstack.com/start/latest/docs/framework/react/guide/hosting) — Railway is an official hosting partner; production command is `node .output/server/index.mjs`
- [Turborepo Docker guide](https://turborepo.dev/docs/guides/tools/docker) — 3-stage pattern, `--docker` flag produces `out/json` + `out/full`, enables Docker layer caching for deps vs source separately
- [Hono Node.js guide](https://hono.dev/docs/getting-started/nodejs) — `serve()` from `@hono/node-server`, graceful SIGTERM shutdown pattern
- [Hono Docker guide](https://oneuptime.com/blog/post/2026-02-08-how-to-containerize-a-hono-application-with-docker/view) — node:alpine multi-stage, non-root user (`addgroup -S` / `adduser -S`), `CMD ["node", "dist/index.js"]`

### Requirements
- `.planning/REQUIREMENTS.md` §DEPLOY-01 — Multi-stage Dockerfile with `turbo prune --scope --docker`
- `.planning/REQUIREMENTS.md` §DEPLOY-02 — Watch paths + `Root Directory` per service
- `.planning/REQUIREMENTS.md` §DEPLOY-03 — Railway PostgreSQL + Redis plugins, env var parity
- (DEPLOY-04 superseded by Phase 6 context — SigNoz direct, no Collector)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docker-compose.yml`: Local infra reference — postgres and redis config, env var names (`DATABASE_URL`, `REDIS_URL`) already matching Railway plugin defaults
- `apps/api/src/instrumentation.ts`: OTel init file loaded via `--import` flag — must be included in Dockerfile runner stage
- `packages/logger`, `packages/api-schemas`, `packages/jobs`: Workspace packages that both apps import — must be pruned correctly by `turbo prune --docker`

### Established Patterns
- `apps/api` CMD: `node --import ./dist/instrumentation.js dist/index.js` — must preserve `--import` flag for OTel init before postgres pool creation
- `apps/web` CMD: `node .output/server/index.mjs` — Vinxi/TanStack Start build output; `vite preview` in package.json is dev-only, Dockerfile ignores it
- Monorepo uses pnpm workspaces — Dockerfiles must use `pnpm install --frozen-lockfile` with the pruned lockfile from `turbo prune --docker`
- `turbo prune` produces `out/json` (dep layer, changes rarely) and `out/full` (source, changes often) — copy them in separate COPY commands to maximize Docker cache hits

### Integration Points
- `apps/api/railway.json` — New file to create with watch paths + build config
- `apps/web/railway.json` — New file to create with watch paths + build config
- `apps/api/Dockerfile` — New multi-stage file: prune → install → build → run
- `apps/web/Dockerfile` — New multi-stage file: prune → install → build → run
- Railway project services reference each other via Railway internal networking (`*.railway.internal`)

</code_context>

<specifics>
## Specific Ideas

- SigNoz internal Railway hostname pattern: `http://signoz.railway.internal:4318` — planner should verify exact Railway internal DNS format
- `turbo prune --scope=@kubeasy/api --docker` produces a minimal `out/` directory with only the files needed for the target app — this is the pruned context passed to Docker
- The Phase 7 success criteria success criteria #4 ("OTel Collector as Railway service") is replaced by: "SigNoz receives OTLP from deployed apps/api and apps/web — traces visible in SigNoz UI"

</specifics>

<deferred>
## Deferred Ideas

- Staging environment on Railway — intentionally skipped for v1, easy to add as a new Railway environment later
- Fine-grained watch paths per package (only rebuilding apps that actually import the changed package) — current "all packages → all apps" approach is simpler and sufficient for v1
- Separate CDN/static host for landing + blog pages — deferred, web SSR server handles everything for now
- SigNoz public dashboard access — not configured in Phase 7, internal Railway access only

</deferred>

---

*Phase: 07-railway-deployment*
*Context gathered: 2026-03-21*
