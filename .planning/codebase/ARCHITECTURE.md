# Architecture

**Analysis Date:** 2026-03-18

## Pattern Overview

**Overall:** Server-driven Next.js 15 (React 19) application with tRPC for type-safe API, Server Components for data fetching, and Client Components for interactivity.

**Key Characteristics:**
- Full-stack TypeScript with strict type safety
- Hybrid rendering: Server Components (data fetching), Client Components (UI interactions)
- Type-safe RPC via tRPC with Zod validation
- PostgreSQL (Neon serverless) with Drizzle ORM
- Real-time capabilities via Upstash Realtime
- Structured error tracking via PostHog + OpenTelemetry

## Layers

**Presentation Layer:**
- Purpose: Render UI and handle client interactions
- Location: `app/`, `components/`
- Contains: Page components (RSC), Client Components, UI primitives from shadcn/ui
- Depends on: tRPC client hooks, auth-client, analytics
- Used by: Browser/User

**API Layer (tRPC):**
- Purpose: Type-safe RPC endpoint for client-server communication
- Location: `server/api/`
- Contains: Routers (`routers/*.ts`), context setup, middleware (auth, error tracking)
- Depends on: Database layer, auth system, analytics
- Used by: Client components via tRPC hooks, server components via `trpc.ts`

**Business Logic Layer:**
- Purpose: Calculation, validation, and transformation logic
- Location: `server/services/`
- Contains: XP calculation (`xp/calculateXPGain.ts`, `xp/calculateLevel.ts`, etc.), workflow engines
- Depends on: Database layer, types
- Used by: tRPC routers, other services

**Data Layer (Database):**
- Purpose: PostgreSQL schema definitions and connection management
- Location: `server/db/`
- Contains: Drizzle ORM schemas (`schema/*.ts`), database connection (`index.ts`), queries (`queries.ts`)
- Depends on: Neon serverless PostgreSQL
- Used by: tRPC routers, services, queries

**Authentication & Authorization:**
- Purpose: User identity and permission management
- Location: `lib/auth.ts`, `server/db/schema/auth.ts`, `lib/auth-client.ts`
- Contains: Better Auth configuration, OAuth providers (GitHub, Google, Microsoft), session management
- Depends on: Database, Resend (email verification)
- Used by: tRPC context, protected procedures, UI components

**Analytics & Monitoring:**
- Purpose: Observability, error tracking, user analytics
- Location: `lib/logger.ts`, `lib/analytics-server.ts`, `lib/analytics.ts`, `instrumentation.ts`
- Contains: OpenTelemetry logging, PostHog event tracking, error capture
- Depends on: PostHog API, environment variables
- Used by: tRPC error middleware, global error boundary, request instrumentation

## Data Flow

**User Views Challenge List:**

1. User navigates to `/challenges` (Server Component)
2. `app/(main)/challenges/page.tsx` calls `trpc.challenge.list.queryOptions()`
3. Server-side prefetch executes tRPC router `challenge.list` via `createServerCaller()`
4. Router queries database: challenges with filters, user progress (if authenticated), theme/type joins
5. Results cached in Query Client via React Query
6. Page hydrates client with cached data
7. Client Component `ChallengesView` renders with data and allows filtering via `useTRPC` hook
8. Filter changes trigger new query on client via tRPC client link

**User Submits Challenge Solution:**

1. CLI sends POST to `server/api/routers/userProgress.submitChallenge` with validation results
2. tRPC router (protected procedure) validates:
   - User is authenticated
   - Challenge exists
   - All registered objectives are present (no missing/unknown objectives)
3. Router fetches objective metadata from `challengeObjective` table
4. Enriches CLI results with metadata (title, description, category) from database
5. Stores enriched objectives in `userSubmission.objectives` JSON column
6. Awards XP and updates `userProgress.status` if all objectives passed
7. Triggers realtime notification via Upstash (if subscribed)
8. Returns enriched results to CLI
9. Frontend polls `getLatestValidationStatus` for real-time UI update

**Authentication Flow:**

1. User clicks OAuth provider (GitHub, Google, Microsoft)
2. OAuth proxy plugin routes through production URL (`https://kubeasy.dev`)
3. After auth, session created in `session` table
4. Cookie sent to client with encrypted credentials
5. Session extracted in tRPC context via `auth.api.getSession(headers)`
6. Downstream procedures check `ctx.user` and `ctx.session` via middleware
7. User info stored in database and can be hydrated in server/client components

## Key Abstractions

**tRPC Routers:**
- Purpose: Bundle related procedures (queries/mutations)
- Examples: `server/api/routers/challenge.ts`, `server/api/routers/userProgress.ts`
- Pattern: `createTRPCRouter({ query1: publicProcedure..., mutation1: privateProcedure... })`
- Each router composed into `appRouter` in `server/api/root.ts`

**Procedures:**
- Purpose: Define query or mutation with input/output validation and auth level
- Examples:
  - `publicProcedure` - No auth required, can access `ctx.db`
  - `privateProcedure` - Auth required, guarantees `ctx.user` and `ctx.session`
  - `adminProcedure` - Admin auth required, validates `ctx.user.role === "admin"`
- Pattern: `.input(zodSchema).query(({ctx, input}) => ...)` or `.mutation(...)`

**Page Components (RSC):**
- Purpose: Fetch data server-side, prefetch to Query Client, hydrate client
- Examples: `app/(main)/challenges/page.tsx`, `app/(main)/dashboard/page.tsx`
- Pattern:
  1. Mark `async function`
  2. Call `prefetch(trpc.router.query.queryOptions({...}))`
  3. Wrap render in `<HydrateClient>` to pass cache to client
  4. Nested async component renders page content with data

**Database Schemas:**
- Purpose: Define table structure with indexes, foreign keys, enums
- Examples: `server/db/schema/challenge.ts`, `server/db/schema/auth.ts`
- Pattern: `pgTable("table_name", { column: type().references(...), ... }, (table) => [index(...)])`

**Realtime Updates:**
- Purpose: Push updates to connected clients (e.g., validation results)
- Location: `lib/realtime.ts`, `lib/realtime-client.ts`
- Uses: Upstash Realtime channels
- Pattern: Client subscribes to channel, server publishes when event occurs

## Entry Points

**Web Application:**
- Location: `app/layout.tsx`
- Triggers: Browser HTTP request to `/`
- Responsibilities:
  - Set up global providers (TRPCReactProvider, Providers)
  - Configure fonts, metadata, SEO schemas
  - Mount error boundary
  - Inject analytics (Vercel Analytics, PostHog)

**tRPC API Handler:**
- Location: `app/api/trpc/[trpc]/route.ts`
- Triggers: HTTP request to `/api/trpc`
- Responsibilities:
  - Extract headers for session context
  - Route request to tRPC handler
  - Catch and log errors via PostHog

**Authentication Routes:**
- Location: `app/api/auth/[...all]/route.ts`
- Triggers: OAuth callbacks, session operations
- Responsibilities: Handled by Better Auth plugin, generates sessions

**Instrumentation:**
- Location: `instrumentation.ts`
- Triggers: Next.js startup
- Responsibilities:
  - Register OpenTelemetry logger provider
  - Set up request error hooks for PostHog capture
  - Handle graceful shutdown of observability

## Error Handling

**Strategy:** Layered approach with client and server error capture.

**Patterns:**

1. **tRPC Error Middleware** (`server/api/trpc.ts`):
   - Wraps every procedure with `errorMiddleware`
   - Captures tRPC errors and sends to PostHog via `captureServerException()`
   - Returns formatted error with Zod validation details

2. **Request Error Hook** (`instrumentation.ts`):
   - Next.js captures unhandled request errors
   - Sends to PostHog with path, method, route type context

3. **Global Error Boundary** (`app/global-error.tsx`):
   - Client-side error boundary for unhandled React errors
   - Sends to PostHog via `posthog.captureException(error)`
   - Renders default Next.js error page

4. **tRPC Context Extraction**:
   - If session extraction fails, returns `session: null`
   - Downstream procedures enforce auth via middleware
   - Fails with `UNAUTHORIZED` error

## Cross-Cutting Concerns

**Logging:**
- Server-side: `lib/logger.ts` uses OpenTelemetry with PostHog exporter
- Local dev: Falls back to `console.*`
- Production (Vercel): Sends structured logs to PostHog via OTLP HTTP
- Pattern: `logger.info("event", { key: "value" })`

**Validation:**
- Zod schemas throughout: API inputs (`schemas/`), CLI responses, form data
- Type-safe error formatting in tRPC: `zodError` included in error response
- Pattern: `.input(z.object({ ... }))`

**Authentication:**
- Implemented via Better Auth with Drizzle adapter
- Session stored in database, cookie in client
- Extracted in tRPC context and checked via middleware
- Protected routes: Pages check session server-side, tRPC uses middleware

**Caching:**
- Next.js App Router: Uses `"use cache"`, `cacheLife()`, `cacheTag()` directives
- React Query: Client-side caching via `@tanstack/react-query`
- Pattern in queries: Mark static query functions with `"use cache"`

**Realtime Updates:**
- Upstash Realtime channels for broadcasting (e.g., validation results)
- Client subscribes to channel via `lib/realtime-client.ts`
- Server publishes via `lib/realtime.ts`
- Pattern: Channel name derived from user/challenge ID

---

*Architecture analysis: 2026-03-18*
