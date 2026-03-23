---
phase: quick
plan: 260323-nnr
subsystem: tooling
tags: [knip, biome, renovate, monorepo, cleanup]
dependency_graph:
  requires: []
  provides: [monorepo-aware-knip, monorepo-aware-biome, monorepo-aware-renovate]
  affects: [tooling-ci]
tech_stack:
  added: []
  patterns: [workspace-aware-knip, biome-generated-file-exclusion, renovate-monorepo-grouping]
key_files:
  created: []
  modified:
    - knip.json
    - biome.json
    - apps/web/.env.example
    - .github/workflows/scheduled-maintenance.yml
    - renovate.json
  deleted:
    - eslint.config.mjs
    - vercel.json
    - .dockerignore
    - apps/web/.dockerignore
    - apps/api/.dockerignore
    - .env (untracked, deleted locally)
decisions:
  - knip workspaces config replaces single-project flat config
  - biome excludes routeTree.gen.ts (TanStack Router generated file) to avoid false diffs
  - renovate group:monorepos preset groups TanStack/OpenTelemetry/Radix updates into fewer PRs
metrics:
  duration: "~17 min"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 11
  completed_date: "2026-03-23"
---

# Phase quick Plan 260323-nnr: Monorepo Tooling Alignment Summary

**One-liner:** Replaced single-project knip/biome configs with workspace-aware monorepo configs, deleted Next.js/Vercel legacy artifacts, and added renovate monorepo grouping presets.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update knip and biome configs for monorepo | 9d743193e | knip.json, biome.json, eslint.config.mjs (deleted) |
| 2 | Clean .env files, delete obsolete files, update maintenance workflow | e16a380eb | apps/web/.env.example, .github/workflows/scheduled-maintenance.yml, vercel.json/dockerignores (deleted) |
| 3 | Update Renovate config for monorepo support | b9c3f65c9 | renovate.json |

## What Was Built

### knip.json
Replaced flat single-project config with workspace-aware `workspaces` map:
- Root workspace: config files only, ignores biome/husky/lint-staged/dotenv-cli deps
- `apps/web`: TanStack Start entry points, ignores `src/routeTree.gen.ts` (generated)
- `apps/api`: Hono API entry points, ignores `tsx` binary dep
- `packages/*`: Shared package entry points

Removed legacy knip entries: Next.js plugin config, old ignoreDependencies (postcss, autoprefixer, prettier, eslint, eslint-config-next), old ignore paths (`.next/**`).

### biome.json
- Added `!**/routeTree.gen.ts` to `files.includes` — prevents diff noise on TanStack Router generated file
- Removed `linter.domains.next` — project is no longer Next.js
- Added `.output` and `.vinxi` to excluded paths (TanStack Start / Vinxi build outputs)
- Removed stale overrides for `trpc/server.tsx` and `app/api/cli/**/*.ts` (old paths)

### eslint.config.mjs (deleted)
Leftover from Next.js era. References `next/core-web-vitals` and `next/typescript`. Project uses Biome for linting, no ESLint.

### apps/web/.env.example
Expanded from 2 vars to full set: RESEND_API_KEY, PostHog (host + key), Notion (4 vars), API_URL, OTEL endpoint.

### .github/workflows/scheduled-maintenance.yml
Updated maintenance prompt:
- Added monorepo structure description (TanStack Start, Hono, Turborepo)
- Removed Next.js-specific performance checks (`next/dynamic`, Suspense around async server components)
- Generalized performance checks for any framework

### Deleted files
- `vercel.json` — Not deploying to Vercel
- `.dockerignore`, `apps/web/.dockerignore`, `apps/api/.dockerignore` — Docker builds target specific apps via docker/ dir
- `.env` (local only) — Contained old single-app secrets; each app now has its own .env

### renovate.json
Added:
- `group:monorepos` — Groups updates from known monorepo packages (@tanstack/*, @opentelemetry/*, @radix-ui/*) into single PRs
- `group:recommended` — Additional recommended groupings to reduce PR noise
- `packageRules` scoped by workspace: web-app, api-app, shared-packages

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- knip.json: workspaces key present with apps/web, apps/api, packages/* entries
- biome.json: routeTree.gen.ts exclusion present, no next domain
- eslint.config.mjs: deleted (confirmed not in git)
- vercel.json: deleted
- .dockerignore files: deleted
- apps/web/.env.example: includes PostHog, Notion, API_URL
- .github/workflows/scheduled-maintenance.yml: references TanStack, monorepo, Hono (3 occurrences)
- renovate.json: group:monorepos present, 4 packageRules
