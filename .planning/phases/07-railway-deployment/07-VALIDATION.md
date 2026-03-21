---
phase: 7
slug: railway-deployment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell scripts + Docker build verification + Railway CLI |
| **Config file** | none — infrastructure/deployment phase |
| **Quick run command** | `docker build --no-cache -f apps/api/Dockerfile .` |
| **Full suite command** | `docker build -f apps/api/Dockerfile . && docker build -f apps/web/Dockerfile .` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `docker build --no-cache -f apps/<app>/Dockerfile .`
- **After every plan wave:** Run full Docker build for both services
- **Before `/gsd:verify-work`:** Both Docker images build and Railway services deploy
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | DEPLOY-01 | build | `docker build -f apps/api/Dockerfile .` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | DEPLOY-01 | build | `docker build -f apps/web/Dockerfile .` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | DEPLOY-02 | config | `cat apps/api/railway.json \| jq .` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 2 | DEPLOY-02 | config | `cat apps/web/railway.json \| jq .` | ❌ W0 | ⬜ pending |
| 07-03-01 | 03 | 2 | DEPLOY-03 | manual | Railway dashboard verification | N/A | ⬜ pending |
| 07-04-01 | 04 | 3 | DEPLOY-04 | manual | OTel trace verification in SigNoz | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/Dockerfile` — multi-stage Dockerfile with turbo prune
- [ ] `apps/web/Dockerfile` — multi-stage Dockerfile with turbo prune
- [ ] `apps/api/railway.json` — Railway config-as-code
- [ ] `apps/web/railway.json` — Railway config-as-code

*Wave 0: Create Dockerfiles and railway.json files before verifying builds.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Watch paths trigger only correct service | DEPLOY-02 | Requires Railway deployment + git push | Push change to `apps/web/`, verify only `web` service redeploys |
| PostgreSQL plugin connectivity | DEPLOY-03 | Requires Railway environment | Check Railway dashboard, verify DATABASE_URL injected |
| Redis plugin connectivity | DEPLOY-03 | Requires Railway environment | Check Railway dashboard, verify REDIS_URL injected |
| OTel traces in SigNoz | DEPLOY-04 | Requires deployed SigNoz + traffic | Login flow → check SigNoz traces panel |
| End-to-end smoke test | DEPLOY-04 | Full stack integration | Login, view challenge, CLI submit, SSE update |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
