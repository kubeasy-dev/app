---
phase: 4
slug: web-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (existing in repo) |
| **Config file** | `apps/web/vitest.config.ts` — Wave 0 gap |
| **Quick run command** | `pnpm --filter=web test:run` |
| **Full suite command** | `pnpm --filter=web test:run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter=web typecheck`
- **After every plan wave:** Run `pnpm --filter=web test:run && pnpm --filter=web typecheck`
- **Before `/gsd:verify-work`:** Full suite must be green + manual smoke of SSG output
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-* | 01 | 1 | WEB-01 | smoke | `pnpm --filter=web typecheck` | ❌ W0 | ⬜ pending |
| 4-02-* | 02 | 1 | WEB-02, WEB-07 | unit | `pnpm --filter=web test:run -- api-client` | ❌ W0 | ⬜ pending |
| 4-03-* | 03 | 2 | WEB-04 | smoke | `ls apps/web/.output/public/ \| grep index.html` | ❌ W0 | ⬜ pending |
| 4-04-* | 04 | 3 | WEB-03, WEB-05 | integration | manual (inspect HTML for pre-rendered data) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/vitest.config.ts` — test framework config for apps/web
- [ ] `apps/web/src/__tests__/api-client.test.ts` — stubs for WEB-02, WEB-07 (credentials:include + typed return)
- [ ] Framework install: `pnpm add -D vitest @vitejs/plugin-react` in apps/web — if not already from scaffold

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Route loaders populate queryClient before render | WEB-03 | Requires inspecting dehydrated state in HTML | View page source, check for `__TANSTACK_ROUTER_DEHYDRATED__` or similar JSON blob |
| SSG build output contains pre-rendered HTML files | WEB-04 | Build artifact check | After `pnpm --filter=web build`, run `ls apps/web/.output/public/` — expect index.html, blog/index.html, blog/[slug]/index.html |
| Challenge listing renders without loading spinner | WEB-05 | Requires visual/playwright check | Open in browser, disable JS, verify challenge cards render |
| Auth redirect: unauthenticated → /login | WEB-05 | Requires browser session state | Visit /dashboard without session — confirm redirect to /login |
| Post-login redirect returns to previous page | CONTEXT | Requires OAuth flow | Sign in via GitHub from /challenges/my-challenge — confirm landing back at /challenges/my-challenge |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
