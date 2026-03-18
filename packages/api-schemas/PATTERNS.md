# API Schemas — Patterns

## Zod-first: Zod is the source of truth

Zod schemas define the data model. The DB, API routes, and components all derive from them — never the reverse.

```
packages/api-schemas (Zod definitions)
  ↓ imported by
server/db/schema + apps/api/src/db/schema (pgEnum derives values)
  ↓ used by
tRPC routers, Hono routes, React components
```

**Why:** one place to change a value, everything stays in sync. TypeScript catches mismatches at compile time.

---

## Defining an enum

1. Export a `const` values array and the Zod schema together:

```ts
// packages/api-schemas/src/challenges.ts
export const challengeDifficultyValues = ["easy", "medium", "hard"] as const;
export const ChallengeDifficultySchema = z.enum(challengeDifficultyValues);
export type ChallengeDifficulty = z.infer<typeof ChallengeDifficultySchema>;
```

2. Use `asDrizzleEnum()` in the DB schema to create the pgEnum:

```ts
// server/db/schema/challenge.ts (or apps/api/src/db/schema/challenge.ts)
import { challengeDifficultyValues } from "@kubeasy/api-schemas/challenges";
import { asDrizzleEnum } from "@kubeasy/api-schemas/drizzle";

export const challengeDifficultyEnum = pgEnum(
  "challenge_difficulty",
  asDrizzleEnum(challengeDifficultyValues),
);
```

**Why `asDrizzleEnum`:** Drizzle's `pgEnum` requires a mutable tuple. `as const` arrays are `readonly`. A naive `as [string, ...string[]]` cast widens the type to `string`, breaking column inference. `asDrizzleEnum` converts `readonly ["easy", "medium", "hard"]` to `["easy" | "medium" | "hard", ...]` so Drizzle infers the correct literal union on the column.

3. Consume the Zod schema directly everywhere else — never re-derive from the pgEnum:

```ts
// ✅ Route validation
zValidator("query", z.object({ difficulty: ChallengeDifficultySchema.optional() }))

// ✅ Type annotation
const d: ChallengeDifficulty = "easy";

// ❌ Don't do this — DB is not the source
z.enum(challengeDifficultyEnum.enumValues)
```

---

## Auto-generated schemas (CLI)

`packages/api-schemas/src/objectives.ts` is generated from the CLI Go code:

```
go run hack/generate-schema/main.go > packages/api-schemas/src/objectives.ts
```

`schemas/challengeObjectives.ts` in the Next.js app re-exports from this package for backwards compatibility. **Edit the generator, not the re-export.**

The same pattern applies: `objectiveTypeValues` → `asDrizzleEnum` → pgEnum.

---

## Adding a new enum value

1. Add the value to the `values` array in `packages/api-schemas/src/`
2. Run `pnpm typecheck` — TypeScript will surface every place that needs updating (exhaustive Record, switch statements, etc.)
3. Add the DB migration: `pnpm db:generate`
