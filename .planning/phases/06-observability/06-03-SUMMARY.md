---
phase: 06-observability
plan: "03"
subsystem: apps/web SSR observability
tags: [otel, instrumentation, ssr, tanstack-start, tracing, logging]
dependency_graph:
  requires: [06-01]
  provides: [OBS-03]
  affects: [apps/web]
tech_stack:
  added:
    - "@opentelemetry/sdk-node@0.213.0"
    - "@opentelemetry/resources@2.6.0"
    - "@opentelemetry/exporter-trace-otlp-http@0.213.0"
    - "@opentelemetry/exporter-logs-otlp-http@0.213.0"
    - "@opentelemetry/exporter-metrics-otlp-http@0.213.0"
    - "@opentelemetry/sdk-logs@0.213.0"
    - "@opentelemetry/sdk-metrics@2.6.0"
    - "@opentelemetry/instrumentation-http@0.213.0"
    - "@opentelemetry/instrumentation-pino@0.59.0"
    - "@kubeasy/logger@workspace:*"
    - "pino@^10.3.1"
    - "pino-pretty@^13.1.3 (devDep)"
  patterns:
    - "NodeSDK init in server.tsx first import — ensures OTel patches before route loaders"
    - "createStartHandler(defaultStreamHandler) — correct v1.166.x API (no createRouter prop)"
key_files:
  created:
    - apps/web/src/instrumentation.ts
    - apps/web/src/server.tsx
  modified:
    - apps/web/package.json
    - apps/web/vite.config.ts
decisions:
  - id: "server-entry-api"
    summary: "createStartHandler takes callback directly (not {createRouter}) — research doc had stale API shape; actual signature is createStartHandler(defaultStreamHandler)"
  - id: "no-pg-ioredis-in-web"
    summary: "apps/web instrumentation omits PgInstrumentation and IORedisInstrumentation — those connections only exist in apps/api"
metrics:
  duration_seconds: 207
  completed_date: "2026-03-21"
  tasks_completed: 2
  files_changed: 4
---

# Phase 6 Plan 03: apps/web SSR OTel Instrumentation Summary

**One-liner:** NodeSDK with HttpInstrumentation + PinoInstrumentation wired into apps/web SSR via server.tsx first-import pattern — HTTP spans and pino log records exported via OTLP to Collector/SigNoz.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Install OTel SDK packages in apps/web and add @kubeasy/logger | 2a86879f2 | apps/web/package.json, pnpm-lock.yaml |
| 2 | Create SSR instrumentation.ts and server.tsx entry | 65e74e7ae | apps/web/src/instrumentation.ts, apps/web/src/server.tsx, apps/web/vite.config.ts |

## What Was Built

- **`apps/web/src/instrumentation.ts`**: NodeSDK initialized with `service.name: "kubeasy-web"`, OTLP exporters for traces/logs/metrics, `HttpInstrumentation` (HTTP client/server spans) and `PinoInstrumentation` (trace context injection into pino log records). No pg/ioredis instrumentations — those are api-only.

- **`apps/web/src/server.tsx`**: TanStack Start SSR server entry that imports `./instrumentation` as its absolute first import, ensuring the OTel SDK patches http and pino before any route loader code runs. Uses `createStartHandler(defaultStreamHandler)` — the correct v1.166.x API.

- **`apps/web/vite.config.ts`**: Added `server: { entry: "./src/server.tsx" }` inside the `tanstackStart()` plugin options to configure the SSR server entry.

## Verification

- `pnpm -r typecheck` passes across all 6 workspace packages
- `apps/web/src/instrumentation.ts` contains `new NodeSDK(`, `HttpInstrumentation`, `PinoInstrumentation`
- `apps/web/src/instrumentation.ts` does NOT contain `PgInstrumentation`, `IORedisInstrumentation`, or any `@kubeasy/` import
- `apps/web/src/server.tsx` first import is `import "./instrumentation"`
- `apps/web/vite.config.ts` contains reference to `server.tsx` as server entry

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] createStartHandler API shape correction**
- **Found during:** Task 2
- **Issue:** The research doc and plan specified `createStartHandler({ createRouter: getRouter })(defaultStreamHandler)` — but the actual v1.166.x type definition (`CreateStartHandlerOptions`) only accepts `{ handler: HandlerCallback }`. The `createRouter` property does not exist. TypeScript reported errors TS2353 and TS2345 on first attempt.
- **Fix:** Changed `server.tsx` to use `createStartHandler(defaultStreamHandler)` — the backwards-compatible callback-only form. The router is loaded automatically by the Vite plugin via virtual modules (`#tanstack-router-entry`), not passed via `createRouter`.
- **Files modified:** `apps/web/src/server.tsx`
- **Commit:** 65e74e7ae

## Self-Check: PASSED

All 3 key files exist on disk. Both task commits (2a86879f2, 65e74e7ae) verified in git log.
