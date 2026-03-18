# Phase 4: Web Migration - Research

**Researched:** 2026-03-18
**Domain:** TanStack Start + TanStack Router + TanStack Query, Better Auth cross-domain, shadcn v4, @unpic/react, Notion SSG
**Confidence:** HIGH (verified against official docs, GitHub source, and package registry)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **shadcn v4** — use the new shadcn v4 CLI/format for the fresh install in `apps/web`. Not v3.
- Fresh install: run `shadcn init` in `apps/web`, then port only the components actually used. No wholesale copy of the old `components/` directory.
- **globals.css** — copy the existing 10.4K `globals.css` (Tailwind 4 tokens) exactly as-is into `apps/web`. Feature parity, not a redesign.
- **Images** — use `@unpic/react` as a near drop-in replacement for `next/image`. Do NOT use plain `<img>` tags.
- **Navigation** — replace `next/link` with `<Link>` from TanStack Router throughout.
- **next/navigation** hooks (`useRouter`, `usePathname`, etc.) — replace with TanStack Router equivalents (`useNavigate`, `useLocation`, etc.).
- Prerender both the blog listing page **and** all individual article pages at build time (full SSG parity with current Next.js behavior).
- If Notion API is unavailable or fails during build → **fail the build**. No partial/stale deploys.
- Notion client (`lib/notion.ts` or similar) lives inside `apps/web/lib/` — it is a web-only concern, no shared package needed.
- The existing Notion integration code (fetching, rendering) is ported directly into `apps/web`.
- Protected routes use **`beforeLoad`** on the route definition: `beforeLoad: ({ context }) => { if (!context.user) throw redirect({ to: '/login' }) }`. Declarative, no component-level guard.
- Post-login destination: **return to previous page** — not always /dashboard. The intended URL is passed as `callbackURL` to `authClient.signIn.social()` so Better Auth forwards it through the OAuth cross-domain flow.
- Better Auth client (AUTH-06): `createAuthClient({ baseURL: 'https://api.kubeasy.dev' })` with `apiKeyClient()` and `adminClient()` plugins — mirrors the existing `lib/auth-client.ts` shape but points to the Hono API.
- All fetch calls include `credentials: 'include'` (cross-domain cookie sharing with api.kubeasy.dev).
- **SSG routes**: landing (homepage), blog listing, blog article `[slug]`
- **SSR routes with loader prefetch**: challenges listing, challenge detail `[slug]`, dashboard
- **Auth-gated routes**: dashboard, profile, admin (redirect to /login if no session)
- **Additional pages to migrate**: /onboarding, /profile, /get-started, /(admin)
- WEB-06 (SSE EventSource + queryClient.invalidateQueries) is Phase 5 — NOT Phase 4

### Claude's Discretion
- TanStack Query `queryClient` setup (staleTime, gcTime defaults)
- Exact route file structure under `routes/` (file-based routing conventions)
- Error boundary and 404 page implementation
- Loading skeleton / suspense boundary design

### Deferred Ideas (OUT OF SCOPE)
- /docs migration — separate Fumadocs concern, out of scope for this milestone
- WEB-06 (SSE EventSource + queryClient.invalidateQueries) — Phase 5
- Admin API key management UI — follow-up
- ISR (Incremental Static Regeneration) for blog — v2 requirement (OPENAPI-02), full rebuild at deploy is acceptable for v1
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WEB-01 | Migrate apps/web from Next.js 15 to TanStack Start with TanStack Router | TanStack Start 1.166.16 + TanStack Router 1.167.4 scaffold patterns documented |
| WEB-02 | Replace all tRPC hooks with typed fetch wrappers using z.infer<> on @kubeasy/api-schemas, orchestrated with TanStack Query | API client pattern, queryClient integration, fetch wrapper typing documented |
| WEB-03 | Route loaders prefetch data server-side and hydrate TanStack Query on the client | setupRouterSsrQueryIntegration(), dehydrate/HydrationBoundary pattern documented |
| WEB-04 | Landing/blog pages pre-rendered as SSG at build time via prerender config | tanstackStart prerender vite config documented, requires >=1.138.0 |
| WEB-05 | Challenge pages hybrid: base data SSR via loader, validation status live client-only | Selective SSR + useQuery (client-only) vs useSuspenseQuery (SSR) pattern documented |
| WEB-06 | (Phase 5 — deferred) SSE EventSource + queryClient.invalidateQueries | Out of scope for Phase 4 |
| WEB-07 | All fetch calls include credentials: "include" for cross-domain cookie sharing | Base API client pattern with credentials include documented |
</phase_requirements>

---

## Summary

Phase 4 migrates the user-facing web app from Next.js 15 (App Router) to TanStack Start 1.x + TanStack Router (file-based routing). The stack is now stable at v1.166.16 (latest tag on npm). TanStack Query replaces all tRPC hooks — data fetching uses typed `fetch` wrappers typed against `@kubeasy/api-schemas` Zod schemas.

The biggest architectural difference from Next.js is explicit: SSG uses the `prerender` option in `vite.config.ts` (no `getStaticPaths`/`getStaticProps` equivalents), SSR data fetching uses route `loader` functions that call TanStack Query's `ensureQueryData`, and hydration happens via `setupRouterSsrQueryIntegration()`. Protected routes use `beforeLoad` with `throw redirect()` — not Next.js middleware or component guards.

The most critical pitfall is the cross-domain cookie forwarding for SSR: when a TanStack Start server function calls the `api.kubeasy.dev` auth endpoint during SSR, the browser cookies are NOT automatically forwarded. The pattern is `createServerFn` + `getRequestHeaders()` from `@tanstack/react-start/server` to explicitly forward `Cookie` headers. This is a known, documented pattern and the source of auth flicker bugs if missed.

**Primary recommendation:** Scaffold `apps/web` using `pnpm dlx create @tanstack/start` (or manual scaffold), add the `prerender` config to `vite.config.ts` from the start, wire `setupRouterSsrQueryIntegration()` in the router, and use a `_protected` pathless layout route for auth guards.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tanstack/react-start` | 1.166.16 | Full-stack framework (SSR, SSG, server functions) | Official framework, confirmed latest |
| `@tanstack/react-router` | 1.167.4 | File-based type-safe routing | Ships with react-start, unified ecosystem |
| `@tanstack/react-query` | 5.91.0 | Server state, SSR hydration | Official TanStack integration via setupRouterSsrQueryIntegration() |
| `vite` | 8.0.0 | Build tool | Required by @tanstack/react-start/plugin/vite |
| `@vitejs/plugin-react` | 6.0.1 | React JSX transform | Standard Vite React plugin |
| `@tailwindcss/vite` | 4.2.2 | Tailwind 4 Vite integration | Matches existing globals.css (Tailwind 4) |
| `better-auth` | 1.5.5 | Auth client (matches API) | Same version as apps/api — same session format |
| `@better-auth/api-key` | 1.5.5 | API key client plugin | Required by auth-client.ts shape |
| `@unpic/react` | 1.0.2 | Image optimization | Drop-in for next/image, no Next.js dependency |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@notionhq/client` | 5.12.0 | Notion API fetching | Blog SSG — port existing lib/notion.ts |
| `zod` | 4.3.6 | Schema validation | z.infer<> typed fetch wrappers |
| `@kubeasy/api-schemas` | workspace:* | API contract types | All fetch wrapper return types |
| `lucide-react` | 0.577.0 | Icons | Matches existing components |
| `class-variance-authority` | 0.7.1 | Component variants | shadcn/ui requirement |
| `clsx` + `tailwind-merge` | 2.1.1 / 3.5.0 | cn() helper | Standard shadcn pattern |
| `sonner` | 2.0.7 | Toast notifications | Matches existing usage |
| `tw-animate-css` | 1.4.0 | CSS animations | Replaces tailwindcss-animate in shadcn v4 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @tanstack/react-start | Next.js 15 | Decision locked — Next.js being removed |
| @tanstack/react-query | tRPC hooks | Decision locked — tRPC being removed |
| @unpic/react | plain `<img>` | Locked out — @unpic required per decisions |
| createServerFn for auth | loader directly | Loaders don't forward browser cookies; serverFn does |

**Installation (apps/web):**
```bash
# Scaffold
pnpm dlx create @tanstack/start@latest apps/web
# OR manual (per build-from-scratch guide):
pnpm add @tanstack/react-start @tanstack/react-router @tanstack/react-query vite @vitejs/plugin-react @tailwindcss/vite
pnpm add better-auth @better-auth/api-key @unpic/react @notionhq/client zod
pnpm add @kubeasy/api-schemas@workspace:*

# shadcn init (v4, TanStack Start template)
pnpm dlx shadcn@latest init -t start
# Then add individual components
pnpm dlx shadcn@latest add button card badge input avatar dialog dropdown-menu label navigation-menu select separator sheet sonner switch table
```

**Version verification:** All versions above confirmed against npm registry on 2026-03-18.

---

## Architecture Patterns

### Recommended Project Structure
```
apps/web/
├── src/
│   ├── routes/
│   │   ├── __root.tsx          # Root layout + QueryClientProvider + head
│   │   ├── index.tsx           # Landing page (SSG)
│   │   ├── _protected.tsx      # Pathless layout for auth-gated routes
│   │   ├── _protected/
│   │   │   ├── dashboard.tsx
│   │   │   ├── profile.tsx
│   │   │   └── (admin)/
│   │   │       └── ...
│   │   ├── blog/
│   │   │   ├── index.tsx       # Blog listing (SSG)
│   │   │   └── $slug.tsx       # Blog article (SSG)
│   │   ├── challenges/
│   │   │   ├── index.tsx       # Challenges listing (SSR)
│   │   │   └── $slug.tsx       # Challenge detail (SSR)
│   │   ├── login.tsx
│   │   ├── onboarding.tsx
│   │   └── get-started.tsx
│   ├── lib/
│   │   ├── api-client.ts       # Typed fetch wrappers
│   │   ├── auth-client.ts      # Better Auth createAuthClient
│   │   ├── auth.functions.ts   # createServerFn for getSession
│   │   ├── notion.ts           # Ported from root lib/notion.ts
│   │   ├── query-client.ts     # QueryClient factory
│   │   ├── router.ts           # getRouter() with SSR Query integration
│   │   ├── utils.ts            # cn() helper
│   │   └── constants.ts
│   ├── components/
│   │   └── ui/                 # shadcn v4 components (installed fresh)
│   ├── styles/
│   │   └── globals.css         # Copied as-is from app/globals.css
│   └── client.tsx              # Hydration entry (pnpm monorepo workaround)
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Pattern 1: vite.config.ts with prerender (SSG)
**What:** Configure TanStack Start plugin with prerender enabled for SSG routes
**When to use:** Landing page, blog listing, blog articles — pages where data exists at build time

```typescript
// Source: https://tanstack.com/start/latest/docs/framework/react/guide/static-prerendering
// apps/web/vite.config.ts
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: { port: 3000 },
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,          // auto-discover from root prerendered pages
        autoStaticPathsDiscovery: true,
        concurrency: 4,
      },
    }),
    viteReact(),
  ],
})
```

Note: `prerender` option requires `@tanstack/react-start >= 1.138.0`. Current latest is 1.166.16 — confirmed compatible.

### Pattern 2: Router setup with TanStack Query SSR integration
**What:** `getRouter()` factory wires `queryClient` into router context and calls `setupRouterSsrQueryIntegration()`
**When to use:** Once in `src/lib/router.ts` — enables server-side prefetch + client hydration

```typescript
// Source: TanStack start-basic-react-query example on GitHub
// apps/web/src/lib/router.ts
import { createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-query/tanstack-start'
import { routeTree } from '../routeTree.gen'

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,   // 1 min: avoids immediate refetch after SSR hydration
        gcTime: 5 * 60 * 1000, // 5 min: standard; never set to 0 (hydration error)
      },
    },
  })

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    scrollRestoration: true,
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
```

### Pattern 3: Root route with QueryClientProvider
**What:** `__root.tsx` uses `createRootRouteWithContext<{ queryClient: QueryClient }>()` — provides QueryClient to all child routes
**When to use:** Always — this is the root of the route tree

```typescript
// apps/web/src/routes/__root.tsx
import { createRootRouteWithContext, Outlet, ScrollRestoration } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getRouterManifest } from '@tanstack/react-start/router-manifest'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
    links: [{ rel: 'stylesheet', href: '/styles/globals.css' }],
  }),
  component: RootComponent,
})

function RootComponent() {
  const { queryClient } = Route.useRouteContext()
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <ScrollRestoration />
    </QueryClientProvider>
  )
}
```

### Pattern 4: SSR loader prefetch with TanStack Query
**What:** Route `loader` calls `queryClient.ensureQueryData()` to prefetch on server; client reads from hydrated cache
**When to use:** Challenges listing, challenge detail, dashboard — SSR routes that avoid loading spinners

```typescript
// apps/web/src/routes/challenges/$slug.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { challengeDetailOptions } from '@/lib/query-options'

export const Route = createFileRoute('/challenges/$slug')({
  loader: async ({ context: { queryClient }, params }) => {
    await queryClient.ensureQueryData(challengeDetailOptions(params.slug))
  },
  component: ChallengeDetailPage,
})

function ChallengeDetailPage() {
  const { slug } = Route.useParams()
  // useSuspenseQuery reads from hydrated cache — no loading state needed
  const { data } = useSuspenseQuery(challengeDetailOptions(slug))
  return <div>{data.challenge?.title}</div>
}
```

For client-only data (WEB-05 validation status — Phase 5):
```typescript
// useQuery (not useSuspenseQuery) — runs client-side only, shows loading state
const { data: validationStatus } = useQuery(validationStatusOptions(slug))
```

### Pattern 5: Protected route with beforeLoad (_protected layout)
**What:** Pathless layout route `_protected.tsx` guards all nested child routes with a single `beforeLoad`
**When to use:** Dashboard, profile, admin — any auth-required page

```typescript
// apps/web/src/routes/_protected.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { getSessionFn } from '@/lib/auth.functions'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    const session = await getSessionFn()
    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href }, // pass return URL
      })
    }
    return { user: session.user }
  },
  component: () => <Outlet />,
})
```

Protected pages live at `src/routes/_protected/dashboard.tsx` etc.

### Pattern 6: Cross-domain cookie forwarding in server functions
**What:** `createServerFn` + `getRequestHeaders()` forwards browser cookies to `api.kubeasy.dev`
**When to use:** Any server function that calls the Hono API with auth — session check, user data, etc.

```typescript
// apps/web/src/lib/auth.functions.ts
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { authClient } from './auth-client'

export const getSessionFn = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders()
  const session = await authClient.getSession({
    fetchOptions: {
      headers: { Cookie: headers.get('Cookie') ?? '' },
    },
  })
  return session?.data ?? null
})
```

Note: `getRequestHeaders()` must be called within a server function, NOT directly in `beforeLoad`. Issue #6334 confirmed: calling it in `beforeLoad` on the initial page load can return empty headers. The workaround is wrapping inside `createServerFn` first.

### Pattern 7: Typed API fetch wrappers
**What:** `lib/api-client.ts` with one `fetch()` per endpoint, return types from `z.infer<>`
**When to use:** All data fetching — replaces every tRPC hook in the old app

```typescript
// apps/web/src/lib/api-client.ts
import type { ChallengeListOutput, ChallengeGetBySlugOutput } from '@kubeasy/api-schemas'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    credentials: 'include',   // WEB-07: always include for cross-domain cookies
    ...init,
  })
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

export const api = {
  challenges: {
    list: (params?: URLSearchParams) =>
      apiFetch<ChallengeListOutput>(`/challenges?${params ?? ''}`),
    getBySlug: (slug: string) =>
      apiFetch<ChallengeGetBySlugOutput>(`/challenges/${slug}`),
  },
  // ... other endpoints
}
```

### Pattern 8: pnpm monorepo client.tsx workaround
**What:** Local `src/client.tsx` bypasses virtual module symlink resolution bug in pnpm
**When to use:** Always in pnpm monorepo — prevents 404 on `virtual:tanstack-start-client-entry`

```typescript
// apps/web/src/client.tsx
import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start/client'
import { getRouter } from './lib/router'

const router = getRouter()

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient router={router} />
    </StrictMode>
  )
})
```

Note: Issue #6588 was reported fixed in v1.159.6+. We're at 1.166.16 so this may not be needed, but include it as insurance — it has no downside.

### Anti-Patterns to Avoid
- **Importing `getRequestHeaders()` outside a server function:** Returns empty object on initial page load (Issue #6334). Always wrap in `createServerFn`.
- **Setting gcTime to 0:** Causes hydration errors. Never go below 2000ms; use default 5 min.
- **Using `app.config.ts` for prerender:** Old Vinxi config — use `vite.config.ts` `tanstackStart({ prerender: {...} })` instead.
- **Using `@tanstack/start` (old package name):** Stale pre-1.0 package. The correct package is `@tanstack/react-start`.
- **Using `oAuthProxy` plugin in Better Auth:** Not needed for Railway (no Vercel preview proxying). Phase 3 confirmed this was dropped.
- **Calling `auth.api.getSession()` in loaders directly without forwarding cookies:** Server-to-server calls don't include browser cookies. Always use `getRequestHeaders()` in a `createServerFn`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session cookie forwarding in SSR | Custom cookie parser | `getRequestHeaders()` from `@tanstack/react-start/server` | Handles Nitro internals correctly |
| Auth guard pattern | Component-level redirect | `beforeLoad` + `throw redirect()` | Runs before render, type-safe, composable |
| Image optimization | Custom `<img srcset>` | `@unpic/react` `<Image>` | CDN auto-detection, lazy load, LCP optimization |
| SSR Query hydration | Manual JSON serialization | `setupRouterSsrQueryIntegration()` | Handles dehydrate/stream/hydrate automatically |
| Protected route grouping | Per-route auth checks | `_protected` pathless layout | Single source of truth, all children inherit |
| API type safety | Manual interface definitions | `z.infer<typeof Schema>` from `@kubeasy/api-schemas` | Types stay in sync with API at zero cost |
| Blog route URL generation for prerender | Custom crawler | `crawlLinks: true` in prerender config | Follows `<Link>` hrefs from prerendered pages |

**Key insight:** TanStack Start ships solutions for every SSR complexity problem. Do not replicate Next.js patterns — the APIs are different by design.

---

## Common Pitfalls

### Pitfall 1: Empty cookies in SSR auth check
**What goes wrong:** `beforeLoad` calls a server function that fetches session from `api.kubeasy.dev`, but the session is always null — user appears logged out during SSR even with valid cookies.
**Why it happens:** Issue #6334: `getRequestHeaders()` returns `{}` when called directly in `beforeLoad` on initial page load. The headers are only available inside a `createServerFn` handler.
**How to avoid:** Wrap session fetch in `createServerFn` with `getRequestHeaders()`. Call that server function from `beforeLoad`, never call `getRequestHeaders()` directly in `beforeLoad`.
**Warning signs:** Auth flicker (logged out SSR, then logged in after client hydration). `console.log(getRequestHeaders())` returns `{}`.

### Pitfall 2: Blog prerender missing article pages
**What goes wrong:** Blog listing page is prerendered but individual article pages (`/blog/some-slug`) are not in the build output.
**Why it happens:** Dynamic routes aren't prerendered unless their paths are discoverable. With `crawlLinks: true`, the prerender crawler must reach article links from a prerendered page (the listing page).
**How to avoid:** Ensure the blog listing page is prerendered first (it will be via `crawlLinks`). All `<Link to="/blog/$slug">` in the listing output will be followed. Verify with `ls .output/public/blog/` after build.
**Warning signs:** Build completes but `/blog/[slug]/index.html` files are absent. Only `/blog/index.html` exists.

### Pitfall 3: tRPC imports surviving in apps/web
**What goes wrong:** WEB-02 fails — tRPC client or server imports remain in `apps/web`.
**Why it happens:** The old `trpc/` directory and `@trpc/*` packages exist in the root `package.json`. They will still resolve if imported accidentally.
**How to avoid:** `apps/web/package.json` must NOT list any `@trpc/*` dependencies. Run `grep -r "@trpc" apps/web/src` as a build check.
**Warning signs:** TypeScript errors about missing tRPC context when running `pnpm typecheck --filter=web`.

### Pitfall 4: Stale time = 0 causing double-fetch on SSR hydration
**What goes wrong:** Server prefetches data, hydrates the client, but the client immediately refetches because `staleTime: 0` (default) marks the freshly hydrated data as stale.
**Why it happens:** TanStack Query's default `staleTime` is 0ms. Hydrated data is technically "old" the moment it arrives.
**How to avoid:** Set `staleTime: 60 * 1000` (1 minute) in `QueryClient` defaults. This window covers the hydration → render cycle.
**Warning signs:** Network tab shows API calls firing immediately on page load even for pre-fetched routes.

### Pitfall 5: turbo.json build output for TanStack Start
**What goes wrong:** Turborepo `build` task outputs are misconfigured — TanStack Start outputs to `.output/` not `.next/` or `dist/`.
**Why it happens:** `turbo.json` currently lists `.next/**` and `dist/**` as `outputs`. TanStack Start + Nitro writes to `.output/`.
**How to avoid:** Update `turbo.json` to add `.output/**` to the build outputs array for `apps/web`.
**Warning signs:** `turbo build --filter=web` doesn't cache the build correctly between runs.

### Pitfall 6: Cross-subdomain cookie not sent in API client
**What goes wrong:** WEB-07 fails — fetch calls from `apps/web` to `api.kubeasy.dev` arrive without session cookies, even on the client side.
**Why it happens:** `credentials: 'same-origin'` (default fetch behavior) doesn't send cookies cross-origin. The `api-client.ts` must explicitly set `credentials: 'include'` on every request.
**How to avoid:** Centralize all API calls through `lib/api-client.ts` which sets `credentials: 'include'` at the base `apiFetch()` level. Never use raw `fetch()` for API calls in `apps/web`.
**Warning signs:** 401 responses from Hono API even when user has a valid session visible in DevTools cookies.

---

## Code Examples

Verified patterns from official sources:

### shadcn v4 init for TanStack Start
```bash
# Source: https://ui.shadcn.com/docs/installation/tanstack
pnpm dlx shadcn@latest init -t start
# For monorepo:
pnpm dlx shadcn@latest init -t start --monorepo
```

### Better Auth client for apps/web (AUTH-06)
```typescript
// Source: derived from lib/auth-client.ts + better-auth skill
// apps/web/src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react'
import { adminClient } from 'better-auth/client/plugins'
import { apiKeyClient } from '@better-auth/api-key/client'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
  fetchOptions: {
    credentials: 'include',  // cross-domain cookie
  },
  plugins: [apiKeyClient(), adminClient()],
})

// Sign in with return-to-previous-page
export async function signInWithSocialProvider(provider: string, callbackUrl: string) {
  return authClient.signIn.social({ provider, callbackURL: callbackUrl })
}
```

### getRequestHeaders() in createServerFn for session
```typescript
// Source: https://better-auth.com/docs/integrations/tanstack (PR #6824 fix)
// apps/web/src/lib/auth.functions.ts
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { authClient } from './auth-client'

export const getSessionFn = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders()
  const session = await authClient.getSession({
    fetchOptions: {
      headers: { Cookie: headers.get('Cookie') ?? '' },
    },
  })
  return session?.data ?? null
})
```

### Blog SSG with Notion (fail build on error)
```typescript
// apps/web/src/routes/blog/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { getBlogPosts } from '@/lib/notion'

export const Route = createFileRoute('/blog/')({
  loader: async () => {
    // On build failure, Notion errors are thrown — fails the build (locked decision)
    const posts = await getBlogPosts()
    return { posts }
  },
  component: BlogListingPage,
})
```

Individual blog articles at `src/routes/blog/$slug.tsx` — discovered via `crawlLinks: true` from the listing page links.

### Turbo.json update needed for TanStack Start output
```json
// turbo.json update — add .output to build outputs
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**", ".output/**"]
    }
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `app.config.ts` (Vinxi) for prerender | `vite.config.ts` `tanstackStart({ prerender })` | 1.x (Vinxi removed) | All prerender config moves to vite.config.ts |
| `@tanstack/start` (old package) | `@tanstack/react-start` | 1.0 release | Wrong package install = silent failures |
| `tailwindcss-animate` | `tw-animate-css` | shadcn v4 | Install tw-animate-css not tailwindcss-animate |
| Next.js `getStaticPaths` + `generateStaticParams` | `prerender: { crawlLinks: true }` in vite.config.ts | TanStack Start 1.138.0+ | No explicit path list needed |
| tRPC hooks | `fetch` wrappers + TanStack Query | Phase 4 decision | @kubeasy/api-schemas provides type contracts |
| `app.config.ts` server preset | `tanstackStart({ target: 'node-server' })` in vite.config.ts | 1.x | Railway node deployment config |

**Deprecated/outdated:**
- `app.config.ts`: Vinxi layer removed — do not use
- `@tanstack/start`: Old package name — causes install of 0.0.1-beta, not 1.x
- `oAuthProxy` plugin in Better Auth: Not applicable for Railway deployments

---

## Open Questions

1. **`getRequestHeaders()` in beforeLoad on initial page load (Issue #6334)**
   - What we know: Confirmed workaround is wrapping in `createServerFn`. The issue is marked OPEN as of 2026-02.
   - What's unclear: Whether v1.166.16 has silently fixed this or if it persists.
   - Recommendation: Always use `createServerFn` pattern regardless — it works in all versions.

2. **pnpm monorepo virtual entry (Issue #6588)**
   - What we know: Reported fixed at v1.159.6. Current version is 1.166.16.
   - What's unclear: Whether the fix is complete or partially regressed.
   - Recommendation: Include `src/client.tsx` workaround anyway — zero downside, provides insurance.

3. **Notion `@notionhq/client` version compatibility**
   - What we know: `lib/notion.ts` uses 5.12.0, which is the current version in root `package.json`.
   - What's unclear: Any breaking changes when running inside Vite SSG vs Next.js server component context.
   - Recommendation: Port as-is first, test during build, adjust if Vite-specific issues arise.

4. **`crossSubDomainCookies.domain: ".kubeasy.dev"` in development**
   - What we know: Phase 3 configured `crossSubDomainCookies` for production domain. In local dev, `localhost:3000` and `localhost:3001` are different origins.
   - What's unclear: Whether `credentials: 'include'` + CORS in Hono is sufficient for local dev cross-port auth.
   - Recommendation: Test locally with `fetch` from port 3000 to 3001. Hono CORS `credentials: true` + `allowedOrigins: ['http://localhost:3000']` should handle it.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (existing in repo) |
| Config file | `apps/web/vitest.config.ts` — Wave 0 gap |
| Quick run command | `pnpm --filter=web test:run` |
| Full suite command | `pnpm --filter=web test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WEB-01 | TanStack Start app boots, serves HTML at / | smoke | Build output check + manual | ❌ Wave 0 |
| WEB-02 | api-client.ts fetch wrappers return typed data | unit | `pnpm --filter=web test:run -- api-client` | ❌ Wave 0 |
| WEB-03 | Route loaders populate queryClient before render | integration | manual (inspect HTML for pre-rendered data) | ❌ Wave 0 |
| WEB-04 | Build output contains /index.html, /blog/index.html, /blog/[slug]/index.html | smoke | `ls .output/public/` check in CI | ❌ Wave 0 |
| WEB-05 | Challenges listing renders without loading spinner (data in HTML) | smoke | manual / playwright | ❌ Wave 0 |
| WEB-07 | fetch calls include credentials:include | unit | `pnpm --filter=web test:run -- api-client` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter=web typecheck`
- **Per wave merge:** `pnpm --filter=web test:run && pnpm --filter=web typecheck`
- **Phase gate:** Full suite green + manual smoke of SSG output before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/web/vitest.config.ts` — test framework config for apps/web
- [ ] `apps/web/src/__tests__/api-client.test.ts` — covers WEB-02, WEB-07
- [ ] Framework install: `pnpm add -D vitest @vitejs/plugin-react` in apps/web — if not already from scaffold

---

## Sources

### Primary (HIGH confidence)
- `@tanstack/react-start` npm registry — version 1.166.16 confirmed latest (2026-03-18)
- `@tanstack/react-router` npm registry — version 1.167.4 confirmed
- `@tanstack/react-query` npm registry — version 5.91.0 confirmed
- `vite` npm registry — version 8.0.0 confirmed
- GitHub TanStack/router `examples/react/start-basic-react-query` — vite.config.ts, router.tsx patterns
- [better-auth.com/docs/integrations/tanstack](https://better-auth.com/docs/integrations/tanstack) — TanStack integration guide, getRequestHeaders() pattern (PR #6824 fix)
- [ui.shadcn.com/docs/installation/tanstack](https://ui.shadcn.com/docs/installation/tanstack) — shadcn v4 TanStack Start install

### Secondary (MEDIUM confidence)
- [GitHub better-auth issue #6818](https://github.com/better-auth/better-auth/issues/6818) — confirmed getRequestHeaders() is correct import (issue closed/fixed)
- [GitHub TanStack router issue #6588](https://github.com/TanStack/router/issues/6588) — pnpm monorepo virtual entry issue, reported fixed at 1.159.6
- [GitHub TanStack router issue #6334](https://github.com/TanStack/router/issues/6334) — getRequestHeaders() empty in beforeLoad, still open, workaround documented
- [tanstack.com/start/latest/docs/…/static-prerendering](https://tanstack.com/start/latest/docs/framework/react/guide/static-prerendering) — prerender config (WebSearch verified)
- [dev.to/simonxabris SSR auth across subdomains](https://dev.to/simonxabris/ssr-authentication-across-subdomains-using-tanstack-start-and-better-auth-21hg) — cross-domain cookie forwarding pattern
- [TanStack Query SSR docs](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr) — staleTime/gcTime recommendations for SSR

### Tertiary (LOW confidence)
- WebSearch: Railway deployment + TanStack Start Nitro node-server — deployment details not deeply verified

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions confirmed from npm registry
- Architecture: HIGH — patterns verified against official TanStack docs and GitHub source
- Pitfalls: HIGH — Pitfalls 1, 4, 6 are documented GitHub issues or official warnings; Pitfall 2 derived from crawlLinks mechanics; Pitfalls 3, 5 are logical deductions from known behavior
- Auth cross-domain: HIGH — pattern confirmed in Better Auth docs (post PR #6824 fix)

**Research date:** 2026-03-18
**Valid until:** 2026-04-17 (30 days — TanStack Start ships daily but 1.x API is stable)
