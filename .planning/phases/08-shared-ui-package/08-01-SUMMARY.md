---
phase: 08-shared-ui-package
plan: 01
subsystem: ui
tags: [shadcn, radix-ui, tailwind, react, monorepo, workspace-package]

# Dependency graph
requires: []
provides:
  - "@kubeasy/ui workspace package with 17 shadcn components as sub-path exports"
  - "CSS design tokens (neobrutalism oklch theme) in packages/ui/src/styles/tokens.css"
  - "cn() utility exported from @kubeasy/ui/utils"
  - "components.json for shadcn CLI targeting packages/ui"
affects: [08-shared-ui-package, apps/web]

# Tech tracking
tech-stack:
  added:
    - "@kubeasy/ui workspace:* (new shared package)"
    - "@radix-ui/* (moved from apps/web to packages/ui)"
    - "class-variance-authority, clsx, tailwind-merge, lucide-react, next-themes, sonner (moved to packages/ui)"
  patterns:
    - "JIT package pattern: export TypeScript source directly, no build step, sub-path exports map"
    - "peerDependencies for react/react-dom — one instance per consuming app"
    - "Sub-path imports: @kubeasy/ui/button, @kubeasy/ui/utils, @kubeasy/ui/styles/tokens"

key-files:
  created:
    - packages/ui/package.json
    - packages/ui/tsconfig.json
    - packages/ui/components.json
    - packages/ui/src/lib/utils.ts
    - packages/ui/src/styles/tokens.css
    - packages/ui/src/components/alert.tsx
    - packages/ui/src/components/avatar.tsx
    - packages/ui/src/components/badge.tsx
    - packages/ui/src/components/button.tsx
    - packages/ui/src/components/card.tsx
    - packages/ui/src/components/dialog.tsx
    - packages/ui/src/components/dropdown-menu.tsx
    - packages/ui/src/components/empty.tsx
    - packages/ui/src/components/input.tsx
    - packages/ui/src/components/label.tsx
    - packages/ui/src/components/navigation-menu.tsx
    - packages/ui/src/components/select.tsx
    - packages/ui/src/components/separator.tsx
    - packages/ui/src/components/sheet.tsx
    - packages/ui/src/components/sonner.tsx
    - packages/ui/src/components/switch.tsx
    - packages/ui/src/components/table.tsx
  modified:
    - pnpm-lock.yaml

key-decisions:
  - "Added @types/react and @types/react-dom as devDependencies (Rule 2 auto-fix: missing critical for typecheck)"
  - "JIT pattern: export .tsx source directly — no build step, same as @kubeasy/api-schemas"
  - "Sub-path exports only — no barrel index.ts, matches @kubeasy/api-schemas pattern"

patterns-established:
  - "UI package sub-path exports: import { Button } from '@kubeasy/ui/button'"
  - "CSS token isolation: tokens.css contains only :root/:dark variables, no Tailwind directives"
  - "react/react-dom as peerDependencies to avoid duplicate React instances"

requirements-completed: [UI-01, UI-02, UI-04]

# Metrics
duration: 12min
completed: 2026-03-24
---

# Phase 8 Plan 01: Shared UI Package Scaffold Summary

**@kubeasy/ui package created with 17 shadcn components, neobrutalism CSS token file, cn() utility, and JIT TypeScript exports — no build step required**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-24T09:30:44Z
- **Completed:** 2026-03-24T09:42:44Z
- **Tasks:** 2
- **Files modified:** 22

## Accomplishments
- Created `packages/ui` workspace package with 19 sub-path exports (17 components + utils + styles/tokens)
- Extracted neobrutalism oklch CSS design tokens from `apps/web/src/styles/globals.css` into standalone `tokens.css`
- Copied all 17 shadcn/ui components with internal imports updated from `@/lib/utils` to `@kubeasy/ui/utils`
- `pnpm typecheck --filter=@kubeasy/ui` exits 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Create packages/ui package with exports, deps, and config** - `68e5b9c03` (feat)
2. **Task 2: Copy all 17 components and update internal imports** - `40f210eaa` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `packages/ui/package.json` - Package manifest with 19 exports, peerDeps for react/react-dom, runtime Radix/CVA deps
- `packages/ui/tsconfig.json` - TypeScript config with jsx:react-jsx, path aliases
- `packages/ui/components.json` - shadcn CLI config targeting src/components
- `packages/ui/src/lib/utils.ts` - cn() utility (clsx + tailwind-merge)
- `packages/ui/src/styles/tokens.css` - Neobrutalism oklch CSS variables (:root and .dark) + @theme shadow overrides
- `packages/ui/src/components/*.tsx` - All 17 shadcn components with updated imports
- `pnpm-lock.yaml` - Updated by pnpm install

## Decisions Made
- Used exact same version strings from `apps/web/package.json` for all moved dependencies to avoid version drift
- Added `@types/react` and `@types/react-dom` as devDependencies (auto-fix, see Deviations)
- `components.json` uses Tailwind v4 / CSS variables config (rsc: false, matching existing setup)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added @types/react and @types/react-dom to devDependencies**
- **Found during:** Task 2 (typecheck verification)
- **Issue:** The plan's package.json template didn't include `@types/react` or `@types/react-dom` in devDependencies, causing TypeScript to emit "Could not find a declaration file for module 'react'" errors across all 17 components
- **Fix:** Added `"@types/react": "19.2.14"` and `"@types/react-dom": "19.2.3"` to devDependencies in packages/ui/package.json, matching the versions in apps/web
- **Files modified:** packages/ui/package.json, pnpm-lock.yaml
- **Verification:** `pnpm typecheck --filter=@kubeasy/ui` exits 0
- **Committed in:** 40f210eaa (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing critical devDependency)
**Impact on plan:** Required for TypeScript compilation to succeed. No scope creep.

## Issues Encountered
None beyond the @types/react missing devDep which was auto-fixed.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None — all components are fully ported from apps/web/src/components/ui/ with no placeholder logic. The package is a pure extraction; no new functionality was added.

## Next Phase Readiness
- `@kubeasy/ui` package is ready for consumption by `apps/web`
- Next plan (08-02) should: wire `apps/web` to import from `@kubeasy/ui/*`, add `@source` directive for Tailwind v4, replace `apps/web/src/styles/globals.css` `:root` with `@import "@kubeasy/ui/styles/tokens"`, and remove the local `apps/web/src/components/ui/` copies

## Self-Check: PASSED

- packages/ui/package.json: FOUND
- packages/ui/tsconfig.json: FOUND
- packages/ui/components.json: FOUND
- packages/ui/src/lib/utils.ts: FOUND
- packages/ui/src/styles/tokens.css: FOUND
- packages/ui/src/components/button.tsx: FOUND
- packages/ui/src/components/sonner.tsx: FOUND
- Commit 68e5b9c03: FOUND (Task 1)
- Commit 40f210eaa: FOUND (Task 2)
- Exports count: 19 (CORRECT)

---
*Phase: 08-shared-ui-package*
*Completed: 2026-03-24*
