# Phase 12: Caddy Production + Railway Deployment - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy Caddy as a Railway service (single entry point for `kubeasy.dev`), deploy `apps/admin` as an independent Railway service with nginx, update OAuth redirect URIs and `API_URL`, and perform DNS cutover. All production traffic for `kubeasy.dev` routes through Caddy — web, API (with SSE support), and admin served from one domain.

</domain>

<decisions>
## Implementation Decisions

### Caddy TLS
- **D-01:** Railway handles TLS at the edge. Caddy runs HTTP-only internally. `auto_https off` in Caddyfile is confirmed as correct — no Let's Encrypt cert management needed.
- **D-02:** Caddy listens on port 80. Railway's edge proxy handles HTTPS for `kubeasy.dev` and forwards HTTP to Caddy.

### Railway Internal Networking
- **D-03:** Upstream service addresses are injected via environment variables. Caddyfile uses `{$API_UPSTREAM}`, `{$WEB_UPSTREAM}`, `{$ADMIN_UPSTREAM}` placeholders.
- **D-04:** Railway env vars for the Caddy service are set to `*.railway.internal:PORT` values (e.g., `API_UPSTREAM=api.railway.internal:3001`). Flexible if service names change.
- **D-05:** The existing Caddyfile (`apps/caddy/Caddyfile`) must be updated to replace hardcoded `api:3001`, `admin:3002`, `web:3000` with the env var placeholders.

### Admin Production Serving
- **D-06:** `apps/admin` is served by **nginx** in production. Dockerfile: build the Vite SPA (output to `dist/`), then copy into `nginx:alpine`. nginx serves the SPA with:
  - Proper cache headers for static assets
  - SPA fallback (`try_files $uri $uri/ /admin/index.html`) since it's a client-side router
  - Base path `/admin/` preserved (matches `vite.config.ts` `base: '/admin/'` setting)
- **D-07:** `apps/admin` gets its own `railway.json` for the Railway service. Watch paths: `apps/admin/**`, `packages/**`.
- **D-08:** Caddy proxies `/admin/*` to the nginx admin service (same as current Caddyfile routing).

### OAuth Cutover
- **D-09:** OAuth redirect URIs and `API_URL` are updated as part of this phase — not deferred. Steps:
  1. Update `API_URL` Railway env var on the `api` service from `https://api.kubeasy.dev` to `https://kubeasy.dev`
  2. Update redirect URIs in GitHub OAuth app: add `https://kubeasy.dev/api/auth/callback/github`
  3. Update redirect URIs in Google OAuth console: add `https://kubeasy.dev/api/auth/callback/google`
  4. Update redirect URIs in Microsoft Entra: add `https://kubeasy.dev/api/auth/callback/microsoft`
  5. DNS cutover: point `kubeasy.dev` to the Caddy Railway service
- **D-10:** The plan should include explicit tasks for each OAuth provider URI update with the exact callback URL format used by Better Auth.

### Caddy Railway Service
- **D-11:** Caddy gets its own Railway service with a `Dockerfile` based on `caddy:alpine`. The Caddyfile is `COPY`-ed into the image at the standard path (`/etc/caddy/Caddyfile`).
- **D-12:** `apps/caddy/railway.json` — new file to create. Builder: DOCKERFILE. Watch paths: `apps/caddy/**`.
- **D-13:** SSE support preserved — the `flush_interval -1` directive in the Caddyfile must be retained for the `/api/*` reverse proxy block.

### Claude's Discretion
- Exact nginx.conf contents (cache headers, gzip, SPA fallback config)
- Caddy Dockerfile multi-stage vs single stage (caddy:alpine is lightweight — single stage is fine)
- Whether `apps/admin/railway.json` uses RAILPACK or DOCKERFILE builder
- Exact Railway service name for Caddy (e.g., `caddy` or `proxy`)
- Health check configuration for Caddy and admin services

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Caddy setup
- `apps/caddy/Caddyfile` — Reference template from Phase 10; must be updated with env var placeholders instead of hardcoded `api:3001` etc.

### Existing Railway config
- `apps/api/railway.json` — RAILPACK builder, watch paths pattern to follow for new services
- `apps/web/railway.json` — RAILPACK builder, startCommand pattern

### Admin app
- `apps/admin/package.json` — build script: `tsc --noEmit && vite build`; `vite.config.ts` base path must be `/admin/`
- `apps/admin/vite.config.ts` — verify `base: '/admin/'` is set (required for correct asset paths behind Caddy proxy)

### Phase 7 context (Railway deployment patterns)
- `.planning/phases/07-railway-deployment/07-CONTEXT.md` — Turborepo 3-stage Dockerfile pattern, RAILPACK builder decisions, service topology

### Phase 10 context (Caddyfile + proxy design)
- `.planning/phases/10-micro-frontend-dev-proxy-admin-scaffold/10-CONTEXT.md` — D-15/D-16: Caddyfile as prod reference artifact; routing intent

### Requirements
- `.planning/REQUIREMENTS.md` §ADMIN-18 — Admin Railway service requirement
- `.planning/REQUIREMENTS.md` §MFE-03/04/05 — Multi-frontend routing requirements

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/caddy/Caddyfile`: Already has correct routing structure and `flush_interval -1` for SSE — just needs hostname placeholders updated
- `apps/api/railway.json` + `apps/web/railway.json`: Templates for the new `apps/caddy/railway.json` and `apps/admin/railway.json`

### Established Patterns
- RAILPACK builder used by api + web services — Caddy may need DOCKERFILE since it uses `caddy:alpine` base
- `turbo prune --docker` pattern for apps/api and apps/web — not applicable to Caddy (no Node.js) or admin (nginx doesn't need turbo prune)
- Railway services communicate via `*.railway.internal` private networking

### Integration Points
- `apps/caddy/Caddyfile` — update `api:3001` → `{$API_UPSTREAM}`, `admin:3002` → `{$ADMIN_UPSTREAM}`, `web:3000` → `{$WEB_UPSTREAM}`
- `apps/caddy/Dockerfile` — new file: `FROM caddy:alpine`, COPY Caddyfile
- `apps/caddy/railway.json` — new file: DOCKERFILE builder, watch paths
- `apps/admin/Dockerfile` — new file: multi-stage (node build + nginx:alpine serve)
- `apps/admin/railway.json` — new file: builder + watch paths

</code_context>

<specifics>
## Specific Ideas

- Better Auth callback URL format: `https://kubeasy.dev/api/auth/callback/{provider}` — where `{provider}` is `github`, `google`, `microsoft`
- Railway private networking format: `<service-name>.railway.internal` — researcher should confirm exact Railway private domain pattern used in this project's Railway dashboard
- The Caddy service should be the ONLY service with a public Railway domain (`kubeasy.dev`). The api, web, and admin services should use only internal Railway networking after cutover (their public domains can be disabled or kept as fallback during transition)

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-caddy-production-railway-deployment*
*Context gathered: 2026-03-25*
