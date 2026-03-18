# Directory Structure

## Overview

Next.js 15 App Router project. Source files live at the root level with no `src/` directory. Routes, components, and server code are clearly separated.

## Top-Level Layout

```
/
├── app/                  # Next.js App Router (routes, layouts, API)
├── components/           # Shared React components
├── lib/                  # Utilities and service clients
├── server/               # Backend-only code (DB, tRPC)
├── trpc/                 # tRPC client/server wiring
├── schemas/              # Zod validation schemas
├── types/                # TypeScript type definitions
├── scripts/              # One-off scripts (OpenAPI generation)
├── public/               # Static assets
├── drizzle/              # Generated migration files
├── .husky/               # Git hooks
├── .planning/            # GSD planning artifacts
├── biome.json            # Linter/formatter config
├── drizzle.config.ts     # Drizzle ORM config
├── instrumentation.ts    # OpenTelemetry setup
├── next.config.ts        # Next.js config
├── package.json          # Dependencies (pnpm)
└── tsconfig.json         # TypeScript config
```

## App Router Structure

```
app/
├── (main)/               # Public/authenticated user routes
│   ├── layout.tsx        # Main layout (header, footer)
│   ├── page.tsx          # Landing page
│   ├── challenges/       # Challenge browse + detail
│   │   ├── page.tsx      # Challenge listing with filters
│   │   └── [slug]/
│   │       └── page.tsx  # Challenge detail page
│   ├── themes/           # Theme browse + detail
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── types/            # Challenge types
│   ├── blog/             # Blog listing + articles
│   │   ├── page.tsx
│   │   ├── [slug]/page.tsx
│   │   ├── blog-list-client.tsx
│   │   └── category/[category]/page.tsx
│   ├── dashboard/        # User dashboard
│   ├── profile/          # User profile
│   └── get-started/      # Onboarding flow
├── (admin)/              # Admin-only routes
│   ├── layout.tsx        # Admin layout (role-protected)
│   └── admin/
│       ├── challenges/   # Challenge admin CRUD
│       └── users/        # User management
├── api/
│   ├── auth/[...all]/    # Better Auth catch-all handler
│   ├── trpc/[trpc]/      # tRPC API endpoint
│   └── cli/              # CLI submission endpoints (OpenAPI)
├── auth/callback/        # OAuth callback page
├── onboarding/           # Post-signup onboarding
├── login/                # Login page
├── layout.tsx            # Root layout (fonts, providers, analytics)
└── global-error.tsx      # Global error boundary
```

## Server Code

```
server/
├── api/
│   ├── trpc.ts           # tRPC init, context, middleware, procedures
│   ├── root.ts           # Router assembly
│   └── routers/
│       ├── challenge.ts  # Challenge queries/mutations
│       ├── theme.ts      # Theme queries
│       ├── userProgress.ts  # Progress tracking + submission
│       └── xpTransaction.ts # XP history
└── db/
    ├── index.ts          # Neon serverless connection
    └── schema/
        ├── auth.ts       # user, session, account, verification, apikey
        ├── challenge.ts  # challenge, theme, type, userProgress, userSubmission, xpTransaction, challengeObjective, userXp
        └── index.ts      # Re-exports all schemas
```

## Components

```
components/
├── ui/                   # shadcn/ui components (Radix primitives)
│   ├── alert.tsx
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── navigation-menu.tsx
│   ├── select.tsx
│   ├── separator.tsx
│   ├── switch.tsx
│   └── ...
├── *-section.tsx         # Landing page sections
├── challenge-*.tsx       # Challenge-related components
├── user-*.tsx            # User-related components
├── header.tsx            # Site header
├── footer.tsx            # Site footer
└── login-card.tsx        # Login form (social providers)
```

## Library/Utilities

```
lib/
├── auth.ts               # Better Auth server config (social providers, plugins)
├── auth-client.ts        # Better Auth client helpers
├── analytics-server.ts   # PostHog server-side error capture
├── logger.ts             # OpenTelemetry structured logger (server-only)
├── utils.ts              # cn() and misc utilities
└── constants.ts          # App-wide constants
```

## tRPC Wiring

```
trpc/
├── client.tsx            # TRPCReactProvider + useTRPC hook
├── server.tsx            # Server-side trpc + HydrateClient
└── query-client.ts       # React Query config
```

## Types & Schemas

```
schemas/
├── challengeFilters.ts   # Zod schemas for challenge filters
└── challengeObjectives.ts # Objective type enum schema

types/
├── trpc.ts               # Re-exports of all tRPC inferred types
└── cli-api.ts            # CLI submission types (ObjectiveResult, Objective)
```

## Naming Conventions

| Pattern | Convention | Examples |
|---------|-----------|---------|
| Files | kebab-case | `challenge-card.tsx`, `user-progress.ts` |
| Components | PascalCase | `ChallengeCard`, `UserProgress` |
| Functions | camelCase | `getChallenge`, `submitResult` |
| DB tables | snake_case | `user_progress`, `challenge_objective` |
| Route groups | `(group)` | `(main)`, `(admin)` |
| Dynamic routes | `[param]` | `[slug]`, `[trpc]` |
| Admin sub-components | `_components/` | `admin/challenges/_components/` |

## Key Entry Points

- **Web app root**: `app/layout.tsx` — root layout, providers
- **Main routes**: `app/(main)/layout.tsx` — auth gating, header/footer
- **tRPC API**: `app/api/trpc/[trpc]/route.ts`
- **Auth API**: `app/api/auth/[...all]/route.ts`
- **CLI API**: `app/api/cli/` — OpenAPI-documented CLI endpoints
- **DB schema**: `server/db/schema/index.ts`
- **tRPC router**: `server/api/root.ts`
- **OpenTelemetry**: `instrumentation.ts` — Next.js instrumentation hook

---
*Generated: 2026-03-18*
