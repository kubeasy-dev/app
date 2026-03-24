# Phase 11: Admin Features - Research

**Researched:** 2026-03-25
**Domain:** Hono REST endpoints + TanStack Query (CSR) + Better Auth admin plugin
**Confidence:** HIGH

## Summary

Phase 11 implements the full admin management layer: five Hono REST endpoints protected by `sessionMiddleware + requireAdmin`, two React pages in `apps/admin` consuming those endpoints via TanStack Query, and Better Auth `adminClient()` methods for user mutations. No new dependencies are required — every tool is already installed and initialized.

The codebase is remarkably well-prepared. `apps/admin/src/main.tsx` already sets up `QueryClient + QueryClientProvider`. The `@kubeasy/api-schemas/challenges` package already exports `AdminChallengeItemSchema`, `AdminChallengeListOutputSchema`, and `AdminStatsOutputSchema`. The admin router (`apps/api/src/routes/admin/index.ts`) already applies `sessionMiddleware` globally (via `app.use("/api/*", sessionMiddleware)` in `app.ts`) before `requireAdmin`, so new browser-facing GET endpoints slot in without middleware changes. The placeholder route files (`challenges/index.tsx`, `users/index.tsx`) are ready to be replaced.

The only schema gap is the user admin schemas (AdminUserItem, AdminUserListOutput, AdminUserStatsOutput) — these need to be added to `@kubeasy/api-schemas/auth` and the admin app needs its own `api-client.ts` (a thin wrapper around `apiFetch` pointing at `VITE_API_URL`).

**Primary recommendation:** Build in the plan-split order from CONTEXT.md D-05: API endpoints first (Plan 11-01), then Challenges page UI (Plan 11-02), then Users page UI (Plan 11-03).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01: User Action Endpoints**
Use Better Auth `adminClient()` plugin methods for all user mutations — `authClient.admin.banUser()`, `authClient.admin.unbanUser()`, `authClient.admin.setRole()`. Already initialized in Phase 10. Goes through `/api/auth/admin/*` — no custom Hono PATCH endpoints needed for ADMIN-15/16/17.

**D-02: Data Fetching**
Add TanStack Query (`@tanstack/react-query`) to `apps/admin`. Already a workspace dep (used in `apps/web`). Use for all GET requests with cache invalidation after mutations.

**D-03: Challenge Availability Toggle**
Add `PATCH /api/admin/challenges/:id/available` with body `{ available: boolean }`. Protected by `sessionMiddleware + requireAdmin`. This endpoint is not listed in ADMIN-11..17 but is required for ADMIN-04/05. Add it alongside the other GET endpoints in plan 1.

**D-04: API Session Auth**
New browser-facing admin GET endpoints need `sessionMiddleware` applied before `requireAdmin`. The existing admin router only has `apiKeyMiddleware` for `/challenges/sync`. Add a separate session-protected section (or apply `sessionMiddleware` globally to the admin router for non-sync routes).

**D-05: Plan Split**
Split into 3 plans by layer:
- Plan 11-01: All Hono admin endpoints (`GET /api/admin/challenges`, `GET /api/admin/challenges/stats`, `GET /api/admin/users`, `GET /api/admin/users/stats`, `PATCH /api/admin/challenges/:id/available`) + session middleware wiring
- Plan 11-02: Challenges page UI (stats cards + table with toggle)
- Plan 11-03: Users page UI (stats cards + paginated table + action dropdown)

### Claude's Discretion

- Exact query logic for stats aggregations (joins, subqueries, CTEs) — follow existing Drizzle patterns
- Ban reason dialog design (modal vs inline) — follow @kubeasy/ui sheet/dialog pattern
- Optimistic update implementation detail for challenge toggle

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ADMIN-03 | Admin sees 4 stats cards on challenges page (completion rate, success rate, total submissions, avg attempts) | `GET /api/admin/challenges/stats` → `AdminStatsOutput` schema already exists |
| ADMIN-04 | Admin sees table of all challenges with title, theme, type, difficulty, created date, completion %, success rate %, toggle available | `GET /api/admin/challenges` → `AdminChallengeListOutput` schema already exists; challenge columns all in DB schema |
| ADMIN-05 | Admin can toggle challenge availability (optimistic update + error revert) | `PATCH /api/admin/challenges/:id/available`; TanStack Query `useMutation` with `onMutate`/`onError`/`onSettled` pattern |
| ADMIN-06 | Admin sees 4 stats cards on users page (total, active, banned, admins) | `GET /api/admin/users/stats` → new `AdminUserStatsOutput` schema needed |
| ADMIN-07 | Admin sees paginated user table (50/page) with avatar, role badge, XP, ban status | `GET /api/admin/users?page=N&limit=50` → new `AdminUserListOutput` schema needed |
| ADMIN-08 | Admin can change user role (make admin / remove admin) via dropdown | `authClient.admin.setRole()` from Better Auth adminClient |
| ADMIN-09 | Admin can ban user with optional reason (dialog) and unban | `authClient.admin.banUser()` and `authClient.admin.unbanUser()` |
| ADMIN-10 | Banned users show faded appearance; self-action blocked in UI and API | UI: conditional opacity class; API: compare requesting user id vs target id |
| ADMIN-11 | `GET /api/admin/challenges` returns challenges with metrics | New Hono route in `apps/api/src/routes/admin/` |
| ADMIN-12 | `GET /api/admin/challenges/stats` returns global challenge stats | New Hono route in `apps/api/src/routes/admin/` |
| ADMIN-13 | `GET /api/admin/users` returns paginated users with metrics | New Hono route; joins user + userProgress + userXp tables |
| ADMIN-14 | `GET /api/admin/users/stats` returns global user stats | New Hono route; aggregation query on user table |
| ADMIN-15 | `PATCH /api/admin/users/:id/ban` bans user (optional reason), blocks self-ban | Via Better Auth adminClient (D-01) — no custom Hono route needed |
| ADMIN-16 | `PATCH /api/admin/users/:id/unban` unbans user | Via Better Auth adminClient (D-01) — no custom Hono route needed |
| ADMIN-17 | `PATCH /api/admin/users/:id/role` changes role, blocks self-role-change | Via Better Auth adminClient (D-01) — no custom Hono route needed |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Hono | 4.12.9 | Admin REST endpoints | Already the API framework |
| Drizzle ORM | 0.45.1 | DB queries for stats/lists | Already the ORM |
| @tanstack/react-query | 5.95.2 | Data fetching in admin SPA | Already installed in apps/admin |
| better-auth (adminClient) | 1.5.6 | User mutations (ban/unban/setRole) | Already initialized in apps/admin |
| @kubeasy/ui | workspace | UI components | Shared package with all 17 components |
| @hono/zod-validator | 0.7.6 | Request body validation | Already used across all API routes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @kubeasy/api-schemas | workspace | Shared Zod schemas for response shapes | For all new admin endpoint response types |
| lucide-react | 0.577.0 | Icons (Stats cards, action menus) | Already in apps/admin |
| zod | 4.3.6 | Schema validation | Already used |

### No New Installations Needed
Everything required for Phase 11 is already installed. `QueryClient + QueryClientProvider` is already wired in `apps/admin/src/main.tsx`.

## Architecture Patterns

### Recommended File Layout for New Code

```
apps/api/src/routes/admin/
├── index.ts                     # Mount challenges + users sub-routers
├── challenges-sync.ts           # Existing (API key auth)
├── challenges.ts                # NEW: GET /challenges, GET /challenges/stats, PATCH /challenges/:id/available
└── users.ts                     # NEW: GET /users, GET /users/stats

apps/admin/src/
├── lib/
│   ├── auth-client.ts           # Existing
│   ├── api-client.ts            # NEW: apiFetch wrapper for admin app
│   └── query-options.ts         # NEW: adminChallengesOptions, adminStatsOptions, etc.
├── routes/
│   ├── challenges/index.tsx     # REPLACE placeholder with full challenges page
│   └── users/index.tsx          # REPLACE placeholder with full users page
└── components/
    ├── challenges-stats.tsx      # NEW: 4 stats cards for challenges
    ├── challenges-table.tsx      # NEW: Table with toggle
    ├── users-stats.tsx           # NEW: 4 stats cards for users
    ├── users-table.tsx           # NEW: Paginated table with action dropdown
    └── ban-dialog.tsx            # NEW: Ban reason dialog

packages/api-schemas/src/
└── auth.ts                      # EXTEND: add AdminUserItem, AdminUserListOutput, AdminUserStatsOutput
```

### Pattern 1: Hono Admin Route with Session Auth

The global `sessionMiddleware` in `app.ts` already runs on all `/api/*` routes. The admin router already applies `requireAdmin` via `admin.use("/*", requireAdmin)`. New routes simply need to be mounted in the admin router.

```typescript
// apps/api/src/routes/admin/challenges.ts
import { Hono } from "hono";
import { count, eq, sql, sum } from "drizzle-orm";
import { db } from "../../db";
import { challenge, userProgress, userSubmission } from "../../db/schema";

export const adminChallenges = new Hono();

adminChallenges.get("/", async (c) => {
  // LEFT JOIN userProgress for starts/completions, userSubmission for submissions
  const rows = await db.select({...}).from(challenge)...;
  return c.json({ challenges: rows });
});

adminChallenges.get("/stats", async (c) => {
  const [stats] = await db.select({
    totalSubmissions: count(userSubmission.id),
    successfulSubmissions: sql<number>`SUM(CASE WHEN ${userSubmission.validated} THEN 1 ELSE 0 END)`,
    // ...
  }).from(userSubmission);
  return c.json(stats);
});

adminChallenges.patch("/:id/available", zValidator("json", z.object({ available: z.boolean() })), async (c) => {
  const id = Number(c.req.param("id"));
  const { available } = c.req.valid("json");
  await db.update(challenge).set({ available }).where(eq(challenge.id, id));
  return c.json({ success: true });
});
```

Then mount in `apps/api/src/routes/admin/index.ts`:
```typescript
admin.route("/challenges", adminChallenges);
admin.route("/users", adminUsers);
```

### Pattern 2: Session Middleware — Already Wired

`app.ts` runs `sessionMiddleware` on all `/api/*` routes globally. The admin router's `requireAdmin` middleware checks `c.get("user").role`. No change needed for the admin router middleware chain — the comment in `admin/index.ts` already documents this: "For session-based routes: user is already set by the global sessionMiddleware."

### Pattern 3: TanStack Query in Admin SPA

Follow the established pattern from `apps/web/src/lib/query-options.ts` and `apps/web/src/lib/api-client.ts`. The admin app needs its own `api-client.ts` (no SSR cookie-forwarding needed — pure CSR):

```typescript
// apps/admin/src/lib/api-client.ts
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3024";

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}
```

```typescript
// apps/admin/src/lib/query-options.ts
export function adminChallengesOptions() {
  return queryOptions({
    queryKey: ["admin", "challenges"],
    queryFn: () => apiFetch<AdminChallengeListOutput>("/admin/challenges"),
  });
}

export function adminChallengesStatsOptions() {
  return queryOptions({
    queryKey: ["admin", "challenges", "stats"],
    queryFn: () => apiFetch<AdminStatsOutput>("/admin/challenges/stats"),
  });
}

export function adminUsersOptions(page = 1) {
  return queryOptions({
    queryKey: ["admin", "users", page],
    queryFn: () => apiFetch<AdminUserListOutput>(`/admin/users?page=${page}&limit=50`),
  });
}

export function adminUsersStatsOptions() {
  return queryOptions({
    queryKey: ["admin", "users", "stats"],
    queryFn: () => apiFetch<AdminUserStatsOutput>("/admin/users/stats"),
  });
}
```

### Pattern 4: Optimistic Update for Challenge Toggle

```typescript
// In challenges/index.tsx
const queryClient = useQueryClient();
const toggleMutation = useMutation({
  mutationFn: ({ id, available }: { id: number; available: boolean }) =>
    apiFetch(`/admin/challenges/${id}/available`, {
      method: "PATCH",
      body: JSON.stringify({ available }),
    }),
  onMutate: async ({ id, available }) => {
    await queryClient.cancelQueries({ queryKey: ["admin", "challenges"] });
    const previous = queryClient.getQueryData<AdminChallengeListOutput>(["admin", "challenges"]);
    queryClient.setQueryData<AdminChallengeListOutput>(["admin", "challenges"], (old) => ({
      challenges: old?.challenges.map((c) =>
        c.id === id ? { ...c, available } : c
      ) ?? [],
    }));
    return { previous };
  },
  onError: (_err, _vars, context) => {
    if (context?.previous) {
      queryClient.setQueryData(["admin", "challenges"], context.previous);
    }
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "challenges"] });
  },
});
```

### Pattern 5: Better Auth adminClient() for User Mutations

The `authClient` in `apps/admin/src/lib/auth-client.ts` already has `adminClient()` plugin. Available methods (via Better Auth admin plugin):

```typescript
// Ban a user
await authClient.admin.banUser({ userId: id, banReason: reason });

// Unban a user
await authClient.admin.unbanUser({ userId: id });

// Set role
await authClient.admin.setRole({ userId: id, role: "admin" });  // or "user"
```

These go through `POST /api/auth/admin/ban-user`, `POST /api/auth/admin/unban-user`, `POST /api/auth/admin/set-role` respectively — all handled by Better Auth's admin plugin handler. No custom Hono endpoints needed.

After calling any mutation, invalidate `["admin", "users", ...]` query keys.

### Pattern 6: Stats Cards Component (neo-brutalist style)

Follow the dashboard pattern from `apps/web/src/routes/_protected/dashboard.tsx`:

```tsx
// Stat card structure (reuse neo-brutalist classes)
<div className="bg-secondary neo-border-thick neo-shadow p-6">
  <div className="flex items-center gap-4 mb-3">
    <div className="p-3 bg-primary neo-border-thick neo-shadow rounded-lg">
      <IconComponent className="w-6 h-6 text-primary-foreground" />
    </div>
    <div>
      <p className="text-sm font-bold text-foreground">{label}</p>
      <p className="text-3xl font-black text-foreground">{value}</p>
    </div>
  </div>
  <p className="text-sm font-bold text-foreground">{subtext}</p>
</div>
```

4-column grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12`

### Pattern 7: Users Table with Pagination

The users endpoint returns paginated data. Client-side manages `page` state. Key columns: avatar + name + email, role badge, completedChallenges, totalXp, createdAt, banned status + reason.

Banned row appearance: add `opacity-50` or `text-muted-foreground` class conditionally on `user.banned`.

Self-action guard: compare `user.id === session.user.id` — disable the dropdown item or hide it.

### Pattern 8: User Schemas to Add

```typescript
// packages/api-schemas/src/auth.ts (additions)
export const AdminUserItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  role: z.string().nullable(),
  createdAt: z.coerce.date(),
  banned: z.boolean().nullable(),
  banReason: z.string().nullable(),
  completedChallenges: z.number().int(),
  totalXp: z.number().int(),
});
export type AdminUserItem = z.infer<typeof AdminUserItemSchema>;

export const AdminUserListOutputSchema = z.object({
  users: z.array(AdminUserItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});
export type AdminUserListOutput = z.infer<typeof AdminUserListOutputSchema>;

export const AdminUserStatsOutputSchema = z.object({
  total: z.number().int(),
  active: z.number().int(),
  banned: z.number().int(),
  admins: z.number().int(),
});
export type AdminUserStatsOutput = z.infer<typeof AdminUserStatsOutputSchema>;
```

### Anti-Patterns to Avoid

- **Hand-rolling ban/unban/setRole Hono endpoints:** Better Auth's `adminClient()` handles these via `/api/auth/admin/*`. Building custom Hono endpoints duplicates functionality and creates auth state drift.
- **Applying sessionMiddleware again in the admin router:** It's already applied globally in `app.ts` on `/api/*`. Double-applying causes no error but wastes a DB call.
- **Using barrel imports from `@kubeasy/api-schemas`:** Project uses sub-path exports only (`@kubeasy/api-schemas/challenges`, not `@kubeasy/api-schemas`).
- **Forgetting `credentials: "include"` in the admin api-client:** Without it, session cookies won't be sent to the API.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| User ban/unban/role change | Custom Hono PATCH endpoints with DB writes | `authClient.admin.banUser/unbanUser/setRole()` | Better Auth handles session invalidation, role propagation, DB writes atomically |
| Optimistic updates | Manual state cloning | TanStack Query `useMutation` onMutate/onError/onSettled | Pattern is established and handles race conditions |
| Stats aggregations | Custom in-memory computation | Drizzle `sql<number>` with COUNT/SUM/CASE WHEN | Single DB round-trip, correct at query time |

## Common Pitfalls

### Pitfall 1: Admin Router Middleware Order for `/challenges/sync`

**What goes wrong:** Adding `sessionMiddleware` to the admin router globally would cause `/challenges/sync` (which uses API key auth, not session cookies) to fail — the session lookup would find no session and `requireAdmin` would reject.

**Why it happens:** The admin router applies `requireAdmin` via `admin.use("/*", requireAdmin)`. The global `sessionMiddleware` in `app.ts` already runs first on all `/api/*` requests. For `/challenges/sync`, the API key middleware sets `c.var.user` before `requireAdmin` checks it.

**How to avoid:** Do NOT add `sessionMiddleware` inside the admin router. The global wiring is sufficient. New GET endpoints work because the global session middleware already set `c.var.user`.

**Warning signs:** If `/challenges/sync` CI calls start returning 401, check if middleware was accidentally duplicated inside the admin router.

### Pitfall 2: Better Auth adminClient Self-Action Behavior

**What goes wrong:** `authClient.admin.setRole()` may or may not block self-role-change natively. The spec (ADMIN-10) requires both UI and API enforcement.

**How to avoid:** Add explicit self-check in the UI (`user.id === session.user.id` → disable menu item). For the API layer, since D-01 uses Better Auth's `/api/auth/admin/*` routes rather than custom Hono endpoints, check Better Auth docs for whether self-action is blocked. If not: the UI guard is the primary protection layer for this phase.

**Resolution:** UI guard is mandatory. If Better Auth blocks self-actions natively, that's a bonus — document it. If not, the UI guard is sufficient for v1.1 scope.

### Pitfall 3: Missing `@kubeasy/api-schemas` Export for Admin User Types

**What goes wrong:** `AdminUserItem` types don't exist yet in the schema package. Forgetting to add the export path in `packages/api-schemas/package.json` causes "Cannot find module" errors.

**How to avoid:** After adding schemas to `packages/api-schemas/src/auth.ts`, verify the `"./auth"` export path in `package.json` already covers it (it does — `"./auth": "./src/auth.ts"` is already there).

### Pitfall 4: Pagination in Users Endpoint

**What goes wrong:** Fetching all users in a single query scales poorly. The spec requires 50/page pagination.

**How to avoid:** Use Drizzle `.limit(50).offset((page - 1) * 50)` with a separate `COUNT(*)` query for `total`. Return `{ users, total, page, limit }`.

### Pitfall 5: XP Join for Users Table

**What goes wrong:** `userXp` table stores `totalXp` as a denormalized sum. If a user has no XP transactions, they may have no row in `userXp`. Using INNER JOIN would exclude these users.

**How to avoid:** Use LEFT JOIN between `user` and `userXp`: `db.select({...totalXp: sql<number>\`COALESCE(${userXp.totalXp}, 0)\``}).from(user).leftJoin(userXp, eq(user.id, userXp.userId))`.

### Pitfall 6: Drizzle Aggregation for Challenge Metrics

**What goes wrong:** Challenge metrics (starts, completions, submissions, successfulSubmissions) require joining `challenge` with `userProgress` and `userSubmission`. Naive approaches fetch all rows and compute in JS.

**How to avoid:** Use Drizzle subqueries or lateral joins with `COUNT` + `GROUP BY`. Pattern from existing codebase:
```typescript
db.select({
  id: challenge.id,
  starts: sql<number>`COUNT(DISTINCT CASE WHEN ${userProgress.status} != 'not_started' THEN ${userProgress.userId} END)`,
  completions: sql<number>`COUNT(DISTINCT CASE WHEN ${userProgress.status} = 'completed' THEN ${userProgress.userId} END)`,
  totalSubmissions: sql<number>`(SELECT COUNT(*) FROM ${userSubmission} WHERE ${userSubmission.challengeId} = ${challenge.id})`,
  successfulSubmissions: sql<number>`(SELECT COUNT(*) FROM ${userSubmission} WHERE ${userSubmission.challengeId} = ${challenge.id} AND ${userSubmission.validated} = true)`,
}).from(challenge).leftJoin(userProgress, eq(challenge.id, userProgress.challengeId)).groupBy(challenge.id)
```

## Code Examples

### Verified: Drizzle SQL Template Literal (from existing codebase)
```typescript
// Source: apps/api/src/routes/user.ts
const result = await db
  .select({
    totalXp: sql<number>`COALESCE(SUM(${userXpTransaction.xpAmount}), 0)`,
  })
  .from(userXpTransaction)
  .where(eq(userXpTransaction.userId, userId));
```

### Verified: zValidator in Hono route (from existing codebase)
```typescript
// Source: apps/api/src/routes/user.ts
userRouter.patch(
  "/name",
  requireAuth,
  zValidator("json", updateNameSchema),
  async (c) => {
    const { firstName, lastName } = c.req.valid("json");
    // ...
  },
);
```

### Verified: queryOptions factory pattern (from apps/web/src/lib/query-options.ts)
```typescript
export function adminChallengesOptions() {
  return queryOptions({
    queryKey: ["admin", "challenges"],
    queryFn: () => api.admin.challenges(),
  });
}
```

### Verified: useMutation invalidation pattern (TanStack Query 5.x)
```typescript
const mutation = useMutation({
  mutationFn: (data) => apiFetch("/endpoint", { method: "PATCH", body: JSON.stringify(data) }),
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "challenges"] });
  },
});
```

## Environment Availability

Step 2.6: SKIPPED — this phase is purely code additions with no external tools or CLIs beyond the existing dev stack (PostgreSQL + Redis already required by the project).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 (apps/api) |
| Config file | none — uses package.json scripts |
| Quick run command | `cd apps/api && pnpm test:run` |
| Full suite command | `pnpm -w test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADMIN-11 | GET /api/admin/challenges returns challenges with metrics | unit/integration | `cd apps/api && pnpm test:run -- admin` | ❌ Wave 0 |
| ADMIN-12 | GET /api/admin/challenges/stats returns correct aggregations | unit/integration | `cd apps/api && pnpm test:run -- admin` | ❌ Wave 0 |
| ADMIN-13 | GET /api/admin/users returns paginated list with metrics | unit/integration | `cd apps/api && pnpm test:run -- admin` | ❌ Wave 0 |
| ADMIN-14 | GET /api/admin/users/stats returns correct user counts | unit/integration | `cd apps/api && pnpm test:run -- admin` | ❌ Wave 0 |
| ADMIN-03..10 | UI renders correct data / mutations work | manual-only | — | — |
| D-03 | PATCH /api/admin/challenges/:id/available updates DB | unit/integration | `cd apps/api && pnpm test:run -- admin` | ❌ Wave 0 |

**Note:** All existing API tests (challenges.test.ts, submit.test.ts, etc.) are `.todo()` stubs — no test infrastructure requires real DB connections. New admin tests should follow the same todo-stub pattern used across the project, adding real assertions only when a test DB environment is available.

### Sampling Rate
- **Per task commit:** `pnpm typecheck` (no real DB in CI)
- **Per wave merge:** `pnpm typecheck && pnpm -w test:run`
- **Phase gate:** TypeScript clean + tests pass before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/src/__tests__/admin.test.ts` — covers ADMIN-11, ADMIN-12, ADMIN-13, ADMIN-14, D-03 with todo stubs
- [ ] `packages/api-schemas/src/auth.ts` — AdminUserItem, AdminUserListOutput, AdminUserStatsOutput schemas must be added before Plan 11-01

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom ban/unban endpoints | Better Auth adminClient() plugin methods | Better Auth 1.x | No custom DB writes; auth state stays consistent |
| Global state for server state | TanStack Query cache | Phase 4+ | Optimistic updates, invalidation, cache management |

## Open Questions

1. **Does Better Auth adminClient block self-ban/self-role-change natively?**
   - What we know: `authClient.admin.banUser()` and `authClient.admin.setRole()` are Better Auth managed
   - What's unclear: Whether Better Auth's admin plugin enforces that an admin cannot ban/modify themselves
   - Recommendation: Add UI guard unconditionally (disable menu item when `user.id === session.user.id`). Document if Better Auth also enforces this.

2. **Challenges stats: is `avgAttempts` in ADMIN-03 the same as `totalSubmissions / uniqueStarters`?**
   - What we know: ADMIN-03 spec says "avg attempts"; existing `AdminStatsOutputSchema` (already in codebase) does not include `avgAttempts` — it has `totalSubmissions`, `successfulSubmissions`, `successRate`, `totalStarts`, `totalCompletions`, `completionRate`
   - What's unclear: Whether "avg attempts" = totalSubmissions / totalStarts, and whether the schema needs to be extended or the UI derives it
   - Recommendation: Derive `avgAttempts = totalSubmissions / totalStarts` in the UI from existing fields. No schema change needed.

## Sources

### Primary (HIGH confidence)
- Direct code inspection — `apps/api/src/routes/admin/index.ts`, `apps/api/src/app.ts`, `apps/api/src/middleware/session.ts`, `apps/api/src/middleware/admin.ts`
- Direct schema inspection — `packages/api-schemas/src/challenges.ts` (AdminChallengeItemSchema already exists)
- Direct code inspection — `apps/admin/src/main.tsx` (QueryClient already set up)
- Direct code inspection — `apps/admin/src/lib/auth-client.ts` (adminClient() already initialized)
- Direct code inspection — `apps/web/src/lib/api-client.ts`, `apps/web/src/lib/query-options.ts` (established patterns)
- Direct DB schema inspection — `apps/api/src/db/schema/auth.ts`, `apps/api/src/db/schema/challenge.ts`

### Secondary (MEDIUM confidence)
- Better Auth admin plugin API (`authClient.admin.banUser/unbanUser/setRole`) — verified by presence of `admin()` plugin in `apps/api/src/lib/auth.ts` and `adminClient()` in `apps/admin/src/lib/auth-client.ts`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — everything verified by direct code inspection
- Architecture: HIGH — all existing patterns confirmed in codebase
- Pitfalls: HIGH — identified from reading actual middleware chain and schema structure
- Validation: MEDIUM — test stubs are todos; no real test infrastructure for admin routes yet

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable stack)
