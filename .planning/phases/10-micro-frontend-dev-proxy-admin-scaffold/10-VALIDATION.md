---
phase: 10
slug: micro-frontend-dev-proxy-admin-scaffold
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing, `pnpm test`) |
| **Config file** | `vitest.config.ts` (per-app) |
| **Quick run command** | `pnpm typecheck` |
| **Full suite command** | `pnpm test:run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm typecheck`
- **After every plan wave:** Run `pnpm test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | MFE-01 | config | `cat apps/web/microfrontends.json` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | MFE-01 | integration | `pnpm typecheck` | ✅ | ⬜ pending |
| 10-02-01 | 02 | 1 | MFE-02 | scaffold | `ls apps/admin/src` | ❌ W0 | ⬜ pending |
| 10-02-02 | 02 | 1 | ADMIN-01 | type | `pnpm typecheck` | ✅ | ⬜ pending |
| 10-03-01 | 03 | 2 | ADMIN-01 | manual | see manual table | — | ⬜ pending |
| 10-03-02 | 03 | 2 | ADMIN-02 | manual | see manual table | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/microfrontends.json` — MFE proxy config (MFE-01)
- [ ] `apps/admin/` directory scaffold — new Vite SPA app (MFE-02, ADMIN-01, ADMIN-02)
- [ ] `apps/admin/package.json` — with correct `name`, scripts, and deps
- [ ] `apps/admin/vite.config.ts` — with `base: "/admin/"` and proxy settings
- [ ] `apps/admin/src/main.tsx` and `src/App.tsx` skeleton

*All wave 0 items must exist before wave 1 implementation tasks begin.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dev proxy routes all 3 apps through `localhost:3024` | MFE-01 | Requires running `pnpm dev` + browser | Run `pnpm dev`, visit `localhost:3024`, `localhost:3024/api/health`, `localhost:3024/admin` |
| Non-admin redirect to main site | ADMIN-02 | Requires authenticated session state | Log in as non-admin, visit `localhost:3024/admin`, confirm redirect |
| Admin shell renders without errors | ADMIN-01 | Requires admin user + session | Log in as admin, visit `localhost:3024/admin`, confirm shell layout and nav render |
| `vite build` assets load at `/admin/` path | MFE-02 | Requires build + static serve | Run `pnpm --filter @kubeasy/admin build`, serve, confirm no 404s on sub-path assets |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
