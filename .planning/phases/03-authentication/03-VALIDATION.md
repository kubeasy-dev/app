---
phase: 3
slug: authentication
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing in monorepo) |
| **Config file** | `apps/api/vitest.config.ts` (or Wave 0 installs) |
| **Quick run command** | `pnpm --filter @kubeasy/api test --run` |
| **Full suite command** | `pnpm --filter @kubeasy/api test --run && pnpm typecheck` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @kubeasy/api test --run`
- **After every plan wave:** Run `pnpm --filter @kubeasy/api test --run && pnpm typecheck`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 03-01 | 1 | AUTH-01 | integration | `pnpm --filter @kubeasy/api test --run auth` | ❌ W0 | ⬜ pending |
| 3-01-02 | 03-01 | 1 | AUTH-01 | integration | `pnpm --filter @kubeasy/api test --run auth` | ❌ W0 | ⬜ pending |
| 3-02-01 | 03-02 | 2 | AUTH-02, AUTH-04 | integration | `pnpm --filter @kubeasy/api test --run oauth` | ❌ W0 | ⬜ pending |
| 3-02-02 | 03-02 | 2 | AUTH-03 | integration | `pnpm --filter @kubeasy/api test --run cookie` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03-03 | 2 | AUTH-05 | unit | `pnpm --filter @kubeasy/api test --run api-key` | ❌ W0 | ⬜ pending |
| 3-04-01 | 03-04 | 3 | AUTH-06 | manual | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/__tests__/auth.test.ts` — stubs for AUTH-01 (Better Auth Hono mount, Drizzle adapter)
- [ ] `apps/api/src/__tests__/oauth.test.ts` — stubs for AUTH-02, AUTH-04 (OAuth providers, trustedOrigins)
- [ ] `apps/api/src/__tests__/cookie.test.ts` — stubs for AUTH-03 (crossSubdomainCookies)
- [ ] `apps/api/src/__tests__/api-key.test.ts` — stubs for AUTH-05 (API key middleware)
- [ ] vitest installed in `apps/api` if not already present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Session cookie scoped to `.kubeasy.dev` on staging | AUTH-03 | Requires live subdomain environment | Log in via OAuth on staging, inspect cookie domain in browser devtools — must show `.kubeasy.dev` |
| `credentials: "include"` end-to-end on staging | AUTH-06 | Requires deployed web+api split | Open Network tab, trigger authenticated request, verify `Cookie` header is sent cross-origin |
| CORS preflight with `User-Agent` header | AUTH-04 | Requires real browser preflight | Use `curl -X OPTIONS` with `Access-Control-Request-Headers: User-Agent` — expect 200, not 403 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
