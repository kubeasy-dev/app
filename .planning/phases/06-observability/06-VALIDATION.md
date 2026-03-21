---
phase: 6
slug: observability
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.0 |
| **Config file** | `apps/api/vitest.config.ts` (exists) |
| **Quick run command** | `cd apps/api && pnpm test:run` |
| **Full suite command** | `pnpm -r test:run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm -r typecheck`
- **After every plan wave:** Run `pnpm -r test:run` + manual Collector smoke test
- **Before `/gsd:verify-work`:** Full suite must be green + Collector debug output shows HTTP + DB span pair
- **Max feedback latency:** 30 seconds (typecheck); ~5 min (smoke test)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-00-01 | 00 | 1 | OBS-02 | type | `pnpm -r typecheck` | ✅ | ⬜ pending |
| 6-01-01 | 01 | 1 | OBS-01 | manual | `curl http://localhost:55679` after `docker-compose up` | N/A | ⬜ pending |
| 6-02-01 | 02 | 2 | OBS-02 | unit | `cd apps/api && pnpm test:run` | ❌ W0 | ⬜ pending |
| 6-02-02 | 02 | 2 | OBS-04 | type | `pnpm -r typecheck` | ✅ | ⬜ pending |
| 6-03-01 | 03 | 2 | OBS-03 | type | `pnpm -r typecheck` | ✅ | ⬜ pending |
| 6-04-01 | 04 | 3 | OBS-04 | type | `pnpm -r typecheck` | ✅ | ⬜ pending |
| 6-04-02 | 04 | 3 | OBS-05 | smoke | `docker-compose logs otel-collector` shows HTTP + DB span | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/__tests__/instrumentation-order.test.ts` — validates SDK starts before Pool creation (unit test with mock); covers OBS-02
- [ ] `packages/logger/src/__tests__/logger.test.ts` — validates logger API shape (info/warn/error/debug signatures); covers OBS-04
- [ ] `pnpm add -D vitest` in `packages/logger` — if logger package needs unit tests

*Wave 0 creates test stubs; smoke tests for OBS-05 remain manual (infrastructure wiring, not application logic).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| zpages admin port on localhost:55679 | OBS-01 | Config file check — not application code | `docker-compose up otel-collector && curl http://localhost:55679` — expect zpages HTML response |
| HTTP span + DB child span in Collector logs | OBS-05 | Verifies infrastructure wiring between SDK, Pool, and Collector | `docker-compose up && curl http://localhost:3001/api/challenges -H "Authorization: Bearer <key>"` then `docker-compose logs otel-collector` — look for `pg.query` span nested under HTTP server span |
| Web SSR produces HTTP spans in Collector | OBS-03 | Verifies Vite SSR server entry loads instrumentation first | Hit `http://localhost:3000` after `docker-compose up` + `pnpm dev`; inspect Collector logs for `kubeasy-web` service spans |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s (typecheck path)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
