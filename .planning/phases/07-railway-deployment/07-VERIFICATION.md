---
phase: 07-railway-deployment
verified: 2026-03-23T00:00:00Z
status: verified
score: 6/6 must-haves verified
human_verification: []
---

# Phase 7: Railway Deployment Verification Report

**Phase Goal:** Deploy the Kubeasy monorepo to Railway — Hono API and TanStack Start web as separate services with PostgreSQL, Redis, SigNoz, and full OTel observability in production.
**Verified:** 2026-03-23
**Status:** verified (all checks passing — human smoke test confirmed)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | apps/api Dockerfile builds successfully via turbo prune --docker 3-stage pattern | VERIFIED | 07-01-SUMMARY: Docker image builds, tsc emits dist/, container starts as appuser on port 3001 |
| 2 | apps/web Dockerfile builds successfully via turbo prune --docker 3-stage pattern | VERIFIED | 07-01-SUMMARY: Docker image builds, Vinxi/TanStack Start outputs dist/server/server.js, container starts on port 3000 |
| 3 | railway.json per service uses DOCKERFILE builder with monorepo watch patterns | VERIFIED | apps/api/railway.json + apps/web/railway.json: both use watchPatterns for apps/{service}/** + packages/** |
| 4 | Railway project has PostgreSQL + Redis plugins injecting DATABASE_URL + REDIS_URL into api service | VERIFIED | Human confirmed: Railway dashboard shows plugins, DATABASE_URL and REDIS_URL injected via ${{Postgres.DATABASE_URL}} and ${{Redis.REDIS_URL}} |
| 5 | Redis maxmemory-policy is noeviction for BullMQ reliability | VERIFIED | Human confirmed: CONFIG GET maxmemory-policy returns noeviction |
| 6 | Both services deployed, healthy, accessible via custom domains, full smoke test passing | VERIFIED | Human confirmed: all 7 smoke test checks passed (API health, web render, auth, challenges, SigNoz traces, watch paths, SSE) |

**Score:** 6/6 truths verified

---

### Required Artifacts

| Artifact | Purpose | Status | Details |
|----------|---------|--------|---------|
| `apps/api/Dockerfile` | 3-stage turbo prune build for Hono API | VERIFIED | Multi-stage with pruner/builder/runner, non-root user, port 3001 |
| `apps/api/.dockerignore` | Excludes build artifacts from Docker context | VERIFIED | node_modules, .env, dist, .turbo, .git excluded |
| `apps/web/Dockerfile` | 3-stage turbo prune build for TanStack Start web | VERIFIED | Multi-stage with pruner/builder/runner, non-root user, port 3000 |
| `apps/web/.dockerignore` | Excludes build artifacts from Docker context | VERIFIED | node_modules, .env, dist, .turbo, .git excluded |
| `apps/api/railway.json` | Railway config-as-code for api service | VERIFIED | DOCKERFILE builder, watch patterns, /api/health healthcheck, OTel start command |
| `apps/web/railway.json` | Railway config-as-code for web service | VERIFIED | DOCKERFILE builder, watch patterns, / healthcheck, node dist/server/server.js start command |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| Railway api service | PostgreSQL plugin | DATABASE_URL env var | WIRED | ${{Postgres.DATABASE_URL}} variable reference in Railway dashboard |
| Railway api service | Redis plugin | REDIS_URL env var | WIRED | ${{Redis.REDIS_URL}} variable reference in Railway dashboard |
| Railway api + web services | signoz-otel-collector | OTEL_EXPORTER_OTLP_ENDPOINT | WIRED | http://signoz-otel-collector.railway.internal:4318 |
| apps/api railway.json | apps/api/Dockerfile | RAILWAY_CONFIG_PATH service var | WIRED | RAILWAY_CONFIG_PATH=apps/api/railway.json set on Railway dashboard |
| apps/web railway.json | apps/web/Dockerfile | RAILWAY_CONFIG_PATH service var | WIRED | RAILWAY_CONFIG_PATH=apps/web/railway.json set on Railway dashboard |

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DEPLOY-01 | 07-01 | Dockerfiles for api and web build via turbo prune --docker | SATISFIED | Both images build locally and on Railway; Docker builder confirmed in build logs |
| DEPLOY-02 | 07-02 | railway.json per-service config with watch patterns and health checks | SATISFIED | apps/api/railway.json and apps/web/railway.json with monorepo watch patterns |
| DEPLOY-03 | 07-03 | Railway project has PostgreSQL + Redis plugins, env vars injected, Redis noeviction | SATISFIED | Human confirmed: plugins provisioned, DATABASE_URL + REDIS_URL injected, noeviction set |
| DEPLOY-04 | 07-03 | SigNoz deployed, both services send OTLP, full smoke test passes | SATISFIED | Human confirmed: SigNoz traces visible from kubeasy-api and kubeasy-web in production |

---

### Anti-Patterns Found

None.

---

## Notes on Deviations

**Plan 07-01 — Vinxi output path:** Plan specified `.output/server/index.mjs` but TanStack Start v1.166.x/Vinxi outputs to `dist/server/server.js`. Auto-fixed in Dockerfile CMD and propagated to railway.json startCommand in Plan 07-02.

**Plan 07-01 — Prerender scope:** Build-time prerender restricted to `/` only (crawlLinks:false, autoStaticPathsDiscovery:false) to prevent API calls during Docker build. SSR works correctly at runtime.

---

_Verified: 2026-03-23_
_Verifier: Claude (gsd-verifier) + human smoke test_
