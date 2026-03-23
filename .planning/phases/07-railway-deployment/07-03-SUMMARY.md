---
phase: 07-railway-deployment
plan: "03"
subsystem: infra
tags: [railway, postgresql, redis, signoz, deployment, smoke-test]

# Dependency graph
requires:
  - phase: 07-railway-deployment-01
    provides: Dockerfiles for api and web services
  - phase: 07-railway-deployment-02
    provides: railway.json config-as-code per service
provides:
  - Railway project with PostgreSQL + Redis plugins injecting DATABASE_URL + REDIS_URL into api service
  - SigNoz deployed via Railway template, receiving OTLP from both api and web
  - Both services deployed, healthy, and accessible via custom domains
  - Full production smoke test passing end-to-end

affects: [production]

tech-stack:
  added: []
  patterns:
    - "Railway variable references: ${{Postgres.DATABASE_URL}} and ${{Redis.REDIS_URL}} for plugin env var injection"
    - "RAILWAY_CONFIG_PATH=apps/{service}/railway.json to point Railway at per-service config files"
    - "SigNoz via Railway template: signoz-otel-collector.railway.internal:4318 as OTLP endpoint"

key-files:
  created: []
  modified: []

key-decisions:
  - "Redis maxmemory-policy set to noeviction for BullMQ reliability"
  - "OTEL_EXPORTER_OTLP_ENDPOINT points to signoz-otel-collector Railway internal hostname"
  - "Custom domains: api.kubeasy.dev for api service, kubeasy.dev for web service"

requirements-completed: [DEPLOY-03, DEPLOY-04]

# Metrics
duration: human-action
completed: 2026-03-23
---

# Phase 7 Plan 03: Railway Production Environment Summary

**Railway project fully deployed: PostgreSQL + Redis plugins, SigNoz template, both services live on custom domains, full smoke test passing.**

## Performance

- **Duration:** human-action (Railway dashboard configuration)
- **Completed:** 2026-03-23
- **Tasks:** 2
- **Files modified:** 0 (infrastructure configuration only)

## Accomplishments

- Railway project created with PostgreSQL and Redis plugins providing DATABASE_URL and REDIS_URL to the api service
- Redis maxmemory-policy set to noeviction for BullMQ reliability
- SigNoz deployed via Railway template; otel-collector receives OTLP from both kubeasy-api and kubeasy-web
- api service deployed via Dockerfile builder with RAILWAY_CONFIG_PATH=apps/api/railway.json
- web service deployed via Dockerfile builder with RAILWAY_CONFIG_PATH=apps/web/railway.json
- Both services accessible via custom domains (api.kubeasy.dev, kubeasy.dev)
- All production env vars configured with Railway variable references for plugins

## Smoke Test Results

All 7 checks passed:

1. **API health** — `curl https://api.kubeasy.dev/api/health` returned `{"status":"ok"}`
2. **Web app** — https://kubeasy.dev landing page and /blog render correctly
3. **Authentication** — OAuth login completes successfully, session active, dashboard renders
4. **Challenges** — /challenges loads and displays challenges from the API
5. **SigNoz traces** — Traces visible from both `kubeasy-api` and `kubeasy-web` services
6. **Watch paths** — Monorepo watch patterns scoped correctly per service
7. **SSE real-time** — Challenge validation updates propagate in real-time

## Issues Encountered

None.

---
*Phase: 07-railway-deployment*
*Completed: 2026-03-23*
