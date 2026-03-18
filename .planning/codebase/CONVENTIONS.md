# Code Conventions

## Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| Biome | 2.4.6 | Linting + formatting (replaces ESLint + Prettier) |
| TypeScript | 5.9.x | Type safety |
| Husky + lint-staged | — | Pre-commit hooks |

Biome runs automatically on staged files at commit time. TypeScript is checked across the full project (`pnpm typecheck`).

## Formatting

- **Indent**: 2 spaces (no tabs)
- **Quotes**: double quotes for strings
- **Trailing commas**: enabled
- **Import organization**: auto-sorted by Biome `organizeImports`
- **CSS files**: excluded from Biome linting

## Naming

| Scope | Style | Example |
|-------|-------|---------|
| Files | kebab-case | `challenge-card.tsx` |
| React components | PascalCase | `ChallengeCard` |
| Functions / hooks | camelCase | `useChallengeFilters`, `getChallenge` |
| Types / interfaces | PascalCase | `ChallengeDetail`, `ObjectiveResult` |
| Database columns | snake_case (Drizzle) | `challenge_id`, `updated_at` |
| Zod schemas | camelCase suffix `Schema` | `ChallengeFiltersSchema` |
| tRPC routers | camelCase | `challengeRouter`, `userProgressRouter` |

## React / Next.js Patterns

### Server vs. Client Components

- Default to **Server Components** — no `"use client"` unless interactivity is required
- `"use client"` placed at the very top of the file
- Client components call tRPC via `useTRPC` hook (React Query)
- Server components call tRPC via `trpc` server caller (bypasses HTTP)

```typescript
// Server component
import { trpc } from "@/trpc/server";
const data = await trpc.challenge.getBySlug.query({ slug });

// Client component
"use client";
import { useTRPC } from "@/trpc/client";
const { data } = useTRPC.challenge.getBySlug.useQuery({ slug });
```

### Route Groups

- `(main)` — public + authenticated user pages
- `(admin)` — admin-only, role-gated via `(admin)/layout.tsx`
- Admin sub-components in `_components/` directories within route segments

## tRPC Patterns

### Procedure Types

```typescript
publicProcedure   // No auth required (still captures errors)
privateProcedure  // Requires session (enforceUserIsAuthed middleware)
adminProcedure    // Requires admin role (enforceUserIsAdmin middleware)
```

### Input Validation

All procedures use Zod schemas for input validation. Invalid inputs return `BAD_REQUEST` with flattened Zod errors (`zodError` in response).

### Error Handling

- Errors thrown as `TRPCError` with appropriate codes
- All procedure errors automatically captured to PostHog via `errorMiddleware`
- Zod errors surfaced to client via `errorFormatter`

```typescript
throw new TRPCError({ code: "NOT_FOUND", message: "Challenge not found" });
throw new TRPCError({ code: "UNAUTHORIZED" });
throw new TRPCError({ code: "FORBIDDEN", message: "Admin access only" });
```

## Database Patterns (Drizzle ORM)

### Query Style

```typescript
// Select with conditions
const result = await ctx.db
  .select()
  .from(challenge)
  .where(eq(challenge.slug, input.slug))
  .limit(1);

// Insert with conflict handling
await ctx.db
  .insert(userProgress)
  .values({ ... })
  .onConflictDoNothing();
```

### Schema Conventions

- Tables use `pgTable` with explicit column names in snake_case
- All tables have `createdAt` + `updatedAt` timestamps
- `updatedAt` uses `.$onUpdate(() => new Date())` for auto-update
- Indexes defined inline in table definition array
- Foreign keys use `references()` with explicit `onDelete` behavior

### Migrations

Generated via `pnpm db:generate`, applied via `pnpm db:migrate`. Never manually edit migration files.

## Authentication Patterns

```typescript
// Server-side session check
import { auth } from "@/lib/auth";
const session = await auth.api.getSession({ headers });

// Client-side session
import { useSession } from "@/lib/auth-client";
const { data: session } = useSession();
```

## Logging (Server-side Only)

```typescript
import { logger } from "@/lib/logger";
// server-only — do NOT import in client components

logger.info("Event occurred", { userId, action });
logger.error("Operation failed", { error: String(err) });
```

Client components use `console.*` directly.

## Environment Variables

Validated at build time via `@t3-oss/env-nextjs`. Env vars are typed and fail-fast if missing. Public vars prefixed `NEXT_PUBLIC_`.

## Path Aliases

`@/*` maps to the project root. Always use `@/` imports instead of relative paths.

```typescript
// Preferred
import { auth } from "@/lib/auth";
import db from "@/server/db";

// Avoid
import { auth } from "../../lib/auth";
```

## Linter Rules

- `noExplicitAny`: warn (error in most files, off in `trpc/server.tsx`)
- `noArrayIndexKey`: warn (acceptable in static lists)
- `noStaticElementInteractions`: warn
- CSS files: linting disabled entirely
- CLI API files (`app/api/cli/**/*.ts`): `noNonNullAssertion` is warn only

---
*Generated: 2026-03-18*
