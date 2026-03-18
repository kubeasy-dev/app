# Technology Stack

**Analysis Date:** 2025-03-18

## Languages

**Primary:**
- TypeScript 5.9.3 - Full codebase (strict mode enabled)
- JavaScript/JSX - React components (via TypeScript)

**Secondary:**
- CSS - Tailwind CSS 4.2.1 for styling

## Runtime

**Environment:**
- Node.js 24.14.0 (pinned in `.nvmrc`)
- Vercel platform for deployment (preview + production environments)

**Package Manager:**
- pnpm 10.32.1 (enforced via `packageManager` field)
- Lockfile: pnpm-lock.yaml (not committed, but managed by pnpm)

## Frameworks

**Core:**
- Next.js 16.1.6 with App Router and React 19.2.4
- React 19.2.4 - Latest React with server/client component support
- React DOM 19.2.4

**API & Communication:**
- tRPC 11.12.0 - Type-safe RPC with React Query integration
- @trpc/tanstack-react-query 11.12.0 - React Query adapter for tRPC
- @tanstack/react-query 5.90.21 - Server state management
- Superjson 2.2.6 - JSON serialization for tRPC payloads

**Database:**
- Drizzle ORM 0.45.1 - TypeScript ORM with migration tooling
- drizzle-kit 0.31.9 - Database schema management
- @neondatabase/serverless 1.0.2 - Neon PostgreSQL client for serverless

**Authentication:**
- better-auth 1.5.5 - Authentication framework (replaces NextAuth)
- @better-auth/drizzle-adapter 1.5.5 - Drizzle ORM adapter
- @better-auth/api-key 1.5.5 - API key authentication plugin

**UI & Styling:**
- Tailwind CSS 4.2.1 - Utility-first CSS framework
- Radix UI components via shadcn/ui (v1 primitives)
  - @radix-ui/react-dialog 1.1.15
  - @radix-ui/react-dropdown-menu 2.1.16
  - @radix-ui/react-navigation-menu 1.2.14
  - @radix-ui/react-select 2.2.6
  - @radix-ui/react-avatar 1.1.11
  - @radix-ui/react-label 2.1.8
  - @radix-ui/react-separator 1.1.8
  - @radix-ui/react-switch 1.2.6
  - @radix-ui/react-slot 1.2.4
- class-variance-authority 0.7.1 - Component class composition
- tailwind-merge 3.5.0 - Merge Tailwind classes intelligently
- clsx 2.1.1 - Conditional className builder
- lucide-react 0.577.0 - Icon library (57+ icons used)
- recharts 3.8.0 - Chart library for data visualization
- sonner 2.0.7 - Toast notifications
- geist 1.7.0 - Geist Sans and Geist Mono fonts

**Validation & Configuration:**
- Zod 4.3.6 - Runtime schema validation
- @t3-oss/env-nextjs 0.13.10 - Environment variable validation
- zod-openapi 5.4.6 - OpenAPI schema generation from Zod

**Testing:**
- Vitest 4.1.0 - Unit/component test runner (Vite-based)
- @vitest/ui 4.1.0 - Visual test runner UI

**Build & Dev Tools:**
- Biome 2.4.6 - Linter and formatter (replaces ESLint + Prettier)
- ESLint 10.0.3 - Fallback linting (used with eslint-config-next)
- eslint-config-next 16.1.6 - Next.js ESLint rules
- TypeScript 5.9.3 - Type checking

**Git & Code Quality:**
- Husky 9.1.7 - Git hooks
- lint-staged 16.3.3 - Run linters on staged files
- knip 5.86.0 - Find unused exports/imports

**Utilities:**
- nanoid 5.1.6 - ID generation
- server-only 0.0.1 - Prevent client imports of server code
- fuse.js 7.1.0 - Fuzzy search
- react-error-boundary 6.1.1 - Error boundaries
- next-themes 0.4.6 - Theme management
- better-all 0.0.7 - Parallel promise execution
- shiki 4.0.2 - Syntax highlighting

## Key Dependencies

**Critical:**
- better-auth - Modern replacement for NextAuth, handles OAuth, sessions, and account management
- Drizzle ORM - Type-safe database layer with excellent TypeScript support
- Neon - Serverless PostgreSQL connection pooling optimized for Vercel

**Infrastructure:**
- @upstash/redis 1.37.0 - Redis REST client for serverless (optional, falls back to DB)
- @upstash/realtime 1.0.3 - Real-time events via Redis Streams (optional, for WebSocket-like features)
- posthog-js 1.360.1 - Client-side analytics
- posthog-node 5.28.1 - Server-side analytics
- @posthog/nextjs-config 1.8.20 - PostHog Next.js integration wrapper
- @opentelemetry/sdk-logs 0.213.0 - OpenTelemetry logging
- @opentelemetry/exporter-logs-otlp-http 0.213.0 - OTLP exporter for PostHog
- @vercel/analytics 2.0.1 - Vercel Web Analytics

**Content & Blog:**
- @notionhq/client 5.12.0 - Notion API integration (blog content source)

**Email:**
- resend 6.9.3 - Transactional email service
- @react-email/render 2.0.4 - Email template rendering

## Configuration

**Environment:**
- Environment validation via `env.js` using @t3-oss/env-nextjs
- Variables split into server (private) and client (public with NEXT_PUBLIC_ prefix)
- Configuration: `env.js` (validated at runtime)

**Build:**
- Next.js config: `next.config.ts` - Turbopack enabled, image optimization, PostHog rewrites
- Drizzle config: `drizzle.config.ts` - PostgreSQL dialect, migrations in `./drizzle`
- TypeScript config: `tsconfig.json` - ES2017 target, strict mode, path alias `@/*`
- Biome config: `biome.json` - Code formatting and linting rules

**Database Migrations:**
- Drizzle migrations auto-generated to `drizzle/` directory
- Schema located in `server/db/schema/`:
  - `auth.ts` - Better Auth tables (user, session, account, verification, apikey)
  - `challenge.ts` - Challenge system tables (challenge, challengeObjective, userProgress, userSubmission, xpTransaction)
  - `index.ts` - Schema exports

## Platform Requirements

**Development:**
- Node.js 24.14.0
- pnpm 10.32.1
- PostgreSQL connection string (Neon)

**Production:**
- Vercel deployment (preview + production)
- Environment variables required (see env.js):
  - DATABASE_URL (Neon)
  - BETTER_AUTH_SECRET
  - OAuth credentials (GitHub, Google, Microsoft)
  - RESEND_API_KEY
  - PostHog keys (NEXT_PUBLIC_POSTHOG_KEY, etc.)
  - Optional: Upstash Redis (KV_REST_API_URL, KV_REST_API_TOKEN)
  - Optional: Notion integration tokens

---

*Stack analysis: 2025-03-18*
