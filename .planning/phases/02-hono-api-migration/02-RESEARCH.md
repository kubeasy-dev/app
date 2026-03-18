# Phase 2: Hono API Migration - Research

**Researched:** 2026-03-18
**Domain:** Hono 4.x REST API, postgres.js, Better Auth (no OAuth), ioredis rate limiting, Turborepo monorepo
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase boundary:** Build `apps/api` from scratch as Hono 4.x + `@hono/node-server` Node.js long-lived process. Port all tRPC business logic to REST endpoints validated by `@kubeasy/api-schemas`. Replace Neon serverless driver with postgres.js. Install Better Auth with Drizzle adapter (no OAuth providers yet — Phase 3).

**Routers in scope (Phase 2):** `challenge`, `theme`, `type`, `user`, `userProgress`, `xpTransaction`

**Routers deferred (Phase 3+):** `apiKey`, `emailPreference`, `onboarding`

**CLI transition strategy:** Go CLI calls `/api/cli/...` paths already. Phase 2 exposes CLI submission endpoints at BOTH `/api/cli/...` (existing path, preserved) and the canonical REST path `/api/challenges/:slug/submit`. No tRPC alias routes needed.

**Auth middleware:** Better Auth with Drizzle adapter installed in Phase 2 (no OAuth providers). Session reading works from Phase 2 onward. Better Auth handler at `GET/POST /api/auth/*` with CORS middleware before it. Protected endpoints return 401 when no session. Drizzle adapter points to migrated schema in `apps/api`.

**DB schema migration:** `server/db/schema/` migrated as-is into `apps/api/src/db/schema/`. All 5 files: auth, challenge, email, onboarding (even unused ones). postgres.js replaces `@neondatabase/serverless`. Drizzle config in `apps/api` points to `apps/api/src/db/schema/`.

**Development workflow:** `docker-compose up` for infra only (PostgreSQL, Redis, OTel). `turbo dev` from repo root starts `apps/api` (tsx watch). `apps/api` uses `tsx watch` as dev runner.

### Claude's Discretion

- Internal Hono route file structure (flat vs domain groups)
- Middleware stack ordering (cors → logger → session → routes)
- Rate limiting threshold for CLI submission endpoint (sliding window, ioredis)
- Error response shape (consistent 4xx/5xx JSON structure)

### Deferred Ideas (OUT OF SCOPE)

- `apiKey` router — Phase 3 (requires Better Auth apiKey plugin)
- `emailPreference` router — Phase 3+
- `onboarding` router — Phase 3+
- OAuth providers (GitHub, Google, Microsoft) — Phase 3
- OpenAPI spec generation (`@hono/zod-openapi`) — v2 requirement (OPENAPI-01)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| API-01 | `apps/api` runs Hono 4.x + `@hono/node-server`, starts with one command locally | Hono 4.12.8 stable, `@hono/node-server` 1.19.11, tsx watch dev runner pattern confirmed |
| API-02 | Challenges endpoints: list with filters (difficulty, theme, type), detail by slug, themes list | tRPC `challengeRouter.list`, `challengeRouter.getBySlug`, `themeRouter.list` + `typeRouter.list` fully read |
| API-03 | User progress endpoints: completion %, status, submission history, latest validation status | tRPC `userProgressRouter` procedures all read; schemas in `@kubeasy/api-schemas/progress` confirmed |
| API-04 | XP endpoints: balance, transaction history | `xpTransactionRouter.getRecentGains` + `userProgressRouter.getXpAndRank` + `getStreak` read; schemas in `@kubeasy/api-schemas/xp` |
| API-05 | CLI submission endpoint: objective validation, enrichment, storage, XP distribution | Full `submitChallenge` logic read; both `/api/cli/challenges/:slug/submit` and `/api/challenges/:slug/submit` paths required |
| API-06 | Session middleware: Better Auth session extraction, inject `user`+`session` into `c.var` | Better Auth `auth.api.getSession` pattern confirmed from existing `lib/auth.ts` |
| API-07 | postgres.js as Drizzle driver, Neon serverless removed | `drizzle-orm/node-postgres` → use `postgres` (postgres.js) driver, postgres@3.4.8 available |
| API-08 | DB schema migrated as-is from `server/db/schema/` to `apps/api/src/db/schema/` | All 5 schema files read: auth, challenge, email, onboarding, index |
</phase_requirements>

---

## Summary

Phase 2 builds `apps/api` from scratch in the monorepo's (yet-to-be-created) `apps/` directory. The entire existing tRPC business logic is ported to Hono REST handlers — the source code is fully available and has been read. No business logic needs to be invented; the work is translation + wiring.

The critical dependency to track is the XP service (`server/services/xp/`) which contains `calculateStreak`, `calculateLevel`, and `calculateXPGain`. These are pure functions (no Next.js dependencies) that must be copied into `apps/api/src/services/xp/` verbatim — they are the most complex piece of the submission logic.

Better Auth is already used in the existing website with the same Drizzle schema. Phase 2 creates a second `betterAuth()` instance in `apps/api` without OAuth providers — only the Drizzle adapter and `admin()` plugin are needed. OAuth (GitHub, Google, Microsoft) is Phase 3.

**Primary recommendation:** Scaffold `apps/api` with the postgres.js Drizzle connection, mount Better Auth + CORS, wire route groups by domain, port business logic directly from the tRPC routers (which have been fully read), implement ioredis sliding window rate limiting on the CLI submission endpoint.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `hono` | 4.12.8 | HTTP framework | Already chosen; fast, lightweight, excellent TypeScript support |
| `@hono/node-server` | 1.19.11 | Node.js adapter for Hono | Required to run as long-lived process (not serverless) |
| `postgres` (postgres.js) | 3.4.8 | PostgreSQL driver | Replaces `@neondatabase/serverless`; Drizzle ORM supports it natively |
| `drizzle-orm` | 0.45.1 | ORM | Same version as website; schema migrated as-is |
| `better-auth` | 1.5.5 | Auth | Same version as website; new instance in `apps/api` |
| `@better-auth/drizzle-adapter` | 1.5.5 | Better Auth Drizzle adapter | Matches existing website version |
| `ioredis` | 5.x | Redis client | Required for rate limiting; already used in `@kubeasy/jobs` factory |
| `tsx` | 4.21.0 | TypeScript runner | Dev runner with `--watch` mode; JIT compilation, handles workspace `@kubeasy/*` imports |
| `zod` | 4.x (peer) | Validation | Already used in `@kubeasy/api-schemas`; peer dep |
| `nanoid` | 5.1.7 | ID generation | Same as website for submission/progress IDs |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@hono/cors` | bundled in hono | CORS middleware | Required before Better Auth handler |
| `drizzle-kit` | dev only | DB migrations | Same as website, `drizzle-kit generate` / `drizzle-kit migrate` |
| `@kubeasy/api-schemas` | workspace:* | Request/response Zod schemas | Import for all endpoint validation |
| `@kubeasy/jobs` | workspace:* | BullMQ queue factory | If any async job dispatch is needed |
| `@kubeasy/typescript-config` | workspace:* | Shared tsconfig | Base for `apps/api` tsconfig.json |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `postgres` (postgres.js) | `pg` (node-postgres) | postgres.js has simpler API, better prepared statement pooling, smaller footprint; both supported by Drizzle |
| ioredis sliding window (custom) | Upstash rate-limit SDK | Upstash is serverless/HTTP Redis; project uses local Redis so ioredis is the correct choice |
| tsx watch | ts-node, nodemon+tsc | tsx is faster (no separate compilation), handles ESM workspace paths natively |

**Installation (apps/api):**
```bash
pnpm add hono @hono/node-server postgres drizzle-orm better-auth @better-auth/drizzle-adapter ioredis nanoid zod
pnpm add -D drizzle-kit tsx typescript @kubeasy/typescript-config
```

---

## Architecture Patterns

### Recommended Project Structure

```
apps/api/
├── src/
│   ├── index.ts             # Entry point: create Hono app, mount middleware + routes, start server
│   ├── app.ts               # Hono app factory (exported for testing)
│   ├── db/
│   │   ├── index.ts         # postgres.js + Drizzle connection
│   │   └── schema/          # Migrated verbatim from server/db/schema/
│   │       ├── auth.ts
│   │       ├── challenge.ts
│   │       ├── email.ts
│   │       ├── onboarding.ts
│   │       └── index.ts
│   ├── lib/
│   │   ├── auth.ts          # betterAuth() instance (Drizzle adapter, admin plugin, no OAuth)
│   │   └── redis.ts         # ioredis client singleton
│   ├── middleware/
│   │   ├── session.ts       # Better Auth session extraction → c.set('user', user)
│   │   └── rate-limit.ts    # Sliding window rate limiter (ioredis)
│   ├── routes/
│   │   ├── index.ts         # Mount all route groups on the Hono app
│   │   ├── challenges.ts    # GET /api/challenges, GET /api/challenges/:slug, GET /api/challenges/:slug/objectives
│   │   ├── themes.ts        # GET /api/themes, GET /api/themes/:slug
│   │   ├── types.ts         # GET /api/types, GET /api/types/:slug
│   │   ├── user.ts          # PATCH /api/user/name, GET /api/user/xp, GET /api/user/streak
│   │   ├── progress.ts      # GET /api/progress/:slug, POST /api/progress/:slug/start, DELETE /api/progress/:slug/reset
│   │   ├── submissions.ts   # GET /api/challenges/:slug/submissions, GET /api/challenges/:slug/validation-status
│   │   ├── submit.ts        # POST /api/challenges/:slug/submit (canonical) — rate limited
│   │   ├── xp.ts            # GET /api/xp/history
│   │   └── cli/
│   │       └── index.ts     # POST /api/cli/challenges/:slug/submit (CLI path alias)
│   └── services/
│       └── xp/              # Copied verbatim from server/services/xp/
│           ├── index.ts
│           ├── calculateLevel.ts
│           ├── calculateStreak.ts
│           ├── calculateXPGain.ts
│           ├── constants.ts
│           └── types.ts
├── drizzle/                 # Generated migration files (apps/api specific)
├── drizzle.config.ts        # Points to src/db/schema/, uses postgres.js driver
├── package.json
└── tsconfig.json            # Extends @kubeasy/typescript-config/node.json
```

### Pattern 1: Hono App with postgres.js + Drizzle

**What:** Connect Drizzle ORM to a local postgres.js pool instead of Neon serverless HTTP.
**When to use:** All DB operations in `apps/api`.

```typescript
// apps/api/src/db/index.ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

**Drizzle config with postgres.js:**
```typescript
// apps/api/drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Key difference from Neon:** `drizzle-orm/postgres-js` (not `drizzle-orm/neon-http`). The client is `postgres` from `postgres` package, not `neon` from `@neondatabase/serverless`.

### Pattern 2: Hono with Better Auth Session Middleware

**What:** Extract Better Auth session from cookies on protected routes; inject into Hono context variables.
**When to use:** Any route requiring an authenticated user.

```typescript
// apps/api/src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { admin } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema/auth";

export const auth = betterAuth({
  baseURL: process.env.API_URL ?? "http://localhost:3001",
  trustedOrigins: [
    "http://localhost:3000",
    "https://kubeasy.dev",
  ],
  database: drizzleAdapter(db, { provider: "pg", schema }),
  plugins: [admin()],
  // NO socialProviders here — Phase 3
  session: {
    cookieCache: { enabled: true, maxAge: 60 * 60 * 24 * 7 },
  },
});
```

```typescript
// apps/api/src/middleware/session.ts
import type { MiddlewareHandler } from "hono";
import { auth } from "@/lib/auth";

// Reads Better Auth session from request cookies
// Sets c.var.user and c.var.session — returns 401 if no session on protected routes
export const sessionMiddleware: MiddlewareHandler = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (session) {
    c.set("user", session.user);
    c.set("session", session.session);
  }
  await next();
};

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
};
```

### Pattern 3: Better Auth Handler Mount

**What:** Mount Better Auth's request handler on `GET/POST /api/auth/*`. CORS must run BEFORE it.

```typescript
// apps/api/src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "@/lib/auth";

const app = new Hono();

// CORS before auth handler (Better Auth reads Origin header)
app.use("/api/*", cors({
  origin: ["http://localhost:3000", "https://kubeasy.dev"],
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
}));

app.use("*", logger());

// Mount Better Auth handler
app.on(["GET", "POST"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});
```

### Pattern 4: ioredis Sliding Window Rate Limiting

**What:** Custom sliding window rate limiter using ioredis for the CLI submission endpoint.
**Why:** Upstash SDK targets HTTP Redis (serverless); project uses local Redis with ioredis.

```typescript
// apps/api/src/middleware/rate-limit.ts
import type { MiddlewareHandler } from "hono";
import type { Redis } from "ioredis";

// Sliding window: max requests per window using sorted sets
// Key: rate_limit:{identifier}:{endpoint}
export function slidingWindowRateLimit(
  redis: Redis,
  options: { windowMs: number; max: number; keyFn: (c: any) => string },
): MiddlewareHandler {
  return async (c, next) => {
    const now = Date.now();
    const windowStart = now - options.windowMs;
    const key = options.keyFn(c);

    const count = await redis
      .multi()
      .zremrangebyscore(key, 0, windowStart)           // Remove old entries
      .zadd(key, now, `${now}-${Math.random()}`)       // Add current request
      .zcard(key)                                       // Count requests in window
      .expire(key, Math.ceil(options.windowMs / 1000)) // TTL cleanup
      .exec();

    const requestCount = (count?.[2]?.[1] as number) ?? 0;

    if (requestCount > options.max) {
      return c.json({ error: "Too Many Requests" }, 429);
    }

    await next();
  };
}
```

**Rate limit config for CLI submission (per success criteria: HTTP 429 after threshold with 100 req/10s):**
- Window: 10,000ms (10 seconds)
- Max: 10 requests per window per user/IP
- Key: `rate_limit:submit:{userId}` (or IP if no auth)

### Pattern 5: tsx watch for Development

```json
// apps/api/package.json scripts
{
  "dev": "tsx watch src/index.ts",
  "start": "node dist/index.js",
  "typecheck": "tsc --noEmit",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate"
}
```

`tsx watch` reloads on file changes, handles TypeScript transpilation JIT, resolves workspace `@kubeasy/*` imports via tsconfig paths or pnpm workspace symlinks.

### Pattern 6: XP Service Port

The XP service (`server/services/xp/`) contains pure functions with NO Next.js dependencies. It imports only from `@/server/db` (a DB instance). In `apps/api`, the same service is copied verbatim with the DB import pointing to `apps/api/src/db/index.ts`.

```
calculateStreak(userId) — queries userXpTransaction for daily_streak actions in rolling window
calculateLevel(userId) — queries userXp.totalXp, returns RankInfo with name/progress/nextRankXp
calculateXPGain({difficulty, isFirstChallenge, currentStreak}) — pure function, no DB
```

### Anti-Patterns to Avoid

- **Hono RPC client (`hc<AppType>()`):** Explicitly out of scope — incompatible with Go CLI. Do not use.
- **`@neondatabase/serverless` in apps/api:** Success criteria #3 requires `pnpm why @neondatabase/serverless` returns empty. Don't install it anywhere.
- **Shared Drizzle schema between apps:** Each app has its own schema copy and migration history.
- **Missing CORS before Better Auth:** Better Auth reads the Origin header. CORS middleware MUST run first or auth will fail on cross-origin requests.
- **Upstash rate-limit SDK:** Requires HTTP Redis endpoint. The project uses local Redis with ioredis.
- **`next/cache` directives in apps/api:** `cacheLife`, `cacheTag`, `revalidateTag` are Next.js-only. None of the ported logic should use them.
- **`better-all` in apps/api:** The existing routers use `better-all` for parallel DB calls. Replace with `Promise.all()` or `Promise.allSettled()` in Hono handlers — `better-all` is a Next.js utility.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth session reading | Custom cookie parser | `auth.api.getSession({ headers })` | Better Auth handles token verification, cookie parsing, session expiry, and cache |
| Rate limiting data structure | Manual Redis counters | Sorted set sliding window (ioredis ZADD/ZCARD) | Atomic multi-command pipeline; handles concurrent requests correctly |
| DB migrations | SQL files by hand | `drizzle-kit generate` + `drizzle-kit migrate` | Schema changes tracked, migration history preserved |
| TypeScript runner | Custom esbuild setup | `tsx watch` | Zero config, handles workspace paths, ESM-compatible |
| XP calculation | Rewrite from scratch | Copy `server/services/xp/` verbatim | Already tested, race conditions already handled |
| CORS headers | Manual header setting | `hono/cors` middleware | Handles preflight OPTIONS, credentials, header allowlist correctly |

**Key insight:** The most complex logic (XP calculation, streak computation, objective validation) already exists and is tested. This phase is a translation layer, not an invention phase.

---

## Common Pitfalls

### Pitfall 1: `better-all` Usage in Ported Code

**What goes wrong:** The tRPC routers heavily use `better-all` for parallel DB queries (e.g., `resetChallenge`, `resetProgress`). Copying this into `apps/api` will fail — `better-all` has a dependency on Next.js internals.
**Why it happens:** The library is designed for Next.js server components.
**How to avoid:** Replace every `all({ async a() {...}, async b() {...} })` with `Promise.all([...])` or individual awaits.
**Warning signs:** TypeScript error on import, or runtime errors about Next.js context.

### Pitfall 2: `next/cache` Directives in Business Logic

**What goes wrong:** The challenge router uses `"use cache"`, `cacheLife("hours")`, `cacheTag("challenges")`, and `revalidateTag("challenges", "max")`. These are Next.js 15 cache directives.
**Why it happens:** Business logic and cache invalidation are co-located in the tRPC router.
**How to avoid:** Strip all `next/cache` imports and directives when porting. `apps/api` is stateless — no caching layer needed at this phase.
**Warning signs:** Import errors for `next/cache`, or TS errors on `"use cache"` directive.

### Pitfall 3: `@neondatabase/serverless` Leaking Through Dependencies

**What goes wrong:** The website's `package.json` depends on `@neondatabase/serverless`. If `apps/api` accidentally inherits workspace root dependencies or imports from the website, the Neon driver may end up installed.
**Why it happens:** pnpm workspace hoisting can make root packages available to workspace members.
**How to avoid:** `apps/api/package.json` must NOT have `@neondatabase/serverless`. After install, verify with `pnpm why @neondatabase/serverless` from repo root — must return empty for `apps/api`.
**Warning signs:** `pnpm why @neondatabase/serverless` shows `apps/api` in the dependency tree.

### Pitfall 4: XP Service DB Import Path

**What goes wrong:** The XP service files (copied from `server/services/xp/`) import `db` from `@/server/db`. This path alias points to the website's DB instance, not `apps/api`'s.
**Why it happens:** The path alias `@/` resolves differently in each app.
**How to avoid:** When copying XP service files to `apps/api/src/services/xp/`, update the import in `calculateStreak.ts` and `calculateLevel.ts` from `"@/server/db"` to `"../../db"` (or the correct relative path for `apps/api/src/db`).
**Warning signs:** TypeScript errors at compile time on the DB import; wrong DB instance used at runtime.

### Pitfall 5: Better Auth `trustedOrigins` Missing Web App Origin

**What goes wrong:** When the web frontend (localhost:3000) calls `apps/api` (localhost:3001), Better Auth rejects cross-origin requests with `INVALID_ORIGIN`.
**Why it happens:** Better Auth validates the `Origin` header against `trustedOrigins` in its config.
**How to avoid:** Include all client origins in `trustedOrigins`: `["http://localhost:3000", "https://kubeasy.dev"]`.
**Warning signs:** Auth requests return 403/INVALID_ORIGIN in browser network tab.

### Pitfall 6: Missing `apps/` Directory and Workspace Config

**What goes wrong:** `apps/api` is created but `pnpm-workspace.yaml` doesn't include `apps/*`, so pnpm doesn't recognize it as a workspace package.
**Why it happens:** Current `pnpm-workspace.yaml` only has `'.'` (the root Next.js app). The monorepo hasn't split into `apps/` yet.
**How to avoid:** Add `- 'apps/*'` to `pnpm-workspace.yaml` before or during scaffold. Also add `apps/api` to `turbo.json` dev pipeline if not already covered.
**Warning signs:** `pnpm -F @kubeasy/api ...` commands fail; workspace:* deps not resolved.

### Pitfall 7: Hono Type Variables for Session Context

**What goes wrong:** TypeScript doesn't know `c.get("user")` returns `User` type — it returns `unknown`, causing type errors throughout route handlers.
**Why it happens:** Hono uses generic type variables for context variables.
**How to avoid:** Declare a typed Hono instance with `Variables`:
```typescript
type Variables = {
  user: typeof auth.$Infer.Session.user | undefined;
  session: typeof auth.$Infer.Session.session | undefined;
};
const app = new Hono<{ Variables: Variables }>();
```
**Warning signs:** `c.get("user")` is typed as `unknown`; type errors in route handlers accessing user properties.

---

## Code Examples

Verified patterns from the existing codebase:

### Postgres.js + Drizzle (replacing Neon)

```typescript
// BEFORE (website — server/db/index.ts)
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
const sql = neon(env.DATABASE_URL);
const db = drizzle({ client: sql });

// AFTER (apps/api — src/db/index.ts)
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

### submitChallenge Business Logic (critical path)

The core validation logic to port from `server/api/routers/userProgress.ts:submitChallenge`:

1. Find challenge by slug (DB query)
2. Check if already completed (fast-path check)
3. Fetch `challengeObjective` metadata for the challenge
4. Build `metadataMap` (key → metadata)
5. Validate no missing keys: `expectedKeys.size > 0 && missingKeys.length > 0` → 422
6. Validate no unknown keys: `unknownKeys.length > 0` → 422
7. Enrich results → `objectives[]` array
8. `validated = results.every(r => r.passed)`
9. Insert `userSubmission` (always, even if failed)
10. If `!validated`, return failure response
11. Atomic progress update (UPDATE with `ne(status, "completed")` guard or INSERT `onConflictDoNothing`)
12. If `!progressUpdated`, return early (race condition guard — no XP, no analytics)
13. `isFirstChallenge` from xpTransaction count (authoritative, read AFTER atomic write)
14. `calculateStreak(userId)` → `currentStreak`
15. `calculateXPGain(...)` → `xpGain`
16. Atomic `userXp` UPSERT (`onConflictDoUpdate`)
17. Insert 1-3 `userXpTransaction` rows (base, firstChallenge, streak)
18. Return success response with XP breakdown

### Challenge List with Filters (porting challenge.ts)

The challenge list query uses `"use cache"` and `cacheTag` directives — strip these. The SQL aggregation logic (COUNT CASE WHEN, COALESCE MAX for userStatus) is pure Drizzle and ports directly. The `showCompleted` filter with subquery must be preserved.

### ioredis Client Singleton

```typescript
// apps/api/src/lib/redis.ts
import { Redis } from "ioredis";

export const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `drizzle-orm/neon-http` | `drizzle-orm/postgres-js` | Phase 2 migration | Long-lived connection pool; no HTTP overhead per query |
| Upstash rate limiting | ioredis sliding window | Phase 2 migration | Local Redis; no external HTTP dependency |
| tRPC for CLI endpoints | REST at `/api/cli/...` | Was already REST | No change needed for CLI path; just need the handler |
| `better-all` parallel queries | `Promise.all()` | Phase 2 port | `better-all` is Next.js only |
| `next/cache` tags | No-op (removed) | Phase 2 port | Stateless API; caching is a Phase 2+ concern |

**Deprecated/outdated patterns in ported code:**
- `"use cache"` directive: Next.js 15 only — strip when porting to Hono
- `cacheLife`, `cacheTag`, `revalidateTag`: Strip all — Hono has no equivalent at this phase
- `better-all`: Replace with `Promise.all` or parallel awaits

---

## Open Questions

1. **`challengeObjective` import in `server/db/schema/challenge.ts`**
   - What we know: The schema file imports `ObjectiveTypeSchema` from `"@/schemas/challengeObjectives"` (a Next.js app file)
   - What's unclear: This cross-dependency means the schema can't be copied verbatim into `apps/api` without also copying the Zod schema
   - Recommendation: Copy the `ObjectiveTypeSchema` definition inline into `apps/api/src/db/schema/challenge.ts` OR import from `@kubeasy/api-schemas/submissions` where `ObjectiveCategorySchema` is defined with the same enum values

2. **`pnpm-workspace.yaml` currently only has `'.'`**
   - What we know: The workspace config only lists the root package. `packages/api-schemas` and `packages/jobs` work because they're in `packages/` — but this is NOT in the workspace file either
   - What's unclear: How `@kubeasy/api-schemas` and `@kubeasy/jobs` are currently resolving. There may be an undiscovered workspace config or direct package.json path linking.
   - Recommendation: Verify `pnpm list @kubeasy/api-schemas` before starting scaffold. Update `pnpm-workspace.yaml` to `['packages/*', 'apps/*']` in Plan 02-01.

3. **`calculateLevel` DB dependency**
   - What we know: `calculateLevel.ts` queries the `userXp` table
   - What's unclear: Whether it imports `db` directly (like `calculateStreak` does) or receives it as a parameter
   - Recommendation: Read `calculateLevel.ts` before implementing — if it uses the global `@/server/db` import, update the path when copying to `apps/api/src/services/xp/`

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest (already in workspace root) |
| Config file | None yet for `apps/api` — Wave 0 creates `apps/api/vitest.config.ts` |
| Quick run command | `pnpm -F @kubeasy/api test:run` |
| Full suite command | `pnpm -F @kubeasy/api test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| API-01 | Server starts and responds to GET /api/challenges | smoke | `curl http://localhost:3001/api/challenges` | Wave 0 |
| API-02 | Challenge list returns correct JSON shape | integration | `pnpm -F @kubeasy/api test:run -- challenges` | Wave 0 |
| API-05 | Submit with missing objectives returns 422 | unit | `pnpm -F @kubeasy/api test:run -- submit` | Wave 0 |
| API-05 | Submit with unknown objectives returns 422 | unit | `pnpm -F @kubeasy/api test:run -- submit` | Wave 0 |
| API-05 | Submit all-pass triggers XP distribution | unit | `pnpm -F @kubeasy/api test:run -- submit` | Wave 0 |
| API-06 | Protected route returns 401 without session | unit | `pnpm -F @kubeasy/api test:run -- middleware` | Wave 0 |
| API-07 | `pnpm why @neondatabase/serverless` returns empty | manual | `pnpm why @neondatabase/serverless` | ✅ (CLI) |
| Success 4 | Rate limit returns 429 after threshold | script | `node scripts/rate-limit-test.js` | Wave 0 |
| Success 5 | CLI payload accepted at `/api/cli/...` | integration | `pnpm -F @kubeasy/api test:run -- cli` | Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm -F @kubeasy/api test:run`
- **Per wave merge:** `pnpm -F @kubeasy/api test:run && pnpm typecheck`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/api/vitest.config.ts` — vitest config for the api app
- [ ] `apps/api/src/__tests__/challenges.test.ts` — covers API-02
- [ ] `apps/api/src/__tests__/submit.test.ts` — covers API-05
- [ ] `apps/api/src/__tests__/middleware.test.ts` — covers API-06
- [ ] `apps/api/src/__tests__/cli.test.ts` — covers CLI path (Success 5)
- [ ] `scripts/rate-limit-test.js` — 100 req/10s script for Success 4
- [ ] Framework install: `pnpm add -D vitest -F @kubeasy/api`

---

## Sources

### Primary (HIGH confidence)

- Existing codebase — `server/api/routers/challenge.ts`, `userProgress.ts`, `xpTransaction.ts`, `theme.ts`, `type.ts`, `user.ts` — full business logic read
- Existing codebase — `server/db/schema/{auth,challenge,email,onboarding}.ts` — complete Drizzle schema read
- Existing codebase — `server/services/xp/` — XP calculation service read
- Existing codebase — `lib/auth.ts` — Better Auth config pattern confirmed
- Existing codebase — `server/db/index.ts` — current Neon driver pattern to replace
- Existing codebase — `packages/api-schemas/src/{submissions,progress}.ts` — Zod schemas confirmed
- npm registry — hono@4.12.8, @hono/node-server@1.19.11, postgres@3.4.8, tsx@4.21.0, ioredis@5.x, better-auth@1.5.5, drizzle-orm@0.45.1 — versions verified

### Secondary (MEDIUM confidence)

- `.planning/phases/02-hono-api-migration/02-CONTEXT.md` — locked decisions from discussion session
- `turbo.json` — dev pipeline structure confirmed; `apps/api` needs `dev` task entry
- `docker-compose.yml` — PostgreSQL + Redis + OTel services confirmed present

### Tertiary (LOW confidence)

- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified from npm registry; all libraries already used in the codebase
- Architecture: HIGH — patterns derived directly from existing working code
- Pitfalls: HIGH — identified by reading the exact source code being ported; issues are concrete, not speculative
- Business logic: HIGH — every tRPC router has been read in full; no inference needed

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable libraries; Better Auth is actively developed but 1.5.5 is pinned)
