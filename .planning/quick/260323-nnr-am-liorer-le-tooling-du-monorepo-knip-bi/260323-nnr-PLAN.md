---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - knip.json
  - biome.json
  - .env
  - apps/web/.env
  - apps/web/.env.example
  - apps/api/.env.example
  - .github/workflows/scheduled-maintenance.yml
  - vercel.json
  - .dockerignore
  - apps/web/.dockerignore
  - apps/api/.dockerignore
  - renovate.json
  - eslint.config.mjs
autonomous: true
requirements: [TOOLING-01]

must_haves:
  truths:
    - "knip runs correctly against the monorepo workspace structure"
    - "biome does not produce diffs on generated files like routeTree.gen.ts"
    - "No secrets exist in any .env files tracked or untracked at root level"
    - ".env.example files in each app document all required env vars"
    - "Maintenance workflow references monorepo structure, not Next.js"
    - "vercel.json and .dockerignore files are removed"
    - "Renovate config uses monorepo-aware presets"
  artifacts:
    - path: "knip.json"
      provides: "Monorepo-aware knip config with workspaces"
    - path: "biome.json"
      provides: "Biome config ignoring generated files"
    - path: "apps/web/.env.example"
      provides: "Web app env var documentation"
    - path: "apps/api/.env.example"
      provides: "API app env var documentation"
    - path: "renovate.json"
      provides: "Monorepo-aware Renovate config"
  key_links: []
---

<objective>
Update monorepo tooling configuration: knip, biome, .env cleanup, maintenance workflow, file deletions, and renovate monorepo support.

Purpose: Align all tooling configs with the current monorepo structure (apps/web, apps/api, packages/*) and clean up legacy single-app artifacts.
Output: Updated config files, cleaned .env, removed obsolete files.
</objective>

<execution_context>
@/Users/paul/.claude/get-shit-done/workflows/execute-plan.md
@/Users/paul/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@knip.json
@biome.json
@renovate.json
@vercel.json
@.github/workflows/scheduled-maintenance.yml
@apps/web/.env.example
@apps/api/.env.example
@apps/web/package.json
@apps/api/package.json
@package.json
@pnpm-workspace.yaml
@turbo.json
@eslint.config.mjs
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update knip and biome configs for monorepo</name>
  <files>knip.json, biome.json, eslint.config.mjs</files>
  <action>
**knip.json** — Replace current single-project config with monorepo workspaces config:

```json
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",
  "workspaces": {
    ".": {
      "entry": ["*.config.{js,ts,mjs}"],
      "project": ["*.{ts,js,mjs,cjs}"],
      "ignoreDependencies": [
        "@biomejs/biome",
        "husky",
        "lint-staged",
        "dotenv-cli"
      ]
    },
    "apps/web": {
      "entry": [
        "src/**/*.{ts,tsx}",
        "*.config.{js,ts,mjs}",
        "app.config.ts"
      ],
      "project": ["src/**/*.{ts,tsx}", "*.{ts,js,mjs,cjs}"],
      "ignore": ["src/routeTree.gen.ts"],
      "ignoreDependencies": [
        "@tailwindcss/vite",
        "tailwindcss",
        "tw-animate-css",
        "nitro",
        "pino-pretty"
      ]
    },
    "apps/api": {
      "entry": [
        "src/**/*.{ts,tsx}",
        "*.config.{js,ts,mjs}"
      ],
      "project": ["src/**/*.{ts,tsx}", "*.{ts,js,mjs,cjs}"],
      "ignoreDependencies": ["tsx"]
    },
    "packages/*": {
      "entry": ["src/index.{ts,tsx}", "index.{ts,tsx}"],
      "project": ["src/**/*.{ts,tsx}", "*.{ts,js,mjs,cjs}"]
    }
  },
  "ignore": [
    "**/*.test.{ts,tsx}",
    "**/*.spec.{ts,tsx}",
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.output/**",
    "drizzle/**"
  ]
}
```

Key changes:
- Use `workspaces` key to map monorepo structure
- Remove old single-app entries (app/**, server/**, lib/**, components/**, trpc/**)
- Ignore `routeTree.gen.ts` in apps/web (generated file)
- Remove `next` plugin config (no longer Next.js)
- Remove old ignoreDependencies that don't exist anymore (postcss, autoprefixer, prettier, eslint, eslint-config-next, @eslint/eslintrc, @tailwindcss/postcss)

**biome.json** — Add ignore for generated files and remove stale overrides:

1. Add `"!**/routeTree.gen.ts"` to `files.includes` array (to ignore the TanStack Router generated file that causes quote style diffs)
2. Remove the `linter.domains.next` entry (no longer Next.js)
3. Remove the override for `trpc/server.tsx` (old path, no longer exists at root)
4. Remove the override for `app/api/cli/**/*.ts` (old path, no longer exists at root)
5. Keep CSS override as-is (still relevant)

Updated biome.json:
```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.6/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": true,
    "includes": [
      "**",
      "!node_modules",
      "!.next",
      "!dist",
      "!build",
      "!.output",
      "!.vinxi",
      "!**/*.css",
      "!**/routeTree.gen.ts"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "warn",
        "noArrayIndexKey": "warn",
        "noUnknownAtRules": "off"
      },
      "a11y": {
        "useSemanticElements": "warn",
        "noStaticElementInteractions": "warn"
      }
    },
    "domains": {
      "react": "recommended"
    }
  },
  "assist": {
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  },
  "css": {
    "parser": {
      "cssModules": false,
      "allowWrongLineComments": true
    }
  },
  "overrides": [
    {
      "includes": ["**/*.css"],
      "css": {
        "parser": {
          "cssModules": false,
          "allowWrongLineComments": true
        }
      },
      "linter": {
        "enabled": false
      }
    }
  ]
}
```

**eslint.config.mjs** — Delete this file entirely. The project uses Biome, not ESLint. The eslint.config.mjs references `next/core-web-vitals` and `next/typescript` which no longer apply. The root package.json still has no ESLint dep — this is a leftover.
  </action>
  <verify>
    <automated>cd /Users/paul/Workspace/kubeasy/website && pnpm exec biome check --max-diagnostics=5 . 2>&1 | tail -20 && echo "---" && pnpm exec knip 2>&1 | tail -30</automated>
  </verify>
  <done>knip runs with workspace awareness across apps/* and packages/*, biome ignores routeTree.gen.ts, no stale Next.js references in linter config, eslint.config.mjs deleted</done>
</task>

<task type="auto">
  <name>Task 2: Clean .env files, delete obsolete files, update maintenance workflow</name>
  <files>.env, apps/web/.env.example, apps/api/.env.example, vercel.json, .dockerignore, apps/web/.dockerignore, apps/api/.dockerignore, .github/workflows/scheduled-maintenance.yml</files>
  <action>
**Delete the root .env file.** It contains secrets for the old single-app setup (DATABASE_URL, OAuth secrets, Notion tokens, Vercel OIDC, PostHog keys). These are NOT tracked by git but should not exist — the apps each have their own .env files now. Simply `rm .env`.

**Update apps/web/.env.example** — Currently only has RESEND_API_KEY and OTEL. Based on apps/web usage, it needs:

```env
# Resend (transactional emails)
RESEND_API_KEY=""

# PostHog analytics
NEXT_PUBLIC_POSTHOG_HOST="https://eu.i.posthog.com"
NEXT_PUBLIC_POSTHOG_KEY=""

# Notion (blog content)
NOTION_BLOG_DATASOURCE_ID=""
NOTION_DIRECTORY_DATASOURCE_ID=""
NOTION_INTEGRATION_TOKEN=""
NOTION_PEOPLE_DATASOURCE_ID=""

# API connection
API_URL="http://localhost:3001"

# OpenTelemetry — SigNoz collector (run separately, see https://signoz.io/docs/install/docker)
# git clone -b main https://github.com/SigNoz/signoz.git && cd signoz/deploy/docker && docker compose up -d
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

**Update apps/api/.env.example** — Already good, just verify it's complete. Current contents look correct for the API (DATABASE_URL, REDIS_URL, auth secrets, OAuth, OTEL). Keep as-is.

**Delete files:**
- `vercel.json` — No longer deploying to Vercel (monorepo with Hono API + TanStack Start)
- `.dockerignore` (root) — Redundant, Docker builds target specific apps via docker/
- `apps/web/.dockerignore` — Same
- `apps/api/.dockerignore` — Same

**Update .github/workflows/scheduled-maintenance.yml:**

Replace the prompt section to remove Next.js references and add monorepo awareness:

```yaml
          prompt: |
            REPO: ${{ github.repository }}

            This is a pnpm monorepo managed by Turborepo with:
            - apps/web (TanStack Start + Vite frontend)
            - apps/api (Hono API server)
            - packages/* (shared packages: api-schemas, jobs, logger, typescript-config)

            Perform weekly repository maintenance:

            1. Scan for security vulnerabilities using `pnpm audit`
            2. Run `pnpm exec knip` to detect unused files, exports, dependencies, and types
            3. Review open issues older than 90 days
            4. Check for TODO comments in recent commits
            5. Review code for performance issues:
               - Check for sequential awaits that could be parallelized (use Promise.all)
               - Check for barrel file imports that hurt bundle size (import directly from source)
               - Check for heavy components that should use dynamic imports
               - Check for unnecessary client-side state that could be server-side
            6. Verify README.md examples still work

            Note: Dependency updates are handled by Renovate, so skip outdated dependency checks.

            Create issues for any findings with detailed descriptions and steps to reproduce.
            If critical security issues are found, also comment on open PRs.
```

Key changes: removed "React/Next.js" from step 5, removed "next/dynamic" reference, removed "Suspense boundaries around async server components", added monorepo structure description at the top.
  </action>
  <verify>
    <automated>cd /Users/paul/Workspace/kubeasy/website && test ! -f vercel.json && test ! -f .dockerignore && test ! -f apps/web/.dockerignore && test ! -f apps/api/.dockerignore && test ! -f .env && test -f apps/web/.env.example && test -f apps/api/.env.example && echo "All files correctly present/absent" && cat .github/workflows/scheduled-maintenance.yml | grep -c "TanStack\|monorepo\|Hono"</automated>
  </verify>
  <done>Root .env deleted, .env.example files document all vars per app, vercel.json and all .dockerignore deleted, maintenance workflow references monorepo structure with no Next.js mentions</done>
</task>

<task type="auto">
  <name>Task 3: Update Renovate config for monorepo support</name>
  <files>renovate.json</files>
  <action>
Update renovate.json to add monorepo-aware presets and pnpm workspace detection:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:best-practices",
    ":pinAllExceptPeerDependencies",
    "schedule:daily",
    "security:minimumReleaseAgeNpm",
    "group:allNonMajor",
    "group:monorepos",
    "group:recommended",
    ":assignAndReview(pbrissaud)",
    ":automergeLinters"
  ],
  "customManagers": [
    {
      "customType": "regex",
      "managerFilePatterns": ["/biome\\.json$/"],
      "matchStrings": [
        "\"\\$schema\":\\s*\"https://biomejs\\.dev/schemas/(?<currentValue>[\\d.]+)/schema\\.json\""
      ],
      "depNameTemplate": "@biomejs/biome",
      "datasourceTemplate": "npm"
    }
  ],
  "packageRules": [
    {
      "matchPackageNames": ["@biomejs/biome"],
      "groupName": "biome"
    },
    {
      "matchFileNames": ["packages/**"],
      "groupName": "shared packages deps",
      "groupSlug": "shared-packages"
    },
    {
      "matchFileNames": ["apps/web/**"],
      "groupName": "web app deps",
      "groupSlug": "web-app"
    },
    {
      "matchFileNames": ["apps/api/**"],
      "groupName": "api app deps",
      "groupSlug": "api-app"
    }
  ]
}
```

Key changes:
- Added `group:monorepos` preset — groups updates from known monorepo packages (e.g. @tanstack/*, @opentelemetry/*, @radix-ui/*) into single PRs
- Added `group:recommended` preset — additional recommended groupings to reduce PR noise
- Added `packageRules` to group dependencies by workspace area (web, api, shared packages) so PRs are scoped by app
  </action>
  <verify>
    <automated>cd /Users/paul/Workspace/kubeasy/website && node -e "const r = JSON.parse(require('fs').readFileSync('renovate.json','utf8')); console.log('extends:', r.extends); console.log('packageRules:', r.packageRules.length, 'rules'); console.log('has monorepos:', r.extends.includes('group:monorepos'))"</automated>
  </verify>
  <done>Renovate config includes monorepo grouping presets and workspace-scoped package rules for web, api, and shared packages</done>
</task>

</tasks>

<verification>
- `pnpm exec knip` runs without config errors and correctly scans workspaces
- `pnpm exec biome check .` does not flag routeTree.gen.ts
- No vercel.json, .dockerignore files, root .env, or eslint.config.mjs exist
- .env.example files in apps/ document all required variables
- Maintenance workflow mentions monorepo, TanStack, Hono — not Next.js
- renovate.json includes group:monorepos
</verification>

<success_criteria>
All monorepo tooling configs (knip, biome, renovate) are workspace-aware. Legacy single-app artifacts (vercel.json, root .env, .dockerignore, eslint.config.mjs, Next.js references) are removed. Maintenance workflow accurately describes the current stack.
</success_criteria>

<output>
After completion, create `.planning/quick/260323-nnr-am-liorer-le-tooling-du-monorepo-knip-bi/260323-nnr-SUMMARY.md`
</output>
