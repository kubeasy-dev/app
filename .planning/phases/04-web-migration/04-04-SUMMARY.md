---
phase: 04-web-migration
plan: "04"
subsystem: apps/web
tags: [tanstack-start, ssr, react-query, routes, challenges, dashboard, admin]
dependency_graph:
  requires: [04-02-SUMMARY.md, 04-03-SUMMARY.md]
  provides: [complete-web-migration]
  affects: [apps/web/src/routes/, apps/web/src/components/]
tech_stack:
  added: []
  patterns:
    - SSR loader prefetch with queryClient.ensureQueryData() + useSuspenseQuery() in component
    - Hybrid rendering: SSR for base data, client-only useQuery for validation status
    - Role-based admin guard via beforeLoad on individual routes
    - Static lucide-react icons import instead of dynamic next/dynamic
key_files:
  created:
    - apps/web/src/routes/challenges/index.tsx
    - apps/web/src/routes/challenges/$slug.tsx
    - apps/web/src/routes/themes/index.tsx
    - apps/web/src/routes/themes/$slug.tsx
    - apps/web/src/routes/types/index.tsx
    - apps/web/src/routes/types/$slug.tsx
    - apps/web/src/routes/_protected/dashboard.tsx
    - apps/web/src/routes/_protected/profile.tsx
    - apps/web/src/routes/_protected/(admin)/index.tsx
    - apps/web/src/routes/_protected/(admin)/challenges.tsx
    - apps/web/src/routes/_protected/(admin)/users.tsx
    - apps/web/src/routes/onboarding.tsx
    - apps/web/src/routes/get-started.tsx
    - apps/web/src/routes/auth/callback.tsx
    - apps/web/src/components/challenge-card.tsx
    - apps/web/src/components/challenge-mission.tsx
    - apps/web/src/components/challenges-filters.tsx
    - apps/web/src/components/challenges-grid.tsx
    - apps/web/src/components/challenges-quick-start-cta.tsx
    - apps/web/src/components/difficulty-badge.tsx
    - apps/web/src/components/lucide-icon.tsx
    - apps/web/src/components/theme-card.tsx
    - apps/web/src/components/theme-hero.tsx
    - apps/web/src/components/type-card.tsx
    - apps/web/src/components/type-hero.tsx
  modified:
    - apps/web/src/lib/query-options.ts
    - apps/web/src/lib/api-client.ts
decisions:
  - "Hybrid rendering on challenge detail: loader prefetches challenge data and objectives for SSR; latestValidationOptions is client-only (useQuery) because it requires auth session unavailable at SSR time"
  - "Admin role guard implemented as beforeLoad on individual admin routes rather than a shared admin layout — TanStack Router pathless layout bug prevents nested admin layout"
  - "LucideIcon uses static icons map from lucide-react instead of next/dynamic — TanStack Start has no next/dynamic equivalent; static import is zero-cost since tree-shaking handles unused icons"
  - "Base UI Select onValueChange accepts (string | null, eventDetails) signature — all filter handlers updated to accept null and normalize to undefined"
metrics:
  duration: "35 min"
  completed_date: "2026-03-18"
  tasks_completed: 2
  files_created: 25
  files_modified: 2
---

# Phase 04 Plan 04: SSR Route Migration for Challenges, Dashboard, and Remaining Pages Summary

SSR routes for all remaining pages using TanStack Start createFileRoute with ensureQueryData loader prefetch and useSuspenseQuery component pattern; challenge detail uses hybrid rendering with client-only validation status.

## What Was Built

### Task 1: Challenges, Themes, and Types Routes

**Challenges listing** (`/challenges`) loads three datasets in parallel — challenge list, themes, and types — via `Promise.all([ensureQueryData(...), ...])` in the loader. The component uses `useSuspenseQuery(challengeListOptions())` to read the count for the hero badge.

**Challenge detail** (`/challenges/$slug`) implements hybrid rendering:
- Loader prefetches `challengeDetailOptions(slug)` and `challengeObjectivesOptions(slug)` for SSR
- Component uses `useSuspenseQuery` for base challenge data (title, description, instructions)
- `ChallengeMission` component uses `useQuery` with `enabled: isAuthenticated` for validation status — this data requires an auth session and is appropriately client-only

**Themes and Types** follow the same SSR prefetch pattern with their respective query options.

New components created to support these routes:
- `challenge-card.tsx` — TanStack Router Link for navigation
- `challenge-mission.tsx` — client-only validation display with submission history dialog
- `challenges-filters.tsx` — Base UI Select with `onValueChange: (string | null) => void` handlers
- `challenges-grid.tsx` — grid rendering from filtered query
- `challenges-quick-start-cta.tsx` — unauthenticated user CTA
- `difficulty-badge.tsx`, `lucide-icon.tsx` — shared utilities
- `theme-card.tsx`, `theme-hero.tsx`, `type-card.tsx`, `type-hero.tsx` — content cards

### Task 2: Dashboard, Profile, Admin, and Utility Routes

**Dashboard** (`/_protected/dashboard`) prefetches completion, XP, streak, and XP transaction history in the loader. Component reads user from `Route.useRouteContext()` (provided by `_protected` layout `beforeLoad`) and data from `useSuspenseQuery`.

**Profile** (`/_protected/profile`) displays user info from route context and prefetches XP data for display.

**Admin routes** (`/_protected/(admin)/index`, `/challenges`, `/users`) each implement a `beforeLoad` that checks `user.role === 'admin'` and throws `redirect({ to: '/' })` for non-admin users. This is necessary because the `(admin)` directory is a pathless group, not a layout with its own `beforeLoad`.

**Onboarding** (`/onboarding`) has its own session check in `beforeLoad` (not under `_protected`) — it redirects authenticated users who have already completed onboarding.

**Auth callback** (`/auth/callback`) redirects already-authenticated users to `/dashboard`.

**Get-started** (`/get-started`) is a static informational page with CLI installation steps.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Functionality] Added typeDetailOptions and userStatsOptions to query-options**
- **Found during:** Task 1 implementation
- **Issue:** `apps/web/src/lib/query-options.ts` lacked `typeDetailOptions(slug)` needed for types detail route
- **Fix:** Added `typeDetailOptions` and `userStatsOptions` factory functions
- **Files modified:** `apps/web/src/lib/query-options.ts`
- **Commit:** 039d0ccfb

**2. [Rule 1 - Bug] Fixed Select onValueChange signature for Base UI**
- **Found during:** Task 1 — challenges-filters implementation
- **Issue:** Base UI Select `onValueChange` signature is `(value: string | null, eventDetails: ValueChangeDetails) => void`, not `(value: string) => void`
- **Fix:** Updated all filter handlers to accept `string | null` and normalize null to `undefined`
- **Files modified:** `apps/web/src/components/challenges-filters.tsx`
- **Commit:** 039d0ccfb

**3. [Rule 1 - Bug] Fixed lucide icon dynamic import**
- **Found during:** Task 1 — replacing LucideIcon component
- **Issue:** Existing implementation used `next/dynamic` which does not exist in TanStack Start
- **Fix:** Rewrote `lucide-icon.tsx` to use static `icons` map from `lucide-react` with name normalization
- **Files modified:** `apps/web/src/components/lucide-icon.tsx`
- **Commit:** 039d0ccfb

**4. [Rule 1 - Bug] Added ChallengeTypeItem, SubmissionItem, SubmissionsOutput types to api-client**
- **Found during:** Task 1 — components needed typed return values
- **Issue:** `api.types.list()` and `api.submissions.getBySlug()` returned `unknown`
- **Fix:** Added proper interface types and updated return type annotations in api-client
- **Files modified:** `apps/web/src/lib/api-client.ts`
- **Commit:** 039d0ccfb

**5. [Rule 2 - Missing Functionality] Admin beforeLoad role guard per route**
- **Found during:** Task 2 — admin routes implementation
- **Issue:** Plan specified admin role guard but TanStack Router pathless layout bug prevents using `(admin)` directory as a shared layout with `beforeLoad`
- **Fix:** Added individual `beforeLoad` role check in each admin route file
- **Files modified:** `apps/web/src/routes/_protected/(admin)/index.tsx`, `challenges.tsx`, `users.tsx`
- **Commit:** e7f4e101a

## Verification

- `pnpm --filter=@kubeasy/web typecheck` exits 0 — no TypeScript errors
- All 14 route files created under `apps/web/src/routes/`
- All 11 component files created under `apps/web/src/components/`
- Challenges listing loader contains `ensureQueryData(challengeListOptions`
- Challenge detail loader contains `ensureQueryData(challengeDetailOptions` but NOT `ensureQueryData(latestValidation` (client-only)
- Dashboard contains `useSuspenseQuery` and `Route.useRouteContext()`
- No `next/link`, `next/image`, or `next/navigation` imports in `apps/web/src/`

## Self-Check: PASSED

All created files confirmed present on disk. Commits 039d0ccfb and e7f4e101a confirmed in git log.
