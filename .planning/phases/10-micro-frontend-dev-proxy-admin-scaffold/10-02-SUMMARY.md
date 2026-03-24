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
      provides: "apps/admin Vite CSR SPA scaffold with TanStack Router basepath /admin and adminClient auth"
  provides:
    - apps/admin/src/routes/__root.tsx (auth guard + shell layout)
    - apps/admin/src/components/top-nav.tsx (top navigation bar with logo, nav links, user avatar dropdown)
    - apps/admin/src/routes/challenges/index.tsx (placeholder challenges page)
    - apps/admin/src/routes/users/index.tsx (placeholder users page)
    - apps/caddy/Caddyfile (production reverse proxy reference template)
  affects:
    - phase-11 (admin challenge management builds on top of this scaffold)
    - phase-12 (Caddyfile template is the direct input for Caddy deployment)

tech-stack:
  added: []
  patterns:
    - "Auth guard via authClient.useSession() in root layout — isPending → loading, no session → redirect to /login, non-admin → redirect to web root"
    - "Cross-app redirect via window.location.href (not router.navigate) — admin and web are separate SPAs"
    - "routeTree.gen.ts manually updated when TanStackRouterVite plugin cannot regenerate (no running dev server)"
    - "Caddy reference template documenting production routing — NOT used locally"
    - "Auth redirects use relative paths (/login, /) when all apps share the same origin via MFE proxy"

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
    - apps/admin/src/main.tsx
    - apps/web/src/components/user-dropdown.tsx
    - apps/api/src/index.ts

key-decisions:
  - "Cross-app redirects use window.location.href not router.navigate — admin and web are separate SPAs on different ports"
  - "routeTree.gen.ts updated manually to include /challenges/ and /users/ routes — plugin regenerates on first dev run"
  - "Caddyfile created in apps/caddy/ as reference template only — not wired to docker-compose yet (Phase 12)"
  - "Auth guard redirects use relative paths (/login, /) after confirming same-origin session works via MFE proxy"
  - "Admin top-nav style aligned with web app header post-verification (h-20, font-black, neo-border-thick)"
  - "CORS widened to localhost:* to cover admin app port in dev"

patterns-established:
  - "Pattern: Auth guard in __root.tsx using useSession() isPending + role check — replicated for any future MFE with auth"
  - "Pattern: window.location.href for cross-SPA redirects (auth guard, sign out)"
  - "Pattern: TanStack Router active link detection via useRouterState pathname.startsWith()"

requirements-completed:
  - ADMIN-01
  - ADMIN-02
  - MFE-01

duration: ~35min (including post-checkpoint fixes)
completed: 2026-03-24
---

# Phase 10 Plan 02: Admin Auth Guard + Shell Layout + Caddyfile Summary

**Admin-only auth guard in __root.tsx with role-based cross-SPA redirects, neo-brutalist top-nav shell (logo + Challenges/Users/Settings + avatar dropdown), placeholder routes, and Caddy production proxy reference template — verified in browser.**

## Performance

- **Duration:** ~35 min (including post-checkpoint corrections)
- **Completed:** 2026-03-24
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint — approved)
- **Files modified:** 10

## Accomplishments

- Auth guard enforces admin-only access: unauthenticated → /login, non-admin → web root, admin → render shell
- Top-nav component aligned with web app header (h-20, neo-brutalist border, font-black), logo linking to /challenges, active link state, disabled Settings, user avatar dropdown with sign-out
- Placeholder Challenges and Users routes with Phase 11 copy
- Index route redirects to /challenges via beforeLoad
- Caddy production reference template for Phase 12 deployment
- Human verification approved: MFE proxy routing and admin shell confirmed working in browser

## Task Commits

Each task was committed atomically:

1. **Task 1: Auth guard root layout and top-nav component** — `9046f8c` (feat)
2. **Task 2: Placeholder routes and reference Caddyfile** — `aba39b0` (feat)
3. **Task 3: Human-verify checkpoint** — approved

Post-checkpoint fix commits:
- `051d8a3` — fix(10): correct basepath casing in createRouter + widen CORS for admin app
- `3f4454f` — fix(10): remove web app /admin routes — now handled by admin SPA
- `6ec4fc6` — fix(10): use relative paths for auth redirects in admin SPA
- `3836425` — fix(10-02): align admin top-nav style with web app header

## Files Created/Modified

- `apps/admin/src/routes/__root.tsx` — Auth guard + shell layout with TopNav + Outlet
- `apps/admin/src/components/top-nav.tsx` — Sticky top nav with logo, nav links, avatar dropdown (updated post-checkpoint for style alignment)
- `apps/admin/src/routes/index.tsx` — Redirect to /challenges via beforeLoad
- `apps/admin/src/routes/challenges/index.tsx` — Placeholder "Challenge management is coming in Phase 11."
- `apps/admin/src/routes/users/index.tsx` — Placeholder "User management is coming in Phase 11."
- `apps/admin/src/routeTree.gen.ts` — Updated with /challenges/ and /users/ routes
- `apps/caddy/Caddyfile` — Production reverse proxy reference template
- `apps/admin/src/main.tsx` — Fixed basepath casing (basePath → basepath)
- `apps/web/src/components/user-dropdown.tsx` — Admin link changed to window.location.href
- `apps/api/src/index.ts` — CORS widened to localhost:* to cover admin app port

## Decisions Made

- Cross-app redirects use `window.location.href` not `router.navigate` — admin and web are separate SPAs; TanStack Router cannot navigate cross-origin
- `routeTree.gen.ts` updated manually to register new routes for TypeScript — will be regenerated automatically by TanStackRouterVite plugin on first `pnpm dev`
- Caddyfile placed in `apps/caddy/` (reference only, not wired to infra yet — Phase 12 deployment concern)
- Auth redirects changed to relative paths (`/login`, `/`) after verifying same-origin cookie access through the MFE proxy

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated routeTree.gen.ts to include new routes**
- **Found during:** Task 2 (placeholder routes)
- **Issue:** `pnpm --filter @kubeasy/admin typecheck` failed — routeTree.gen.ts only declared root `/`, causing type errors for `/challenges/` and `/users/`
- **Fix:** Extended routeTree.gen.ts with new route imports and type declarations
- **Files modified:** apps/admin/src/routeTree.gen.ts
- **Verification:** `pnpm --filter @kubeasy/admin typecheck` exits 0
- **Committed in:** aba39b0 (Task 2 commit)

**2. [Rule 1 - Bug] basepath casing error in createRouter**
- **Found during:** Task 3 (human-verify)
- **Issue:** TanStack Router uses `basepath` (lowercase) but main.tsx had `basePath` (camelCase), causing sub-path routing to fail
- **Fix:** Renamed `basePath` to `basepath` in createRouter call
- **Files modified:** apps/admin/src/main.tsx
- **Committed in:** 051d8a3

**3. [Rule 2 - Missing Critical] CORS not covering admin app port**
- **Found during:** Task 3 (human-verify)
- **Issue:** Better Auth session cookies inaccessible from admin app origin
- **Fix:** Widened CORS to `localhost:*` in API
- **Files modified:** apps/api/src/index.ts
- **Committed in:** 051d8a3

**4. [Rule 1 - Bug] Web app still had /admin route stubs conflicting with admin SPA**
- **Found during:** Task 3 (human-verify)
- **Issue:** Old /admin routes in apps/web intercepted requests before the MFE proxy could route them to the admin SPA
- **Fix:** Deleted web app /admin route files
- **Files modified:** apps/web /admin route files removed
- **Committed in:** 3f4454f

**5. [Rule 1 - Bug] Admin link in web user-dropdown used TanStack Router Link**
- **Found during:** Task 3 (human-verify)
- **Issue:** TanStack Router Link navigates within the web SPA, cannot cross to admin SPA
- **Fix:** Changed to `window.location.href = "/admin"`
- **Files modified:** apps/web/src/components/user-dropdown.tsx
- **Committed in:** 3f4454f

**6. [Rule 1 - Bug] Auth guard used absolute VITE_WEB_URL redirects breaking same-origin flow**
- **Found during:** Post-checkpoint testing
- **Issue:** After CORS fix confirmed same-origin session via proxy, absolute URLs were unnecessary and created redirect inconsistencies
- **Fix:** Changed to relative paths `/login` and `/`
- **Files modified:** apps/admin/src/routes/__root.tsx
- **Committed in:** 6ec4fc6

**7. [Rule 1 - Bug] Top-nav style diverged from web app header**
- **Found during:** Task 3 (human-verify) visual comparison
- **Issue:** h-12 (48px) vs web header h-20 — inconsistent shell experience
- **Fix:** Updated top-nav to match web header: h-20, font-black, neo-border-thick, container layout
- **Files modified:** apps/admin/src/components/top-nav.tsx
- **Committed in:** 3836425

---

**Total deviations:** 7 auto-fixed (6 bugs, 1 missing critical)
**Impact on plan:** All fixes necessary for correct operation and visual consistency. No scope creep.

## Known Stubs

- `apps/admin/src/routes/challenges/index.tsx`: Placeholder page — intentional per plan; Phase 11 adds real CRUD
- `apps/admin/src/routes/users/index.tsx`: Placeholder page — intentional per plan; Phase 11 adds real user management
- These stubs do not prevent the plan's goal (admin shell + auth guard) from being achieved

## Issues Encountered

- TanStack Router `basepath` casing is undocumented at the API level — discovered empirically during browser verification
- CORS for admin was a latent issue from Plan 01 that only surfaced during live browser testing

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Admin auth guard and shell layout complete — Phase 11 can add real challenge/user management pages
- Caddy reference template ready for Phase 12 production deployment
- Pre-Phase-11 recommendation: audit `apps/api/src/routes/admin/` to confirm which Hono admin endpoints already exist before writing admin UI

---
*Phase: 10-micro-frontend-dev-proxy-admin-scaffold*
*Completed: 2026-03-24*
