# Phase 1: Monorepo Scaffold - Research

**Researched:** 2026-03-18
**Domain:** Turborepo + pnpm workspaces, JIT TypeScript packages, Docker Compose dev infra
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Repo Restructuring Strategy**
- The current Next.js 15 app stays at the repo root throughout Phase 1 — no file moves
- Phase 1 only creates `packages/` structure and root monorepo config files (turbo.json, updated pnpm-workspace.yaml, biome.json)
- `apps/api` is created fresh in Phase 2 (Hono API Migration)
- The Next.js app moves to `apps/web` in Phase 4 (Web Migration) — not before
- Root Next.js app IS included as a workspace member in pnpm-workspace.yaml (adds `packages/*` so it can consume `@kubeasy/*` packages via workspace protocol)
- No `apps/` directory created in Phase 1

**api-schemas Content Scope**
- Full coverage NOW — all existing tRPC procedure shapes ported to Zod in Phase 1
- Domains covered: challenges, themes, progress, XP, submissions, auth
- One file per domain: `schemas/challenges.ts`, `schemas/themes.ts`, `schemas/progress.ts`, `schemas/xp.ts`, `schemas/submissions.ts`, `schemas/auth.ts`
- Zod schemas only — NO route path constants (those live in apps/api and apps/web separately)
- JIT strategy: TypeScript source exported directly, no `dist/` build step

**@kubeasy/jobs Package Scope**
- Exports: BullMQ queue names, `JobPayload` types, `createQueue(name, redis)` factory
- No `Worker` implementation — just dispatch-side definitions
- No imports from any `apps/` package (strict unidirectional dependency)

**docker-compose Infra**
- Three services: PostgreSQL, Redis, OTel Collector
- Named volumes: `postgres_data` and `redis_data` — data persists across restarts
- OTel Collector: debug exporter (stdout) ONLY for local dev — no real backend configured in Phase 1
- OTel Collector ports: `4317` (gRPC OTLP), `4318` (HTTP OTLP), `55679` (zpages debug UI)

**Biome/Tooling Config Structure**
- Single root `biome.json` with shared rules — packages/apps extend it via `extends: ['../../biome.json']`
- Existing biome.json is preserved and becomes the monorepo root config
- `packages/typescript-config` provides three configs: `base.json` (strict shared), `node.json` (for apps/api — no DOM, nodenext/commonjs module), `react.json` (for apps/web — jsx, bundler resolution)
- `turbo.json` defines all four pipelines from the start: `build`, `typecheck`, `dev`, `lint`
- Turborepo pipeline respects `dependsOn: ["^build"]` so packages compile before apps

**Turbo env vars**
- `envMode: "loose"` for Phase 1 only — must switch to strict before Phase 7 Railway deploy
- Declared env vars in cache key inputs: `DATABASE_URL`, `REDIS_URL`, `BETTER_AUTH_SECRET`

### Claude's Discretion
- Exact Zod schema field names (should mirror existing tRPC types in `server/api/routers/`)
- Node.js version in `.nvmrc` / `engines` field
- OTel Collector config file name and location (e.g. `docker/otel-collector-config.yaml` or root level)
- Exact postgres and redis image versions in docker-compose
- Whether to add a root `dev` script that orchestrates docker-compose + Next.js dev server

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Turborepo + pnpm workspaces with `apps/`, `packages/`, and `turbo.json` pipelines | Turborepo docs, pnpm workspace structure |
| INFRA-02 | `packages/typescript-config` with base, node, react configs | TypeScript config inheritance patterns |
| INFRA-03 | Pipeline respects dependency graph (`dependsOn: ["^build"]`) | Turborepo `dependsOn` docs |
| INFRA-04 | `docker-compose.yml` with PostgreSQL, Redis, OTel Collector | Docker Compose + OTel Collector docs |
| PKG-01 | `@kubeasy/api-schemas` JIT package — exports Zod schemas, no build step | Turborepo JIT package docs |
| PKG-02 | 100% endpoint coverage: challenges, themes, progress, XP, submissions, auth | Existing tRPC routers read and catalogued |
| PKG-03 | `@kubeasy/jobs` — queue names, `JobPayload` types, `createQueue` factory | BullMQ TypeScript patterns |
| PKG-04 | `@kubeasy/jobs` has no `apps/` imports | Package dependency isolation |
</phase_requirements>

---

## Summary

Phase 1 bootstraps a Turborepo + pnpm workspace without moving any existing code. The root Next.js app stays in place; only new `packages/` subdirectories and root config files are created. Two JIT packages (`@kubeasy/api-schemas`, `@kubeasy/jobs`) export TypeScript source directly — no build step, consumers transpile at their own build time. A `packages/typescript-config` package provides three tsconfig presets. A `docker-compose.yml` brings up PostgreSQL, Redis, and an OTel Collector in debug mode.

The key constraint is that the root Next.js app must be able to `import { ... } from '@kubeasy/api-schemas'` using the pnpm workspace protocol after this phase. This works because: (1) pnpm-workspace.yaml declares `packages/*`, (2) the root is automatically a workspace member in pnpm, and (3) `@kubeasy/api-schemas/package.json` exports TypeScript source files directly.

The existing `schemas/cli-api.ts` already has most of the Zod shapes needed for `@kubeasy/api-schemas`. This file is a reference, not to be imported into the new package — the package creates clean domain-scoped schema files that do NOT import from `@/*` Next.js path aliases (which would break outside the Next.js app).

**Primary recommendation:** Build the packages and configs incrementally — typescript-config first, then api-schemas, then jobs, then docker-compose, then wire it all together with turbo.json.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| turbo | 2.8.17 | Monorepo task runner with caching | Vercel-backed, pnpm-native, best-in-class caching |
| pnpm | 10.32.1 (already in use) | Package manager + workspace protocol | Already used; workspace protocol required for JIT packages |
| zod | 4.3.6 (already in use) | Schema definition in `@kubeasy/api-schemas` | Already used throughout codebase |
| bullmq | 5.71.0 | Queue library for `@kubeasy/jobs` | Redis-native, TypeScript-first, actively maintained |
| ioredis | 5.10.0 | Redis connection for BullMQ factory | BullMQ's recommended Redis client |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| typescript | 5.9.3 (already in use) | Type checking in packages | All packages need tsconfig |
| @biomejs/biome | 2.4.6 (already in use) | Linting in packages | Packages extend root biome.json |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Turborepo JIT packages | Compiled packages with dist/ | More config, better caching — unnecessary for Phase 1 |
| BullMQ + ioredis | BullMQ with inline connection | Factory pattern separates concern — needed for worker extraction later |

**Installation (new packages only):**
```bash
pnpm add -w turbo --save-dev
pnpm add -w bullmq ioredis
```

**Version verification:** Verified against npm registry 2026-03-18.
- `turbo`: 2.8.17
- `bullmq`: 5.71.0
- `ioredis`: 5.10.0
- `zod`: 4.3.6 (already in root package.json)

---

## Architecture Patterns

### Recommended Project Structure (after Phase 1)

```
.                              # repo root (stays as-is, Next.js app)
├── packages/
│   ├── api-schemas/           # @kubeasy/api-schemas — Zod schemas, JIT
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts       # re-exports all domains
│   │       ├── challenges.ts
│   │       ├── themes.ts
│   │       ├── progress.ts
│   │       ├── xp.ts
│   │       ├── submissions.ts
│   │       └── auth.ts
│   ├── jobs/                  # @kubeasy/jobs — BullMQ defs, JIT
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── queue-names.ts
│   │       ├── payloads.ts
│   │       └── factory.ts
│   └── typescript-config/     # @kubeasy/typescript-config — shared tsconfig
│       ├── package.json
│       ├── base.json
│       ├── node.json
│       └── react.json
├── docker/
│   └── otel-collector-config.yaml
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml        # updated: adds packages/*
├── biome.json                 # unchanged (already root-worthy)
└── [existing Next.js files]   # unchanged
```

### Pattern 1: JIT Package exports field

**What:** Export TypeScript source files directly from `package.json#exports`. No build step. Consumer's bundler (Turbopack/webpack/Vite/tsx) transpiles.

**When to use:** Shared schema/type packages consumed by Next.js (Turbopack) and future Hono API (tsx/esbuild). Works because all consumers have a bundler.

**Example:**
```json
// packages/api-schemas/package.json
{
  "name": "@kubeasy/api-schemas",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./challenges": "./src/challenges.ts",
    "./themes": "./src/themes.ts",
    "./progress": "./src/progress.ts",
    "./xp": "./src/xp.ts",
    "./submissions": "./src/submissions.ts",
    "./auth": "./src/auth.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@kubeasy/typescript-config": "workspace:*",
    "typescript": "catalog:"
  },
  "peerDependencies": {
    "zod": "^4.0.0"
  }
}
```
Source: [Turborepo Internal Packages docs](https://turborepo.dev/docs/core-concepts/internal-packages)

### Pattern 2: pnpm-workspace.yaml update

**What:** Add `packages/*` glob so pnpm discovers the new packages. The root `.` is automatically a workspace member — no need to explicitly add it.

**Example:**
```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'

onlyBuiltDependencies:
  - '@tailwindcss/oxide'
  - esbuild
  - sharp
  - unrs-resolver
```

Source: [pnpm workspace docs](https://pnpm.io/pnpm-workspace_yaml) — confirmed: root is always included.

### Pattern 3: turbo.json pipelines

**What:** Four pipelines with correct `dependsOn` to enforce build order. JIT packages don't need a `build` pipeline entry — they have no `build` script. `typecheck` uses `dependsOn: ["^typecheck"]` to check packages before apps.

**Example:**
```json
// turbo.json
{
  "$schema": "https://turborepo.com/schema.json",
  "ui": "tui",
  "envMode": "loose",
  "globalEnv": ["DATABASE_URL", "REDIS_URL", "BETTER_AUTH_SECRET"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    }
  }
}
```

**Critical note:** `envMode: "loose"` means ALL env vars are available to tasks (not just those in `globalEnv`). The `globalEnv` array still puts those vars in the cache key hash. This satisfies the success criterion that `turbo build --dry-run --summarize` shows them as cache key inputs.

Source: [Turborepo configuration reference](https://turborepo.dev/docs/reference/configuration)

### Pattern 4: @kubeasy/jobs factory

**What:** BullMQ queue factory pattern. Exports queue name constants, typed payload interfaces, and `createQueue` function. NO Worker — only the producer side.

**Example:**
```typescript
// packages/jobs/src/queue-names.ts
export const QUEUE_NAMES = {
  CHALLENGE_SUBMISSION: 'challenge-submission',
  XP_AWARD: 'xp-award',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// packages/jobs/src/payloads.ts
import type { QueueName } from './queue-names';
import { QUEUE_NAMES } from './queue-names';

export interface ChallengeSubmissionPayload {
  userId: string;
  challengeSlug: string;
  challengeId: number;
}

export interface XpAwardPayload {
  userId: string;
  challengeId: number;
  xpAmount: number;
  action: 'challenge_completed' | 'daily_streak' | 'first_challenge';
}

export type JobPayload = {
  [QUEUE_NAMES.CHALLENGE_SUBMISSION]: ChallengeSubmissionPayload;
  [QUEUE_NAMES.XP_AWARD]: XpAwardPayload;
};

// packages/jobs/src/factory.ts
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import type { QueueName } from './queue-names';
import type { JobPayload } from './payloads';

export function createQueue<N extends QueueName>(
  name: N,
  connection: IORedis,
): Queue<JobPayload[N]> {
  return new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 1000, age: 86400 },
      removeOnFail: { count: 5000, age: 604800 },
    },
  });
}
```

### Pattern 5: packages/typescript-config

**What:** Three tsconfig files for different consumer environments. Packages reference them via `extends`.

**base.json** (used by packages like api-schemas and jobs):
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "target": "ES2022"
  }
}
```

**node.json** (for apps/api — Phase 2):
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

**react.json** (for apps/web — Phase 4, and current root Next.js app):
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "react-jsx",
    "target": "ES2017"
  }
}
```

Consumer package usage:
```json
// packages/api-schemas/tsconfig.json
{
  "extends": "@kubeasy/typescript-config/base.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src/**/*.ts"]
}
```

### Pattern 6: docker-compose.yml services

**What:** Three services with named volumes, health checks, and standard ports.

**Example:**
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: kubeasy
      POSTGRES_USER: kubeasy
      POSTGRES_PASSWORD: kubeasy
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kubeasy"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory-policy noeviction
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.123.0
    command: ["--config=/etc/otel-collector-config.yaml"]
    volumes:
      - ./docker/otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4317:4317"    # gRPC OTLP
      - "4318:4318"    # HTTP OTLP
      - "55679:55679"  # zpages debug UI

volumes:
  postgres_data:
  redis_data:
```

**OTel Collector config (debug-only for Phase 1):**
```yaml
# docker/otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:

exporters:
  debug:
    verbosity: detailed

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [debug]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [debug]
    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [debug]

  extensions:
    zpages:
      endpoint: 0.0.0.0:55679
```

Note: `zpages` extension requires adding it to the `extensions` key. The `otel/opentelemetry-collector-contrib` image includes zpages; the base `otel/opentelemetry-collector` image does not.

### Anti-Patterns to Avoid

- **Importing `@/*` Next.js path aliases in package source**: `@kubeasy/api-schemas` must not import from `@/server/db/schema` or any Next.js path. The schemas must define their own enum values (e.g., `z.enum(["easy", "medium", "hard"])` directly) rather than importing from the DB schema file.
- **Adding `main` field without `exports` in package.json**: Modern Node.js and bundlers use `exports`. The `main` field is ignored when `exports` is present. Use `exports` only.
- **Putting build outputs in JIT package cache**: JIT packages have no `outputs` in turbo.json since they have no build step. Adding them to a `build` pipeline task causes `turbo` to try to cache non-existent artifacts.
- **Shared biome.json with absolute paths**: The `extends` field in workspace package biome.json must use relative paths (`../../biome.json`), not `@kubeasy/` package references — Biome does not resolve workspace packages.
- **Using `strict` envMode in Phase 1**: `strict` mode requires declaring ALL env vars the task reads. This is too strict during initial scaffold when env var usage is evolving. Use `loose` and switch to `strict` in Phase 7.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Queue retry/backoff logic | Custom retry wrapper | BullMQ `defaultJobOptions` | BullMQ handles exponential backoff, failure tracking, dead-letter internally |
| Task dependency ordering | Custom build scripts | Turborepo `dependsOn: ["^build"]` | Turborepo builds the correct DAG automatically |
| Workspace package resolution | Custom path aliases | pnpm workspace protocol (`workspace:*`) | `workspace:*` resolves to local package; no manual path config needed |
| Redis connection pooling | Custom pool | ioredis built-in pooling | ioredis manages connections per Queue instance |

---

## Common Pitfalls

### Pitfall 1: api-schemas imports from @/ aliases

**What goes wrong:** Developer copies Zod schemas from existing `schemas/cli-api.ts` including `import { challengeDifficultyEnum } from "@/server/db/schema/challenge"`. This `@/` alias only resolves inside the root Next.js app. The package fails to typecheck and will error when imported from future `apps/api`.

**Why it happens:** The existing `schemas/cli-api.ts` was written inside the Next.js app and uses Next.js path resolution.

**How to avoid:** Write schema enums inline in `@kubeasy/api-schemas`. Duplicate the `z.enum(["easy", "medium", "hard"])` literal. The package must be fully self-contained.

**Warning signs:** Any import path starting with `@/` in packages/ source files.

### Pitfall 2: Root package.json name conflict

**What goes wrong:** Root `package.json` still has `"name": "kubeasy"` — not `"name": "kubeasy-monorepo"` (private). Turborepo may pick up the root as a regular app and try to run its `build` task in the pipeline, causing Next.js to build unexpectedly.

**Why it happens:** Overlooked rename of root package.json when setting up monorepo.

**How to avoid:** Rename root package to `"name": "kubeasy-monorepo"` and set `"private": true`. Also update root `scripts` to use `turbo run ...` wrappers where appropriate.

**Warning signs:** `turbo run build` triggers Next.js build instead of just building packages.

### Pitfall 3: pnpm workspace protocol not used for internal deps

**What goes wrong:** Developer adds `"@kubeasy/api-schemas": "0.0.0"` instead of `"@kubeasy/api-schemas": "workspace:*"` in root `package.json`. pnpm resolves from npm registry (fails) instead of local workspace.

**Why it happens:** Forgetting to use the workspace protocol.

**How to avoid:** Always use `workspace:*` for internal packages. Run `pnpm add @kubeasy/api-schemas --workspace-root` — pnpm auto-adds `workspace:*`.

**Warning signs:** `pnpm install` fails with "package not found" for `@kubeasy/*` packages.

### Pitfall 4: Missing zpages extension declaration in OTel config

**What goes wrong:** `zpages` extension is listed under `extensions:` in the collector config but not referenced in the `service.extensions` array. Collector starts but zpages UI is unavailable on port 55679.

**Why it happens:** OTel Collector config requires both defining an extension AND referencing it in `service.extensions`.

**How to avoid:** Add `zpages` to both the `extensions:` block and the `service: extensions: [zpages]` list.

**Warning signs:** Port 55679 refuses connection; collector logs show zpages not started.

### Pitfall 5: JIT package tsconfig paths not resolving in consuming app

**What goes wrong:** The root Next.js app's `tsconfig.json` has `"paths": { "@/*": ["./*"] }`. When it imports `@kubeasy/api-schemas`, TypeScript must resolve through the `exports` field. If the package's `tsconfig.json` uses a `paths` override, TypeScript in the consumer may not pick it up.

**Why it happens:** JIT packages must be fully resolved by the consumer's TypeScript configuration, not their own paths.

**How to avoid:** JIT packages should NOT use `paths` in their tsconfig. Use direct relative imports within the package source. The consuming app's resolver handles everything.

**Warning signs:** `pnpm typecheck` passes in the package but fails in the root app with "cannot find module".

---

## Code Examples

Verified patterns from official sources and project codebase:

### Consuming @kubeasy/api-schemas from root Next.js app

After Phase 1 is complete, the root app can:

```typescript
// In root Next.js app (server/api/routers/challenge.ts or similar)
import { ChallengeListInputSchema } from '@kubeasy/api-schemas/challenges';
```

This requires:
1. `packages/api-schemas/package.json` has `"exports": { "./challenges": "./src/challenges.ts" }`
2. Root `package.json` has `"@kubeasy/api-schemas": "workspace:*"` in dependencies
3. `pnpm-workspace.yaml` includes `packages/*`

### Zod schema style (match existing project conventions)

Existing project uses Zod 4 with `.meta()` for OpenAPI docs. The `@kubeasy/api-schemas` package should use the same style but WITHOUT `.meta()` since that requires `zod-openapi` which is a Next.js-app-level concern.

```typescript
// packages/api-schemas/src/challenges.ts
import { z } from 'zod';

export const ChallengeDifficultySchema = z.enum(['easy', 'medium', 'hard']);
export type ChallengeDifficulty = z.infer<typeof ChallengeDifficultySchema>;

export const ChallengeListInputSchema = z.object({
  difficulty: ChallengeDifficultySchema.optional(),
  type: z.string().optional(),
  theme: z.string().optional(),
  showCompleted: z.boolean().default(true).optional(),
  search: z.string().optional(),
});

export const ChallengeListItemSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  theme: z.string(),
  themeSlug: z.string(),
  difficulty: ChallengeDifficultySchema,
  type: z.string(),
  typeSlug: z.string(),
  estimatedTime: z.number().int(),
  initialSituation: z.string(),
  ofTheWeek: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedCount: z.number().int(),
  userStatus: z.string().nullable(),
});
```

### Complete tRPC procedure shape inventory (for PKG-02 coverage)

Extracted from reading the actual routers:

**challenges domain** (`server/api/routers/challenge.ts`):
- `list` input: `challengeFiltersSchema` (difficulty, type, theme, showCompleted, search)
- `getBySlug` input: `{ slug: string }`
- `getObjectives` input: `{ slug: string }`
- `create` input: slug, title, description, theme, difficulty, estimatedTime, initialSituation, ofTheWeek
- `setAvailability` input: `{ slug: string, available: boolean }`

**themes domain** (`server/api/routers/theme.ts`):
- `list` — no input
- `get` input: `{ slug: string }`

**progress domain** (`server/api/routers/userProgress.ts`):
- `getCompletionPercentage` input: `{ splitByTheme?: boolean, themeSlug?: string }`
- `getXpAndRank` — no input
- `getStreak` — no input
- `completeChallenge` input: `{ challengeId: number }`
- `getStatus` input: `{ slug: string }`
- `startChallenge` input: `{ challengeSlug: string }`
- `submitChallenge` input: `{ challengeSlug: string, results: ObjectiveResult[] }`
- `resetChallenge` input: `{ challengeSlug: string }`
- `getSubmissions` input: `{ slug: string }`
- `getLatestValidationStatus` input: `{ slug: string }`

**xp domain** (`server/api/routers/xpTransaction.ts`):
- `getRecentGains` — no input

**submissions domain** (covered within progress above):
- `ObjectiveResult`: `{ objectiveKey: string, passed: boolean, message?: string }`
- `Objective` (enriched): `{ id, name, description?, passed, category, message }`

**auth domain** — Better Auth handles its own endpoints; `@kubeasy/api-schemas/auth` should export user/session shapes that mirror the Better Auth user model.

---

## Existing Assets to Reuse

The project already has Zod schema files that partially cover `@kubeasy/api-schemas` needs:

| Existing file | Reusable content | Note |
|---------------|-----------------|------|
| `schemas/cli-api.ts` | `objectiveResultSchema`, `objectiveSchema`, `challengeSubmitRequestSchema`, `challengeStatusResponseSchema`, `challengeStartResponseSchema`, challenge/theme/type schemas | Copy shapes, remove `zod-openapi` `.meta()` calls and `@/` imports |
| `schemas/challengeFilters.ts` | `challengeFiltersSchema` | Copy directly, re-declare enum values inline |
| `schemas/challengeObjectives.ts` | `ObjectiveTypeSchema` (the enum values) | Copy `z.enum(["status", "condition", "log", "event", "connectivity"])` |

**Do NOT import these files from the package.** Copy and adapt the shapes. The original files import from `@/server/db/schema` which uses Next.js path resolution.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single `packages:` list in pnpm-workspace.yaml | Same format, root auto-included | pnpm v7+ | No need to add `"."` explicitly |
| Turborepo v1 `pipeline` key | Turborepo v2 `tasks` key | Turbo 2.0 (2024) | `turbo.json` must use `tasks` not `pipeline` |
| `envMode` not configurable | `envMode: "loose"` or `"strict"` in turbo.json | Turbo 2.0 | `envMode` is now a top-level key |
| BullMQ connection via string URL | BullMQ connection via ioredis instance | BullMQ v5+ | Pass ioredis instance, not connection config |

**Deprecated/outdated:**
- `pipeline` key in turbo.json: replaced by `tasks` in Turborepo 2.0 — using `pipeline` will cause a validation error
- `otel/opentelemetry-collector` (base image): does not include zpages or many contrib receivers — use `otel/opentelemetry-collector-contrib` for local dev

---

## Open Questions

1. **Node.js version pin**
   - What we know: project uses TypeScript 5.9.3, Next.js 16.1.6, pnpm 10.32.1
   - What's unclear: no `.nvmrc` or `engines` field currently exists
   - Recommendation: add `"engines": { "node": ">=22" }` to root package.json and `packages/*` package.json files; add `.nvmrc` with `22` (Node.js 22 LTS)

2. **Root dev script orchestration**
   - What we know: user deferred this to Claude's discretion
   - What's unclear: whether a single `pnpm dev` at root should start docker-compose + Next.js together
   - Recommendation: add a root `dev:infra` script as `docker compose up -d` and keep `dev` as `turbo run dev` — developers run `pnpm dev:infra` once, then `pnpm dev`. This avoids coupling the Docker lifecycle to every dev restart.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` (exists at root) |
| Quick run command | `pnpm test:run` |
| Full suite command | `pnpm test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | `turbo run build` from root builds packages | smoke | `turbo run build --dry-run` | ❌ Wave 0 |
| INFRA-02 | typescript-config provides three configs | unit | `pnpm --filter @kubeasy/typescript-config typecheck` | ❌ Wave 0 |
| INFRA-03 | Packages typecheck before apps | smoke | `pnpm typecheck` (root, verifies order) | ❌ Wave 0 |
| INFRA-04 | docker-compose services reachable | manual | `docker compose up -d && nc -z localhost 5432` | ❌ Wave 0 |
| PKG-01 | api-schemas exports Zod schemas | unit | `pnpm --filter @kubeasy/api-schemas typecheck` | ❌ Wave 0 |
| PKG-02 | 100% tRPC procedure coverage | unit | `pnpm --filter @kubeasy/api-schemas test:run` | ❌ Wave 0 |
| PKG-03 | jobs exports queue names, payloads, factory | unit | `pnpm --filter @kubeasy/jobs typecheck` | ❌ Wave 0 |
| PKG-04 | jobs has no apps/ imports | static | `grep -r "apps/" packages/jobs/src` (should return empty) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm typecheck` (root — catches JIT package type errors in consumers)
- **Per wave merge:** `pnpm test:run` (full vitest suite) + `turbo run typecheck`
- **Phase gate:** All typechecks green + docker compose services responding + `turbo build --dry-run --summarize` shows declared env vars

### Wave 0 Gaps
- [ ] `packages/api-schemas/__tests__/schemas.test.ts` — validates Zod schemas parse/reject correctly for each domain (REQ PKG-01, PKG-02)
- [ ] `packages/jobs/__tests__/factory.test.ts` — validates createQueue returns typed Queue instance, queue name constants exported correctly (REQ PKG-03, PKG-04)
- [ ] Vitest config in each package OR extend root vitest.config.ts to include `packages/*` — currently root vitest only scans `**/__tests__/**/*.test.ts`, which will pick up package tests if placed under `packages/*/src/__tests__/`

---

## Sources

### Primary (HIGH confidence)
- [Turborepo Internal Packages docs](https://turborepo.dev/docs/core-concepts/internal-packages) — JIT package structure, exports field format
- [Turborepo configuration reference](https://turborepo.dev/docs/reference/configuration) — envMode, globalEnv, tasks/dependsOn
- [pnpm workspace docs](https://pnpm.io/pnpm-workspace_yaml) — root auto-inclusion, packages glob
- Project source files: `server/api/routers/*.ts`, `schemas/*.ts`, `biome.json`, `tsconfig.json`, `pnpm-workspace.yaml`, `package.json` — all read directly

### Secondary (MEDIUM confidence)
- [Turborepo structuring a repository](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository) — verified: pnpm-workspace.yaml minimum fields
- [BullMQ quick start](https://docs.bullmq.io/readme-1) — Queue instantiation, ioredis connection pattern
- npm registry (live query 2026-03-18): turbo@2.8.17, bullmq@5.71.0, ioredis@5.10.0

### Tertiary (LOW confidence)
- WebSearch results on OTel Collector docker-compose examples — verified against [official OTel Collector docs](https://opentelemetry.io/docs/collector/configuration/) for config structure; exact image version `0.123.0` is current as of search but should be re-verified at implementation time

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified against npm registry, Turborepo docs confirm JIT approach
- Architecture: HIGH — directly derived from reading existing project files + official Turborepo docs
- Pitfalls: HIGH — pitfalls 1-3 derived from actual project code analysis; pitfalls 4-5 from official docs
- Zod schema inventory: HIGH — extracted by reading all router files directly

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (30 days — Turborepo and BullMQ are stable; OTel Collector image version should be re-checked)
