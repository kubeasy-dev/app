# Testing

## Current State

**Testing is configured but largely absent from the codebase.** The test runner (Vitest) is set up with scripts in `package.json`, but no test files were found in the application source code. The project relies on TypeScript type checking and Biome linting as primary quality gates.

## Test Runner

| Tool | Purpose |
|------|---------|
| Vitest | Unit/integration test runner |
| `fast-check` | Property-based testing (installed as dep) |

## Available Commands

```bash
pnpm test           # Run Vitest in watch mode
pnpm test:run       # Run once (CI mode)
pnpm test:ui        # Run with Vitest UI
pnpm typecheck      # Full TypeScript type check (primary quality gate)
pnpm check          # Biome lint check
```

## Pre-commit Hooks (Active Quality Gates)

Husky runs these on every commit via lint-staged:

1. **Biome check** — lints and auto-formats staged JS/TS/JSON/CSS files
2. **TypeScript check** (`tsc --noEmit`) — validates types across entire project

These are the real quality gates currently in use. The commit is blocked on any error.

```json
// package.json lint-staged config
{
  "*.{js,jsx,ts,tsx,mjs,cjs}": [
    "biome check --write --unsafe --files-ignore-unknown=true --no-errors-on-unmatched"
  ],
  "*.{json,css}": [
    "biome check --write --files-ignore-unknown=true --no-errors-on-unmatched"
  ]
}
```

## Test Infrastructure Available

The following testing infrastructure exists but is not yet utilized:

- **Vitest** — configured via `package.json` scripts
- **fast-check** — property-based testing library installed
- **`@better-auth/api-key`** — has test utilities for auth scenarios

## What Should Be Tested (Not Yet Covered)

Based on business-critical code paths:

### High Priority

- `server/api/routers/userProgress.ts` — `submitChallenge` mutation
  - Validates that ALL registered objectives must be present
  - XP award logic on successful completion
  - Concurrent submission race conditions

- `server/api/routers/challenge.ts` — challenge listing/filtering logic

- CLI submission payload validation (`types/cli-api.ts` schemas)

### Medium Priority

- Challenge filter schemas (`schemas/challengeFilters.ts`)
- Objective enrichment logic (joining CLI results with DB metadata)
- Blog content fetching (Notion API integration)

## Recommended Test Patterns (When Adding Tests)

```typescript
// Unit test for tRPC router (with mock context)
import { describe, it, expect, vi } from "vitest";
import { createTRPCContext } from "@/server/api/trpc";
import { appRouter } from "@/server/api/root";

describe("userProgress.submitChallenge", () => {
  it("rejects submissions with unknown objectives", async () => {
    const ctx = await createTRPCContext();
    const caller = appRouter.createCaller(ctx);
    // ...
  });
});
```

```typescript
// Property-based test example
import { fc } from "fast-check";

it("never awards XP for failed submissions", () => {
  fc.assert(
    fc.property(fc.record({ passed: fc.constant(false) }), (result) => {
      // ...
    })
  );
});
```

## Notes

- **Do NOT run `pnpm build`** to test — it breaks the dev server (Next.js issue)
- Use `pnpm typecheck` as the primary correctness check
- The `--no-verify` bypass is strongly discouraged

---
*Generated: 2026-03-18*
