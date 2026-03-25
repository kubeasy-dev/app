# Phase 11: Admin Features - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Build admin challenge management and user management pages in `apps/admin`, backed by Hono REST data endpoints in `apps/api`. Scope: GET endpoints for challenge/user data + stats, PATCH for challenge availability toggle, Better Auth adminClient() for user mutations (ban/unban/role). Frontend: challenges page with stats cards + table, users page with stats cards + paginated table + action menus.

</domain>

<decisions>
## Implementation Decisions

### User Action Endpoints
- **D-01:** Use Better Auth `adminClient()` plugin methods for all user mutations — `authClient.admin.banUser()`, `authClient.admin.unbanUser()`, `authClient.admin.setRole()`. Already initialized in Phase 10. Goes through `/api/auth/admin/*` — no custom Hono PATCH endpoints needed for ADMIN-15/16/17.

### Data Fetching
- **D-02:** Add TanStack Query (`@tanstack/react-query`) to `apps/admin`. Already a workspace dep (used in `apps/web`). Use for all GET requests with cache invalidation after mutations.

### Challenge Availability Toggle
- **D-03:** Add `PATCH /api/admin/challenges/:id/available` with body `{ available: boolean }`. Protected by `sessionMiddleware + requireAdmin`. This endpoint is not listed in ADMIN-11..17 but is required for ADMIN-04/05. Add it alongside the other GET endpoints in plan 1.

### API Session Auth
- **D-04:** New browser-facing admin GET endpoints need `sessionMiddleware` applied before `requireAdmin`. The existing admin router only has `apiKeyMiddleware` for `/challenges/sync`. Add a separate session-protected section (or apply `sessionMiddleware` globally to the admin router for non-sync routes).

### Plan Split
- **D-05:** Split into 3 plans by layer:
  - Plan 11-01: All Hono admin endpoints (`GET /api/admin/challenges`, `GET /api/admin/challenges/stats`, `GET /api/admin/users`, `GET /api/admin/users/stats`, `PATCH /api/admin/challenges/:id/available`) + session middleware wiring
  - Plan 11-02: Challenges page UI (stats cards + table with toggle)
  - Plan 11-03: Users page UI (stats cards + paginated table + action dropdown)

### Claude's Discretion
- Exact query logic for stats aggregations (joins, subqueries, CTEs) — follow existing Drizzle patterns
- Ban reason dialog design (modal vs inline) — follow @kubeasy/ui sheet/dialog pattern
- Optimistic update implementation detail for challenge toggle

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Admin Requirements
- `.planning/REQUIREMENTS.md` §Admin App (ADMIN-03 through ADMIN-17) — full spec for all admin features

### Existing Admin Code
- `apps/api/src/routes/admin/index.ts` — current admin router (only sync route, middleware chain)
- `apps/api/src/middleware/admin.ts` — requireAdmin middleware
- `apps/api/src/middleware/session.ts` — sessionMiddleware to apply to new routes
- `apps/api/src/db/schema/challenge.ts` — challenge, userProgress, challengeObjective tables
- `apps/api/src/db/schema/auth.ts` — user table (banned, banReason, role, image fields)
- `apps/admin/src/lib/auth-client.ts` — adminClient() already initialized
- `apps/admin/src/routes/__root.tsx` — auth guard, shell layout with container

### Pattern Reference
- `apps/web/src/routes/dashboard/index.tsx` — TanStack Query usage pattern in CSR context
- `apps/api/src/routes/user.ts` — session-protected Hono route pattern (sessionMiddleware + requireAuth)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@kubeasy/ui` — all 17 shadcn components available (Table, Badge, Dialog, DropdownMenu, Switch, Avatar, Card, etc.)
- `apps/admin/src/components/top-nav.tsx` — shell nav already built
- `apps/admin/src/routes/challenges/index.tsx` — placeholder stub ready to replace
- `apps/admin/src/routes/users/index.tsx` — placeholder stub ready to replace
- `apps/api/src/middleware/admin.ts` + `session.ts` — middleware ready to compose
- `adminClient()` Better Auth plugin — ban/unban/setRole methods available with no custom backend code

### Established Patterns
- Hono route files: one `new Hono()` per file, exported and mounted in parent `index.ts`
- Drizzle queries: `db.select().from(table).where(...)` style
- TanStack Query in apps/web: `queryOptions()` factory + `useQuery()`/`useSuspenseQuery()`
- Admin top-nav style: h-20, font-black, neo-border-thick (Phase 10 decision)
- Optimistic updates in TanStack Query: `useMutation` with `onMutate`/`onError`/`onSettled`

### Integration Points
- `apps/api/src/routes/admin/index.ts` — mount new routes here (`admin.route(...)`)
- `apps/api/src/index.ts` — verify admin router is mounted at `/api/admin`
- `apps/admin/src/main.tsx` — add QueryClient + QueryClientProvider here
- `challenge.available` column exists in DB (no migration needed)
- `user.banned`, `user.banReason`, `user.role` exist in auth schema (no migration needed)

</code_context>

<specifics>
## Specific Ideas

- Self-action protection: block ban/role-change for the currently logged-in admin — UI disables the action, API enforces it (Better Auth adminClient() may enforce this natively for setRole)
- Banned users in the table: faded/muted row appearance (ADMIN-10)
- Challenge toggle: optimistic update — flip immediately in UI, revert on error (ADMIN-05)
- Users table pagination: 50/page (ADMIN-07)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-admin-features*
*Context gathered: 2026-03-25*
