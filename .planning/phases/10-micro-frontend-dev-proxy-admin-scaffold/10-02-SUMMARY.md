---
phase: 10-micro-frontend-dev-proxy-admin-scaffold
plan: "02"
subsystem: ui
tags:
  - admin
  - tanstack-router
  - auth-guard
  - top-nav
  - caddy
  - better-auth

dependency_graph:
  requires:
    - phase: 10-01
      provides: "apps/admin Vite CSR SPA scaffold with TanStack Router basePath /admin and adminClient auth"
  provides:
    - apps/admin/src/routes/__root.tsx (auth guard + shell layout)
    - apps/admin/src/components/top-nav.tsx (top navigation bar with logo, nav links, user avatar dropdown)
    - apps/admin/src/routes/challenges/index.tsx (placeholder challenges page)
    - apps/admin/src/routes/users/index.tsx (placeholder users page)
    - apps/caddy/Caddyfile (production reverse proxy reference template)
  affects:
    - phase-11 (admin challenge management builds on top of this scaffold)

tech-stack:
  added: []
  patterns:
    - "Auth guard via authClient.useSession() in root layout — isPending → loading, no session → redirect to /login, non-admin → redirect to web root"
    - "Cross-app redirect via window.location.href (not router.navigate) for auth guard redirects"
    - "routeTree.gen.ts manually updated when TanStackRouterVite plugin cannot regenerate (no running dev server)"
    - "Caddy reference template documenting production routing — NOT used locally"

key-files:
  created:
    - apps/admin/src/components/top-nav.tsx
    - apps/admin/src/routes/challenges/index.tsx
    - apps/admin/src/routes/users/index.tsx
    - apps/caddy/Caddyfile
  modified:
    - apps/admin/src/routes/__root.tsx
    - apps/admin/src/routes/index.tsx
    - apps/admin/src/routeTree.gen.ts

key-decisions:
  - "Cross-app redirects use window.location.href not router.navigate — admin and web are separate SPAs on different ports"
  - "routeTree.gen.ts updated manually to include /challenges/ and /users/ routes — plugin regenerates on first dev run"
  - "Caddyfile created in apps/caddy/ as reference template only — not wired to docker-compose yet (Phase 12)"

patterns-established:
  - "Pattern: Auth guard in __root.tsx using useSession() isPending + role check — replicated for any future MFE with auth"
  - "Pattern: window.location.href for cross-SPA redirects (auth guard, sign out)"
  - "Pattern: TanStack Router active link detection via useRouterState pathname.startsWith()"

requirements-completed:
  - ADMIN-01
  - ADMIN-02
  - MFE-01

duration: 12min
completed: 2026-03-24
---

# Phase 10 Plan 02: Admin Auth Guard + Shell Layout + Caddyfile Summary

**Admin-only auth guard in __root.tsx with role-based cross-SPA redirects, top-nav shell (logo + Challenges/Users/Settings + avatar dropdown), placeholder routes, and Caddy production proxy reference template.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-24T22:30:00Z
- **Completed:** 2026-03-24T22:42:00Z
- **Tasks:** 2 (Task 3 is a human-verify checkpoint)
- **Files modified:** 7

## Accomplishments
- Auth guard enforces admin-only access: unauthenticated → /login, non-admin → web root, admin → render shell
- Top-nav component with sticky header (48px, neo-brutalist border), logo linking to /challenges, active link state, disabled Settings, user avatar dropdown with sign-out
- Placeholder Challenges and Users routes with Phase 11 copy
- Index route redirects to /challenges via beforeLoad
- Caddy production reference template for Phase 12 deployment

## Task Commits

Each task was committed atomically:

1. **Task 1: Auth guard root layout and top-nav component** - `9046f8c30` (feat)
2. **Task 2: Placeholder routes and reference Caddyfile** - `aba39b013` (feat)

## Files Created/Modified
- `apps/admin/src/routes/__root.tsx` - Auth guard + shell layout with TopNav + Outlet
- `apps/admin/src/components/top-nav.tsx` - Sticky top nav with logo, nav links, avatar dropdown
- `apps/admin/src/routes/index.tsx` - Redirect to /challenges via beforeLoad
- `apps/admin/src/routes/challenges/index.tsx` - Placeholder "Challenge management is coming in Phase 11."
- `apps/admin/src/routes/users/index.tsx` - Placeholder "User management is coming in Phase 11."
- `apps/admin/src/routeTree.gen.ts` - Updated with /challenges/ and /users/ routes
- `apps/caddy/Caddyfile` - Production reverse proxy reference template

## Decisions Made
- Cross-app redirects use `window.location.href` not `router.navigate` — admin and web are separate SPAs; TanStack Router cannot navigate cross-origin
- `routeTree.gen.ts` updated manually to register new routes for TypeScript — will be regenerated automatically by TanStackRouterVite plugin on first `pnpm dev`
- Caddyfile placed in `apps/caddy/` (reference only, not wired to infra yet — Phase 12 deployment concern)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated routeTree.gen.ts to include new routes**
- **Found during:** Task 2 (placeholder routes)
- **Issue:** `pnpm --filter @kubeasy/admin typecheck` failed with `Argument of type '"/challenges/"' is not assignable to parameter of type '"/"'` — the manually created routeTree.gen.ts only declared the root `/` route, so `createFileRoute("/challenges/")` and `createFileRoute("/users/")` were type errors
- **Fix:** Updated routeTree.gen.ts to import and register the new routes, extending all FileRoutesByFullPath/To/ById interfaces and the module augmentation
- **Files modified:** apps/admin/src/routeTree.gen.ts
- **Verification:** `pnpm --filter @kubeasy/admin typecheck` exits 0
- **Committed in:** aba39b013 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Required fix for typecheck to pass. routeTree.gen.ts is a generated file — the fix extends the known pattern from Plan 01 where it was created manually.

## Known Stubs

- `apps/admin/src/routes/challenges/index.tsx`: Placeholder page with "Challenge management is coming in Phase 11." — intentional per plan; Phase 11 adds real CRUD
- `apps/admin/src/routes/users/index.tsx`: Placeholder page with "User management is coming in Phase 11." — intentional per plan; Phase 11 adds real user management
- These stubs do not prevent the plan's goal (admin shell + auth guard) from being achieved

## Issues Encountered
None — all typecheck errors were resolved by updating routeTree.gen.ts.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Admin auth guard and shell layout complete — Phase 11 can add real challenge/user management pages
- Caddy reference template ready for Phase 12 production deployment
- Pending: Human verification of MFE proxy + admin shell in browser (Task 3 checkpoint)

---
*Phase: 10-micro-frontend-dev-proxy-admin-scaffold*
*Completed: 2026-03-24*
