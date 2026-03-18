---
phase: 1
slug: monorepo-scaffold
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (for packages) + CLI commands (turbo, pnpm, docker) |
| **Config file** | `packages/*/vitest.config.ts` (Wave 0 installs) |
| **Quick run command** | `turbo run typecheck` |
| **Full suite command** | `turbo run build && docker compose up -d && sleep 5 && docker compose ps` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `turbo run typecheck`
- **After every plan wave:** Run `turbo run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | INFRA-01 | CLI | `test -f turbo.json && test -f pnpm-workspace.yaml` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | INFRA-02 | CLI | `turbo run build --dry-run 2>&1 \| grep -q "tasks"` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | INFRA-03 | CLI | `cat turbo.json \| jq '.tasks'` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | INFRA-04 | CLI | `turbo build --dry-run --summarize 2>&1 \| grep -E "DATABASE_URL\|REDIS_URL"` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | PKG-01 | CLI | `cd packages/typescript-config && pnpm typecheck` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 2 | PKG-02 | CLI | `cd packages/api-schemas && pnpm typecheck` | ❌ W0 | ⬜ pending |
| 1-02-03 | 02 | 2 | PKG-03 | CLI | `cd packages/jobs && pnpm typecheck` | ❌ W0 | ⬜ pending |
| 1-02-04 | 02 | 2 | PKG-04 | CLI | `cd packages/api-schemas && node -e "require('./src/index.ts')"` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 3 | INFRA-03 | CLI | `test -f docker-compose.yml && docker compose config --quiet` | ❌ W0 | ⬜ pending |
| 1-03-02 | 03 | 3 | INFRA-03 | CLI | `docker compose up -d && sleep 5 && docker compose ps \| grep -E "postgres.*running\|redis.*running"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Verify `turbo.json` uses `tasks` not `pipeline` (Turborepo 2.0)
- [ ] Verify `pnpm-workspace.yaml` contains `packages/*` glob
- [ ] Each package has a `package.json` with correct `exports` field
- [ ] `docker-compose.yml` passes `docker compose config --quiet`

*Wave 0 is purely scaffold validation — no test framework needed for infra phase.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `docker compose up` services reachable on ports | INFRA-03 | Requires live Docker daemon | Run `docker compose up -d` then `nc -z localhost 5432` (PG), `nc -z localhost 6379` (Redis), `nc -z localhost 8888` (OTel zpages) |
| JIT package resolution in apps/web | PKG-01 | Requires running Next.js | Run `pnpm dev` in apps/web and verify no module-not-found errors for `@kubeasy/api-schemas` |
| Turbo cache env vars in summary | INFRA-04 | Requires `--summarize` flag parsing | Run `turbo build --dry-run --summarize` and inspect JSON output for `DATABASE_URL`, `REDIS_URL`, `BETTER_AUTH_SECRET` in env inputs |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
