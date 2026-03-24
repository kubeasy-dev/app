# Phase 10: Micro-Frontend Dev Proxy + Admin Scaffold - Research

**Researched:** 2026-03-24
**Domain:** Turborepo MFE proxy, Vite CSR SPA, TanStack Router, Better Auth client-side auth guard
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Dev Proxy**
- D-01: Use Turborepo's built-in proxy capability (2.x feature) — `microfrontends.json` config routing `/admin/*` to `localhost:3002` and `/api/*` to `localhost:3001`
- D-02: If Turborepo cannot do this natively, propose minimal alternative — Turborepo-native is the preferred path
- D-03: Proxy port `localhost:3024`; sub-apps keep individual ports (`web: 3000`, `api: 3001`, `admin: 3002`)

**apps/admin Stack**
- D-04: Pure Vite + React CSR SPA — no SSR, no TanStack Start. Client-side only.
- D-05: TanStack Router for routing (file-based routes)
- D-06: Consume `@kubeasy/ui` from day 1 using the same JIT pattern as `apps/web` (sub-path imports, no build step)
- D-07: Neo-brutalist design tokens from `@kubeasy/ui/styles/tokens`

**Admin Auth Guard**
- D-08: Client-side auth check in `__root.tsx` using Better Auth client's `useSession()`:
  - Loading → `<LoadingSpinner />`
  - No session → redirect to `http://localhost:3000/login` (dev) / `https://kubeasy.dev/login` (prod)
  - Session but `role !== 'admin'` → redirect to `http://localhost:3000` (dev) / `https://kubeasy.dev` (prod)
  - Admin → render `<Outlet />`
- D-09: Redirect targets env-var driven via `VITE_WEB_URL`
- D-10: Existing `requireAdmin` middleware in `apps/api/src/middleware/admin.ts` unchanged

**Admin Shell Layout**
- D-11: Top navigation bar (horizontal)
- D-12: Nav items: Challenges, Users, Settings (placeholders)
- D-13: Top nav: Kubeasy logo/brand left, nav links center/right, user avatar + sign out far right

**Scaffold Route Structure**
- D-14: File-based TanStack Router routes in `apps/admin/src/routes/`:
  - `__root.tsx` — shell layout + auth guard
  - `index.tsx` — redirect to /challenges
  - `challenges/index.tsx` — placeholder
  - `users/index.tsx` — placeholder

**Caddyfile**
- D-15: Reference template only — NOT used locally
- D-16: Location to be decided by researcher (see below: `apps/caddy/Caddyfile`)

### Claude's Discretion
- Exact Turborepo proxy config syntax (resolved by research — see Standard Stack)
- Loading spinner implementation in admin
- Exact Tailwind/CSS setup for `apps/admin` (mirror `apps/web/src/styles/globals.css`)
- TypeScript config for `apps/admin` (extend `@kubeasy/typescript-config/react.json`)

### Deferred Ideas (OUT OF SCOPE)
- Admin challenge management UI (table, stats, toggle) → Phase 11
- Admin user management UI → Phase 11
- Admin Hono API endpoints → Phase 11
- TLS termination and DNS cutover → Phase 12
- Caddy Railway deployment → Phase 12
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MFE-01 | `microfrontends.json` at root of parent app configures Turborepo proxy — web:3000, api:3001, admin:3002 — accessible on `localhost:3024` | Turborepo 2.6 MFE docs verified — exact format confirmed |
| MFE-02 | Dev scripts use `$TURBO_MFE_PORT` to listen on injected port | Confirmed — API already reads `process.env.PORT`, Vite uses `--port $TURBO_MFE_PORT` |
| ADMIN-01 | `apps/admin` is a Vite CSR SPA with TanStack Router, `base: "/admin/"` in vite.config.ts and `basePath="/admin"` in router — `vite build` verified | TanStack Router `basePath` + Vite `base` pattern confirmed |
| ADMIN-02 | Route guard — session via Better Auth client, redirect if non-admin | Better Auth `useSession()` pattern confirmed from existing `apps/web` |
</phase_requirements>

---

## Summary

Phase 10 has two independent workstreams: (1) the Turborepo MFE proxy that unifies three dev servers behind `localhost:3024`, and (2) the `apps/admin` Vite CSR SPA skeleton.

**Turborepo MFE proxy** (introduced in Turbo 2.6, project currently uses 2.8.17) is confirmed to work via a `microfrontends.json` file placed in the parent application directory (`apps/web/microfrontends.json`). It injects `TURBO_MFE_PORT` into each app's dev task. The `apps/api` already reads `process.env.PORT ?? 3001`, so it can receive `TURBO_MFE_PORT` directly with a minor dev script change (`PORT=$(turbo get-mfe-port) tsx ...`). Vite apps use `--port $TURBO_MFE_PORT`. No `turbo.json` changes are needed — the proxy activates automatically when `microfrontends.json` exists.

**apps/admin** is a pure Vite CSR SPA — no SSR complexity. The key challenge is the `/admin/` sub-path deployment: both Vite's `base` config and TanStack Router's `basePath` option must be set to `/admin/`. The auth guard lives in `__root.tsx` using Better Auth client's `useSession()` hook (same client setup as `apps/web`). The entire `apps/admin` package setup mirrors `apps/web` but stripped of SSR/Nitro dependencies.

**Primary recommendation:** Implement Turborepo MFE proxy first (simpler, pure config), then scaffold `apps/admin` as a Vite + TanStack Router CSR app mirroring the `apps/web` structure but with CSR-only setup.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| turbo | 2.8.17 (already installed) | MFE proxy via `microfrontends.json` | Built-in in Turborepo 2.6+ |
| vite | 8.0.2 (match `apps/web`) | Build tooling for `apps/admin` CSR SPA | Project standard |
| @vitejs/plugin-react | 6.0.1 (match `apps/web`) | React JSX transform in Vite | Project standard |
| @tailwindcss/vite | 4.2.2 (match `apps/web`) | Tailwind v4 Vite plugin | Project standard |
| @tanstack/react-router | 1.168.3 (match `apps/web`) | File-based routing + `basePath` support | Project standard |
| @tanstack/router-plugin | match router version | Vite plugin for file-based route gen | Required for file-based routing CSR |
| better-auth | 1.5.6 (match `apps/web`) | `useSession()` for auth guard | Project standard |
| @kubeasy/ui | workspace:* | Shared shadcn components | Phase 8 JIT pattern |
| @kubeasy/typescript-config | workspace:* | Shared tsconfig base | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.95.2 (match `apps/web`) | Data fetching — for future Phase 11 API calls | Add now for consistency |
| lucide-react | 0.577.0 | Icons for nav/UI | Nav icons in admin shell |
| tailwindcss | 4.2.2 | CSS framework | Via Vite plugin |
| tw-animate-css | 1.4.0 | Animation utilities | Match `apps/web` globals.css imports |
| shadcn | 4.1.0 (optional) | shadcn CLI for future component additions | Phase 11+ |
| @fontsource-variable/geist | 5.2.8 | Geist font | Visual parity with `apps/web` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Turborepo MFE proxy | Custom Node.js proxy (http-proxy) | MFE proxy is native + zero maintenance; custom proxy adds an `apps/proxy` package to maintain |
| TanStack Router | React Router v6 | Project already uses TanStack Router in `apps/web` — consistency wins |
| Better Auth `useSession()` | Manual fetch to `/api/auth/session` | `useSession()` is the exact pattern established in `apps/web` |

**Installation for `apps/admin`:**
```bash
pnpm --filter @kubeasy/admin add react react-dom @tanstack/react-router @tanstack/react-query better-auth @better-auth/api-key @kubeasy/ui @fontsource-variable/geist lucide-react tw-animate-css shadcn
pnpm --filter @kubeasy/admin add -D vite @vitejs/plugin-react @tailwindcss/vite tailwindcss @tanstack/router-plugin @kubeasy/typescript-config typescript @types/react @types/react-dom
```

**Version verification:** All versions matched to existing `apps/web/package.json` — no registry lookup needed.

---

## Architecture Patterns

### Recommended Project Structure

```
apps/admin/
├── src/
│   ├── routes/
│   │   ├── __root.tsx          # Shell layout + auth guard (CRITICAL: basePath aware)
│   │   ├── index.tsx           # Redirect to /challenges
│   │   ├── challenges/
│   │   │   └── index.tsx       # Placeholder
│   │   └── users/
│   │       └── index.tsx       # Placeholder
│   ├── components/
│   │   └── top-nav.tsx         # Admin top navigation bar
│   ├── lib/
│   │   └── auth-client.ts      # Better Auth client (copy from apps/web, same config)
│   ├── styles/
│   │   └── globals.css         # Mirror apps/web/src/styles/globals.css (no prose-neo needed)
│   └── main.tsx                # Entry point: createRouter + RouterProvider
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json

apps/web/
└── microfrontends.json         # MFE proxy config — lives in PARENT app (apps/web)

apps/caddy/
└── Caddyfile                   # Production routing reference template
```

### Pattern 1: Turborepo MFE Proxy Config

**What:** `microfrontends.json` in the parent app (`apps/web/`) tells Turbo to proxy `localhost:3024` to multiple apps based on path prefixes.
**When to use:** Always in this project for unified dev entry point.

**`apps/web/microfrontends.json`:**
```json
{
  "$schema": "https://turborepo.dev/microfrontends/schema.json",
  "applications": {
    "web": {
      "packageName": "@kubeasy/web",
      "development": {
        "local": {
          "port": 3000
        }
      }
    },
    "api": {
      "packageName": "@kubeasy/api",
      "development": {
        "local": {
          "port": 3001
        }
      },
      "routing": [
        {
          "paths": ["/api/:path*"]
        }
      ]
    },
    "admin": {
      "packageName": "@kubeasy/admin",
      "development": {
        "local": {
          "port": 3002
        }
      },
      "routing": [
        {
          "paths": ["/admin", "/admin/:path*"]
        }
      ]
    }
  }
}
```

**Dev script updates** (using `turbo get-mfe-port` for cross-platform compatibility):

`apps/web/package.json`:
```json
"dev": "vite dev --port $(turbo get-mfe-port)"
```

`apps/api/package.json` (API reads `process.env.PORT` — existing code, no app change needed):
```json
"dev": "PORT=$(turbo get-mfe-port) tsx --env-file=.env --watch src/index.ts"
```

`apps/admin/package.json`:
```json
"dev": "vite dev --port $(turbo get-mfe-port)"
```

**Note on `localProxyPort`:** The default is already 3024 (matches D-03). No `options` block needed unless changing the default.

**Note on `packageName`:** The `packageName` field should match the `name` in each app's `package.json`. Verified: `apps/web` is `@kubeasy/web`, `apps/api` is `@kubeasy/api`. Admin will be `@kubeasy/admin`.

### Pattern 2: Vite CSR SPA with Sub-Path Base

**What:** Pure client-side SPA deployed at `/admin/` path — both Vite and TanStack Router must know the base path.
**When to use:** Required for all assets and routes to resolve correctly when served from `/admin/`.

**`apps/admin/vite.config.ts`:**
```typescript
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/admin/",
  server: { port: 3002 },
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
  ],
});
```

**`apps/admin/src/main.tsx`:**
```typescript
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  basePath: "/admin",
  context: { queryClient },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  ReactDOM.createRoot(rootElement).render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

**Critical:** Both `base: "/admin/"` (Vite — with trailing slash) and `basePath: "/admin"` (TanStack Router — without trailing slash) must be set. Mismatch causes 404 on asset loads or broken navigation.

### Pattern 3: Admin Auth Guard in `__root.tsx`

**What:** Client-side auth guard using `authClient.useSession()` — pure CSR, no server functions.
**When to use:** As the root layout for the entire admin SPA.

**`apps/admin/src/routes/__root.tsx`:**
```typescript
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const { data: session, isPending } = authClient.useSession();
  const webUrl = import.meta.env.VITE_WEB_URL ?? "http://localhost:3000";

  if (isPending) {
    return <LoadingSpinner />;
  }

  if (!session) {
    window.location.href = `${webUrl}/login`;
    return null;
  }

  if (session.user.role !== "admin") {
    window.location.href = webUrl;
    return null;
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Kubeasy Admin</title>
        <link rel="stylesheet" href="/admin/globals.css" />
      </head>
      <body>
        <AdminShell>
          <Outlet />
        </AdminShell>
      </body>
    </html>
  );
}
```

**Note on CSS import in CSR `__root.tsx`:** Unlike TanStack Start (SSR), the CSR `__root.tsx` does NOT have `HeadContent`/`Scripts` components. CSS is imported directly in `main.tsx` as a module import, not via a `?url` link tag. See Pattern 4.

### Pattern 4: CSS Setup for CSR Admin App

**What:** Tailwind v4 + design tokens in a pure Vite CSR app.
**When to use:** `apps/admin` CSS entry.

**`apps/admin/src/main.tsx`** imports CSS directly:
```typescript
import "./styles/globals.css";
```

**`apps/admin/src/styles/globals.css`** (mirror `apps/web` but simplified — no prose-neo, no blog styles):
```css
@import "tailwindcss" source("../");
@source "../../../../packages/ui/src";
@import "@kubeasy/ui/styles/tokens";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "@fontsource-variable/geist";

@custom-variant dark (&:is(.dark *));

@theme {
  /* copy --color-* and --font-* variables from apps/web/src/styles/globals.css */
}

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
  html { @apply font-sans; }
}

/* Neobrutalist utility classes — copy from apps/web globals.css */
@layer utilities {
  .neo-shadow-sm { ... }
  .neo-border { ... }
  /* etc. */
}
```

**`@source` path:** `../../../../packages/ui/src` is relative to `apps/admin/src/styles/globals.css` — this path walks up from `apps/admin/src/styles/` to the monorepo root then into `packages/ui/src`.

### Pattern 5: Better Auth Client for Admin

**What:** Copy `apps/web/src/lib/auth-client.ts` directly — same setup, same API URL env var.
**When to use:** `apps/admin/src/lib/auth-client.ts`.

```typescript
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3001",
  fetchOptions: {
    credentials: "include",  // CRITICAL: shares cookies with API on same domain via proxy
  },
  plugins: [adminClient()],
});
```

**Note:** `apiKeyClient()` is NOT needed in admin (API keys are a user-facing feature, not admin tooling). Only `adminClient()` plugin is needed to get the `role` field on `session.user`.

### Pattern 6: Caddyfile Location

**Decision (Claude's Discretion D-16):** Place at `apps/caddy/Caddyfile`.

Rationale: Caddy will be deployed as a separate Railway service in Phase 12. Having `apps/caddy/` gives it a dedicated home with its own Dockerfile (Phase 12) and config. The `Caddyfile` is a reference template now, real deployment later.

```
kubeasy.dev {
    auto_https off

    # SSE requires immediate flush
    handle /api/* {
        reverse_proxy api:3001 {
            flush_interval -1
        }
    }

    handle /admin/* {
        reverse_proxy admin:3002
    }

    handle {
        reverse_proxy web:3000
    }
}
```

### Anti-Patterns to Avoid

- **Using `$TURBO_MFE_PORT` on Windows:** Use `$(turbo get-mfe-port)` instead — shell substitution works cross-platform.
- **Setting only Vite `base` without TanStack Router `basePath`:** Routes will resolve correctly but `Link` components generate paths without `/admin` prefix, causing 404s behind the proxy.
- **Setting only TanStack Router `basePath` without Vite `base`:** Assets (JS/CSS chunks) will 404 when served from `/admin/` because Vite generates `/assets/...` paths instead of `/admin/assets/...`.
- **Importing CSS with `?url` in CSR `__root.tsx`:** This is a TanStack Start (SSR) pattern — `HeadContent` renders it server-side. In pure Vite CSR, import CSS as a module in `main.tsx`.
- **Placing `microfrontends.json` at repo root:** Must live in the parent app's directory (`apps/web/microfrontends.json`), not at monorepo root.
- **Using `useSession()` in a server function context:** Admin SPA is pure CSR — no `createServerFn`, no `beforeLoad` async session fetch. Auth check happens in the React component render cycle only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-app dev proxy | Custom Node.js `http-proxy` app in `apps/proxy/` | Turborepo `microfrontends.json` | Zero maintenance, native Turbo integration, correct TURBO_MFE_PORT injection |
| File-based route generation | Manual route tree | `@tanstack/router-plugin` Vite plugin | Auto-generates `routeTree.gen.ts` with type-safety |
| Cookie sharing across sub-paths | Custom cookie handling | `credentials: "include"` in auth client fetch options | Browser handles cookie domain/path matching when served via proxy on same origin |
| CSS token deduplication | Copy-pasting token values | `@import "@kubeasy/ui/styles/tokens"` | Tokens defined once, consumed everywhere (established Phase 8 pattern) |

**Key insight:** The proxy makes all apps appear to be on the same origin (`localhost:3024`) — this means cookies set by the API (`localhost:3001` in isolation) are visible to the admin SPA because the proxy unifies the origin. No CORS issues, no cookie domain mismatches in dev.

---

## Common Pitfalls

### Pitfall 1: TURBO_MFE_PORT Not Injected for Non-Vite Apps

**What goes wrong:** The API dev script (`tsx ... src/index.ts`) doesn't pick up `TURBO_MFE_PORT` because the env var is injected but `tsx` doesn't have a `--port` flag.
**Why it happens:** Only Vite has a `--port` CLI argument. Node.js apps set port via `process.env.PORT`.
**How to avoid:** Use `PORT=$(turbo get-mfe-port) tsx ...` in the API dev script. The API `src/index.ts` already reads `process.env.PORT ?? 3001` — no app code change needed, only the package.json script.
**Warning signs:** API starts on port 3001 instead of the configured 3001, but the proxy can't reach it (Turbo may inject a different port than 3001 if the deterministic algorithm picks a different one).

**Important clarification:** Since D-03 specifies fixed ports (api:3001, admin:3002), we set explicit ports in `microfrontends.json` `development.local.port` — Turborepo won't override them. The PORT injection is just for startup script wiring.

### Pitfall 2: Vite `base` + TanStack Router `basePath` Mismatch

**What goes wrong:** After `vite build`, assets load correctly at `/admin/assets/...` but `<Link to="/challenges">` generates `/challenges` instead of `/admin/challenges`, breaking navigation.
**Why it happens:** Vite `base` controls asset URLs; TanStack Router `basePath` controls route URL generation. They are independent settings.
**How to avoid:** Always set both: `base: "/admin/"` in vite.config.ts AND `basePath: "/admin"` in `createRouter()`.
**Warning signs:** Build works, but clicking nav links results in 404s or navigates to `apps/web` routes.

### Pitfall 3: useSession() Returns Undefined Role

**What goes wrong:** `session.user.role` is `undefined` even for an admin user, causing all users to be redirected.
**Why it happens:** Better Auth's `role` field requires the `adminClient()` plugin to be initialized on the client side — the plugin extends the session type to include `role`.
**How to avoid:** Import and include `adminClient()` in `createAuthClient()` plugins array.
**Warning signs:** `session.user` exists (user is authenticated) but `session.user.role` is `undefined` or TypeScript reports the property doesn't exist.

### Pitfall 4: Cookie Not Sent to API Through Proxy

**What goes wrong:** `authClient.useSession()` returns `null` despite user being logged in on `apps/web`.
**Why it happens:** The auth client `baseURL` must point to the proxied API URL (`http://localhost:3024/api`) — not the direct API URL (`http://localhost:3001`) — otherwise the cookie domain doesn't match the current origin.
**How to avoid:** Set `VITE_API_URL=http://localhost:3024` (the proxy) in `apps/admin/.env`. The proxy forwards to the actual API.
**Warning signs:** Session is null in admin but valid in `apps/web`.

**Note:** `apps/web` uses `VITE_API_URL=http://localhost:3001` (direct) because it uses SSR server functions with explicit cookie forwarding. Admin is pure CSR and relies on browser cookie sending — must use the same origin.

### Pitfall 5: `index.html` base href Missing

**What goes wrong:** After `vite build`, the SPA loads at `/admin/` but refreshing the page returns 404 (from the proxy trying to serve `/admin/index.html` as a static file).
**Why it happens:** Vite generates `<script src="/admin/assets/...">` correctly but the proxy needs to serve `index.html` for all `/admin/*` routes (SPA fallback).
**How to avoid:** In dev, the Turborepo proxy handles this automatically (Vite dev server serves index.html for unknown paths). In prod, the Caddyfile `reverse_proxy` handles it (Vite preview serves it). No special config needed for this phase.
**Warning signs:** Direct URL access (e.g., `localhost:3024/admin/challenges`) fails with 404 in production.

---

## Code Examples

### Admin `tsconfig.json`
```json
{
  "extends": "@kubeasy/typescript-config/react.json",
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] },
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "vite.config.ts"]
}
```

### Admin `package.json` (key fields)
```json
{
  "name": "@kubeasy/admin",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev --port $(turbo get-mfe-port)",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --port 3002 --base /admin/",
    "typecheck": "tsc --noEmit"
  }
}
```

### `apps/admin/index.html`
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Kubeasy Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Admin `__root.tsx` (full CSR auth guard + shell)
```typescript
// Source: Based on Better Auth useSession() + TanStack Router CSR patterns
import { createRootRouteWithContext, Outlet, useNavigate } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const { data: session, isPending } = authClient.useSession();
  const webUrl = import.meta.env.VITE_WEB_URL ?? "http://localhost:3000";

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      window.location.href = `${webUrl}/login`;
    } else if (session.user.role !== "admin") {
      window.location.href = webUrl;
    }
  }, [session, isPending, webUrl]);

  if (isPending) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!session || session.user.role !== "admin") return null;

  return <Outlet />;
}
```

### Admin `.env.example`
```bash
VITE_API_URL=http://localhost:3024     # Via proxy (for cookie sharing in CSR)
VITE_WEB_URL=http://localhost:3000     # Where to redirect non-admin users
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate ports per app during dev | Turborepo MFE proxy (one unified port) | Turbo 2.6 (2024) | Single `pnpm dev` entry at localhost:3024 |
| `@tanstack/router-vite-plugin` | `@tanstack/router-plugin/vite` | TanStack Router 1.x | New package name — old one aliased but use new |
| `window.location.href` redirect | `useEffect` + `router.navigate()` | TanStack Router 1.x | `router.navigate()` preferred but doesn't cross-app; `window.location.href` is correct for cross-app redirects |

**Deprecated/outdated:**
- `@tanstack/router-vite-plugin`: Aliased to `@tanstack/router-plugin` — use `@tanstack/router-plugin` directly
- `$TURBO_MFE_PORT` bare shell variable: Use `$(turbo get-mfe-port)` for cross-platform safety (especially Windows)

---

## Open Questions

1. **Does `microfrontends.json` support the `packageName` field with scoped package names (`@kubeasy/api`)?**
   - What we know: The `packageName` field matches `name` in `package.json`
   - What's unclear: Whether scoped names (`@kubeasy/api`) work or only unscoped names are supported
   - Recommendation: Test at implementation time; fallback is omitting `packageName` and ensuring app key matches package name without scope

2. **Does `$(turbo get-mfe-port)` command work inside pnpm scripts?**
   - What we know: The command substitution `$(...)` works in bash/zsh; pnpm runs scripts via shell
   - What's unclear: Whether the shell pnpm uses on macOS supports this (likely yes — zsh default)
   - Recommendation: Test with a simple echo first; `$TURBO_MFE_PORT` is the alternative if command substitution fails

3. **VITE_API_URL for admin: proxy URL vs direct?**
   - What we know: `apps/web` uses direct `http://localhost:3001` (SSR server function forwards cookies explicitly); admin is pure CSR so the browser must send cookies automatically
   - What's unclear: Whether using `http://localhost:3024` (proxy) for `VITE_API_URL` in admin vs `http://localhost:3001` (direct) affects cookie sharing
   - Recommendation: Use proxy URL `http://localhost:3024` in admin `.env` — same origin as admin means browser sends session cookies automatically

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Turbo | MFE proxy | ✓ | 2.8.17 | — |
| Node.js | All builds | ✓ | v22.20.0 | — |
| pnpm | Package mgr | ✓ | 10.32.1 | — |
| vite | Admin CSR build | ✓ (in apps/web) | 8.0.2 | — |
| @tanstack/react-router | Admin routing | ✓ (in apps/web) | 1.168.3 | — |
| better-auth | Auth guard | ✓ (in apps/web) | 1.5.6 | — |
| @kubeasy/ui | Admin shell UI | ✓ (Phase 8) | workspace | — |

All dependencies are already in the monorepo. `apps/admin` will add new packages but no new external services.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 (root) |
| Config file | `apps/admin/vitest.config.ts` (Wave 0 gap) |
| Quick run command | `pnpm --filter @kubeasy/admin test:run` |
| Full suite command | `pnpm test:run` (root — all packages) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MFE-01 | `microfrontends.json` exists and is valid JSON | smoke | `node -e "JSON.parse(require('fs').readFileSync('apps/web/microfrontends.json','utf8'))"` | ❌ Wave 0 |
| MFE-02 | `dev` scripts in all 3 apps reference `turbo get-mfe-port` or `TURBO_MFE_PORT` | smoke (manual grep) | Manual inspection | ❌ Wave 0 |
| ADMIN-01 | `vite build` for `apps/admin` succeeds with assets at `/admin/` | smoke | `pnpm --filter @kubeasy/admin build` | ❌ Wave 0 |
| ADMIN-02 | Route guard logic: non-admin redirects, admin renders Outlet | unit | `pnpm --filter @kubeasy/admin test:run` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm typecheck --filter @kubeasy/admin`
- **Per wave merge:** `pnpm typecheck && pnpm --filter @kubeasy/admin build`
- **Phase gate:** MFE proxy smoke test + admin build success before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/admin/vitest.config.ts` — vitest config for admin app
- [ ] `apps/admin/src/__tests__/auth-guard.test.tsx` — covers ADMIN-02 (auth guard redirect logic)
- [ ] Framework install: already available (vitest at root) — admin just needs its own config

---

## Project Constraints (from CLAUDE.md)

- **Package manager:** Always use `pnpm`. Never use `npm` or `yarn`.
- **Never run `pnpm build`** to verify code — use `pnpm typecheck` instead.
- **Pre-commit hooks:** Husky runs Biome on staged files + full TypeScript check. Fix errors before committing.
- **Biome:** All linting and formatting — replaces ESLint + Prettier. Run `pnpm check:write` to auto-fix.
- **TypeScript strict mode:** All packages.
- **No tRPC:** REST + `@kubeasy/api-schemas` is the pattern.
- **`@kubeasy/ui` JIT pattern:** Export `.tsx` source directly, sub-path imports only, no barrel — `import { Button } from "@kubeasy/ui/button"`.
- **DB schema:** No changes this milestone — pure UI/infra work.

---

## Sources

### Primary (HIGH confidence)
- Turborepo MFE docs (turborepo.dev/docs/guides/microfrontends) — microfrontends.json format, TURBO_MFE_PORT, file location
- Turborepo 2.6 release notes (turborepo.dev/blog/turbo-2-6) — MFE feature introduction
- `apps/api/src/index.ts` — confirmed `process.env.PORT ?? 3001` pattern
- `apps/web/src/lib/auth-client.ts` — Better Auth client pattern to replicate
- `packages/ui/package.json` — confirmed 19 sub-path exports available
- `apps/web/src/styles/globals.css` — exact CSS structure to mirror

### Secondary (MEDIUM confidence)
- TanStack Router discussion #1242 (GitHub) — `basePath` option in `createRouter()` verified
- reetesh.in/blog TanStack Router Vite CSR setup — `createRouter` + `RouterProvider` pattern
- Turborepo issue #11061 — `$(turbo get-mfe-port)` cross-platform fix confirmed

### Tertiary (LOW confidence)
- Turborepo MFE `packageName` with scoped names — unconfirmed, test at implementation
- Windows-specific behavior of `$(turbo get-mfe-port)` — LOW, macOS is primary dev platform here

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against existing `apps/web/package.json`
- Architecture: HIGH — Turborepo MFE docs verified, TanStack Router basePath confirmed
- Pitfalls: HIGH for proxy/basePath pitfalls (confirmed from docs + GitHub issues); MEDIUM for cookie domain pitfall (inferred from auth patterns)

**Research date:** 2026-03-24
**Valid until:** 2026-06-01 (Turborepo MFE feature is stable; TanStack Router sub-path support is stable)
