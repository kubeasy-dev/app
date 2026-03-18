---
phase: 04-web-migration
verified: 2026-03-18T00:00:00Z
status: gaps_found
score: 5/7 requirements verified
gaps:
  - truth: "SSE client consumes validation events via EventSource and calls queryClient.invalidateQueries"
    status: failed
    reason: "No EventSource, SSE subscription, or queryClient.invalidateQueries found anywhere in apps/web/src/"
    artifacts:
      - path: "apps/web/src/ (entire tree)"
        issue: "No SSE implementation exists — WEB-06 marked [x] in REQUIREMENTS.md but code is absent"
    missing:
      - "SSE hook or utility that opens EventSource to /api/sse/validation/:slug"
      - "queryClient.invalidateQueries call triggered on SSE event receipt"
      - "Integration in challenge detail or ChallengeMission component"
  - truth: "SSG pages are pre-rendered at build time (landing, blog, about pages produce HTML files in .output/public/)"
    status: partial
    reason: "Prerender config exists in vite.config.ts and blog/landing routes are structured for SSG, but WEB-04 is marked incomplete in REQUIREMENTS.md and build-time output cannot be verified without running vinxi build"
    artifacts:
      - path: "apps/web/vite.config.ts"
        issue: "prerender config present but untested at build time"
      - path: "apps/web/src/routes/blog/index.tsx"
        issue: "Loader calls getBlogPosts() — SSG only works if Notion env vars are available at build time"
    missing:
      - "Evidence of a successful build producing .output/public/ HTML files"
      - "Verification that NOTION_DATABASE_ID and NOTION_API_KEY are available in the build environment"
human_verification:
  - test: "Run pnpm --filter=@kubeasy/web build and inspect .output/public/"
    expected: "HTML files for /, /blog, /blog/<slug> exist in .output/public/"
    why_human: "Cannot run vinxi build in verification — requires Notion API env vars and full build execution"
  - test: "Verify challenge detail page shows live validation status after submitting via CLI"
    expected: "Validation status updates without manual page refresh (if SSE were implemented)"
    why_human: "SSE is absent — this test would currently fail"
---

# Phase 4: Web Migration Verification Report

**Phase Goal:** The TanStack Start web app replaces Next.js for all existing pages — landing, blog, challenges, dashboard — with correct SSG/SSR rendering modes and TanStack Query replacing all tRPC hooks

**Verified:** 2026-03-18
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | apps/web is a TanStack Start app with file-based routing | VERIFIED | `apps/web/package.json` has `@tanstack/react-start`, `vite.config.ts` uses `tanstackStart()` plugin |
| 2 | All tRPC hooks replaced by typed fetch wrappers | VERIFIED | `api-client.ts` imports from `@kubeasy/api-schemas`, zero `@trpc` imports in `apps/web/src/` |
| 3 | Route loaders prefetch data server-side via ensureQueryData | VERIFIED | `challenges/index.tsx`, `challenges/$slug.tsx`, `dashboard.tsx`, `themes/index.tsx` all use `queryClient.ensureQueryData()` in loader |
| 4 | Landing/blog pages pre-rendered as SSG at build time | PARTIAL | Prerender config in `vite.config.ts` present; blog loaders call Notion API; WEB-04 marked incomplete in REQUIREMENTS.md; build output unverifiable without running `vinxi build` |
| 5 | Challenge detail uses hybrid rendering (SSR base + client-only validation) | VERIFIED | `$slug.tsx` loader prefetches `challengeDetailOptions` + `challengeObjectivesOptions`; `ChallengeMission` uses `useQuery` with `enabled: isAuthenticated` for validation |
| 6 | SSE client consumes validation events, calls invalidateQueries | FAILED | No `EventSource`, SSE subscription, or `queryClient.invalidateQueries` exists anywhere in `apps/web/src/` |
| 7 | All fetch calls include `credentials: "include"` | VERIFIED | `apiFetch()` in `api-client.ts` always sets `credentials: "include"`; `auth-client.ts` sets `credentials: 'include'` in fetchOptions |

**Score:** 5/7 truths verified (1 failed, 1 partial)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/web/package.json` | TanStack Start app with all dependencies | VERIFIED | Contains `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/react-query`, `@kubeasy/api-schemas: workspace:*` |
| `apps/web/vite.config.ts` | Vite config with TanStack Start plugin and prerender | VERIFIED | `tanstackStart()` plugin with `prerender: { enabled: true, crawlLinks: true }` |
| `apps/web/src/lib/router.ts` | Router factory with QueryClient context | VERIFIED | `getRouter()` wires `queryClient` into router context; note: `setupRouterSsrQueryIntegration` intentionally absent (does not exist in react-query@5.91.0) |
| `apps/web/src/lib/auth-client.ts` | Better Auth client with cross-domain credentials | VERIFIED | `createAuthClient` with `baseURL: VITE_API_URL` and `credentials: 'include'` |
| `apps/web/src/lib/auth.functions.ts` | Server function for session with cookie forwarding | VERIFIED | `createServerFn` + `getRequestHeaders()` + cookie forwarding to `authClient.getSession()` |
| `apps/web/src/routes/_protected.tsx` | Auth guard pathless layout | VERIFIED | `beforeLoad` calls `getSessionFn()`, throws `redirect('/login')` if no session |
| `apps/web/src/lib/api-client.ts` | Typed fetch wrappers for all Hono endpoints | VERIFIED | All methods use `apiFetch()` with `credentials: "include"`; typed via `@kubeasy/api-schemas` |
| `apps/web/src/lib/query-options.ts` | TanStack Query option factories | VERIFIED | 16 exported factory functions using `queryOptions({ queryKey, queryFn })` |
| `apps/web/src/__tests__/api-client.test.ts` | Unit tests for api-client | VERIFIED | Test file exists with tests for credentials, URL construction, error handling |
| `apps/web/vitest.config.ts` | Vitest config | VERIFIED | `defineConfig` with `root: 'src'`, node environment |
| `apps/web/src/lib/notion.ts` | Notion API client for blog SSG | VERIFIED | `getBlogPosts()` and `getBlogPostWithContent()` exported; uses `process.env.NOTION_*` |
| `apps/web/src/routes/index.tsx` | Landing page (SSG) | VERIFIED | `createFileRoute('/')` with all section components rendered |
| `apps/web/src/routes/blog/index.tsx` | Blog listing (SSG) | VERIFIED | Loader calls `getBlogPosts()`, renders `<Link to="/blog/$slug">` for each post |
| `apps/web/src/routes/blog/$slug.tsx` | Blog article (SSG via crawlLinks) | VERIFIED | Loader calls `getBlogPostWithContent(params.slug)`, renders Notion blocks |
| `apps/web/src/routes/login.tsx` | Login page with social providers | VERIFIED | `validateSearch` for `?redirect=`, `LoginCard` with GitHub/Google/Microsoft via `signInWithSocialProvider` |
| `apps/web/src/routes/challenges/index.tsx` | Challenges listing with SSR prefetch | VERIFIED | Loader uses `ensureQueryData(challengeListOptions())`, component uses `useSuspenseQuery` |
| `apps/web/src/routes/challenges/$slug.tsx` | Challenge detail with hybrid rendering | VERIFIED | Loader prefetches base data; `ChallengeMission` uses client-only `useQuery` |
| `apps/web/src/routes/_protected/dashboard.tsx` | Dashboard with SSR prefetch | VERIFIED | Loader prefetches completion, XP, streak, transactions; component uses `useSuspenseQuery` |
| `apps/web/src/routes/_protected/profile.tsx` | Profile page | VERIFIED | Auth-gated via `_protected` layout, prefetches `userXpOptions()` |
| `apps/web/src/routes/_protected/(admin)/index.tsx` | Admin index with role guard | VERIFIED | `beforeLoad` checks `user.role === 'admin'`, redirects to `/` otherwise |
| `apps/web/src/routes/_protected/(admin)/challenges.tsx` | Admin challenges list | VERIFIED | Role guard + `adminChallengesOptions()` prefetch |
| `apps/web/src/routes/_protected/(admin)/users.tsx` | Admin users page | STUB (intentional) | Renders "User management coming soon." — no data fetching. Placeholder for future work. |
| `apps/web/src/routes/onboarding.tsx` | Onboarding page | VERIFIED | `beforeLoad` checks session, redirects unauthenticated users to `/login` |
| `apps/web/src/routes/get-started.tsx` | Get-started page | VERIFIED | Static informational page with CLI installation steps |
| `apps/web/src/routes/auth/callback.tsx` | Auth callback handler | VERIFIED | `beforeLoad` redirects authenticated users to `/dashboard`, unauthenticated to `/login` |
| `apps/web/src/routeTree.gen.ts` | Route tree with all routes registered | VERIFIED | All 20 route files registered: `_protected`, blog, challenges, themes, types, dashboard, profile, admin x3, onboarding, get-started, auth/callback |
| SSE client (no file path) | EventSource consuming validation events | MISSING | No implementation exists anywhere in `apps/web/src/` |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `__root.tsx` | `lib/router.ts` | Router context provides queryClient | WIRED | `createRootRouteWithContext<RouterContext>()` + `Route.useRouteContext()` accesses `queryClient` |
| `_protected.tsx` | `lib/auth.functions.ts` | `beforeLoad` calls `getSessionFn` | WIRED | `import { getSessionFn }` + `await getSessionFn()` in `beforeLoad` |
| `auth-client.ts` | `apps/api` (external) | fetch with `credentials: 'include'` | WIRED | `baseURL: import.meta.env.VITE_API_URL` + `credentials: 'include'` in `fetchOptions` |
| `api-client.ts` | `@kubeasy/api-schemas` | z.infer type imports | WIRED | Imports `ChallengeListOutput`, `ChallengeGetBySlugOutput`, etc. from `@kubeasy/api-schemas/challenges` etc. |
| `query-options.ts` | `api-client.ts` | `queryFn` calls `api.*` | WIRED | All `queryFn` implementations call `api.challenges.*`, `api.progress.*`, etc. |
| `challenges/index.tsx` | `query-options.ts` | loader uses `challengeListOptions` | WIRED | `queryClient.ensureQueryData(challengeListOptions())` in loader |
| `challenges/$slug.tsx` | `query-options.ts` | loader uses `challengeDetailOptions` | WIRED | `ensureQueryData(challengeDetailOptions(params.slug))` in loader |
| `_protected/dashboard.tsx` | `query-options.ts` | loader uses `completionOptions` | WIRED | `ensureQueryData(completionOptions(...))` + `userXpOptions()` + `userStreakOptions()` in loader |
| `blog/index.tsx` | `lib/notion.ts` | loader calls `getBlogPosts()` | WIRED | `import { getBlogPosts }` + `await getBlogPosts()` in loader |
| `blog/$slug.tsx` | `lib/notion.ts` | loader calls `getBlogPostWithContent()` | WIRED | `import { getBlogPostWithContent }` + `await getBlogPostWithContent(params.slug)` in loader |
| `login.tsx` | `auth-client.ts` | `signInWithSocialProvider` | WIRED | `LoginCard` calls `signInWithSocialProvider(provider, callbackUrl)` |
| SSE client | `apps/api` SSE endpoint | `EventSource` + `invalidateQueries` | NOT_WIRED | No SSE implementation exists |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| WEB-01 | 04-01 | apps/web migrated to TanStack Start with TanStack Router | SATISFIED | `@tanstack/react-start` in package.json; `vite.config.ts` uses `tanstackStart()`; all pages on file-based routes |
| WEB-02 | 04-02 | tRPC hooks replaced by typed fetch wrappers | SATISFIED | `api-client.ts` typed with `z.infer<>` from `@kubeasy/api-schemas`; zero `@trpc` imports; `useQuery`/`useSuspenseQuery` orchestrate data |
| WEB-03 | 04-04 | Route loaders prefetch data server-side | SATISFIED | `ensureQueryData()` in loaders for challenges, dashboard, themes, types, profile; `useSuspenseQuery()` in components reads from hydrated cache |
| WEB-04 | 04-03 | Landing/blog SSG at build time | INCOMPLETE | `prerender: { enabled: true, crawlLinks: true }` in vite.config.ts; blog routes have Notion loaders; REQUIREMENTS.md marks WEB-04 as `[ ]` (unchecked); build-time output not verified |
| WEB-05 | 04-04 | Challenges use hybrid rendering | SATISFIED | `$slug.tsx` loader prefetches challenge/objectives for SSR; `ChallengeMission` uses `useQuery` with `enabled: isAuthenticated` for client-only validation status |
| WEB-06 | 04-04 | SSE client with EventSource + invalidateQueries | BLOCKED | No EventSource, SSE subscription, or `invalidateQueries` exists in `apps/web/src/`; marked [x] in REQUIREMENTS.md but implementation is absent |
| WEB-07 | 04-01, 04-02 | All fetch calls include `credentials: "include"` | SATISFIED | `apiFetch()` always sets `credentials: "include"`; `auth-client.ts` fetchOptions include same |

**Orphaned requirements check:** REQUIREMENTS.md Phase 4 row assigns WEB-01 through WEB-07. All 7 are claimed by the 4 plans. No orphaned requirements found.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `routes/_protected/(admin)/users.tsx` | ~21 | "User management coming soon." with no data | Info | Admin users page is a visual stub — intentional per plan scope, does not block phase goal |
| `routes/challenges/index.tsx` | loader | `ensureQueryData(challengeListOptions())` called without search params | Warning | Loader prefetches unfiltered list, ignoring active filters; component `useSuspenseQuery(challengeListOptions(search))` may re-fetch on client for filtered views |

---

## Human Verification Required

### 1. SSG Build Output

**Test:** Run `pnpm --filter=@kubeasy/web build` (requires `NOTION_DATABASE_ID` and `NOTION_API_KEY` env vars set)
**Expected:** `.output/public/index.html`, `.output/public/blog/index.html`, and `.output/public/blog/<slug>.html` files exist
**Why human:** Cannot run vinxi build in verification context; requires live Notion credentials and full build execution

### 2. Validation Status Live Update (SSE Gap)

**Test:** Start a challenge, submit via `kubeasy challenge submit <slug>`, observe the challenge detail page
**Expected:** Validation status on challenge detail page updates in real-time without page refresh
**Why human:** SSE implementation (WEB-06) is absent — this will not work. Confirms the gap is user-visible.

---

## Gaps Summary

Two items prevent full goal achievement:

**Gap 1 — WEB-06 SSE Client (FAILED):** The REQUIREMENTS.md marks WEB-06 as satisfied (`[x]`) and the plans claimed it in their scope (`04-04` requirements list includes WEB-06), but there is no EventSource, SSE subscription, or `queryClient.invalidateQueries` call anywhere in `apps/web/src/`. This is a complete non-implementation, not a partial one. The challenge detail page currently has no real-time update capability — users must manually refresh to see validation status changes.

**Gap 2 — WEB-04 SSG Build Verification (PARTIAL):** The infrastructure for SSG is present (prerender config, Notion loaders, crawlLinks). However REQUIREMENTS.md explicitly marks WEB-04 as `[ ]` (not checked off). This is either a documentation gap or the SSG build has not been successfully tested with the Notion API. The plan scope for WEB-04 was Plan 03, and the SUMMARY for Plan 03 does not mention a successful build run.

**Root cause note:** WEB-06 and WEB-04 share a pattern — the prerequisite infrastructure on the API side (SSE endpoint REAL-01, REAL-02, REAL-03) is also marked incomplete in REQUIREMENTS.md. WEB-06 cannot be fully implemented until REAL-01 through REAL-03 are complete. This is a dependency gap that the phase planning may not have accounted for.

---

_Verified: 2026-03-18_
_Verifier: Claude (gsd-verifier)_
