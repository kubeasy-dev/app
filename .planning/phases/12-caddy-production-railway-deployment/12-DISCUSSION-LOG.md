# Phase 12: Caddy Production + Railway Deployment - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 12-caddy-production-railway-deployment
**Areas discussed:** Caddy TLS strategy, Railway networking, Admin production serving, OAuth cutover strategy

---

## Caddy TLS Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Railway handles TLS (auto_https off) | Railway's edge terminates TLS. Caddy stays HTTP-only internally. No cert management. | ✓ |
| Caddy handles TLS via Let's Encrypt | Caddy requests own certs. Requires port 443 exposed and DNS pointing at Caddy. More complex on Railway. | |

**User's choice:** Railway handles TLS (auto_https off)
**Notes:** Confirmed existing Caddyfile approach. Simple, no cert management needed.

---

## Railway Internal Networking

| Option | Description | Selected |
|--------|-------------|----------|
| Env vars injected at runtime | Caddyfile uses {$API_UPSTREAM} etc. Railway env vars set to *.railway.internal:PORT values. | ✓ |
| Hardcoded Railway private addresses | Caddyfile directly uses api.railway.internal:3001 etc. Simpler but less flexible. | |
| Railway reference variables in railway.json | Use ${{api.RAILWAY_PRIVATE_DOMAIN}} reference syntax. | |

**User's choice:** Env vars injected at runtime
**Notes:** Caddyfile will use {$API_UPSTREAM}, {$WEB_UPSTREAM}, {$ADMIN_UPSTREAM} placeholders.

---

## Admin Production Serving

| Option | Description | Selected |
|--------|-------------|----------|
| nginx serving static files | Dockerfile: build Vite, copy dist/ into nginx:alpine. SPA fallback, cache headers. | ✓ |
| Node.js vite preview | Run vite preview in production. Not intended for production per Vite docs. | |
| Caddy serves admin static files directly | Copy dist/ into Caddy image. Fewer services but tight coupling. | |

**User's choice:** nginx serving static files
**Notes:** nginx:alpine with SPA fallback (try_files to /admin/index.html), base path /admin/ preserved.

---

## OAuth Cutover Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Update API_URL + OAuth URIs as part of this phase | Atomic cutover: update API_URL env var + OAuth console redirect URIs + DNS together. | ✓ |
| Add both old and new redirect URIs during transition | Zero-downtime but more manual steps — keep api.kubeasy.dev URIs while adding kubeasy.dev URIs. | |
| Keep api.kubeasy.dev as the auth domain | Avoid OAuth changes entirely. Creates inconsistency but simpler. | |

**User's choice:** Update API_URL + OAuth URIs as part of this phase
**Notes:** All three OAuth providers (GitHub, Google, Microsoft) need callback URIs updated to https://kubeasy.dev/api/auth/callback/{provider}.

---

## Claude's Discretion

- nginx.conf contents (cache headers, gzip, SPA fallback config)
- Caddy Dockerfile structure (single stage with caddy:alpine is fine)
- apps/admin/railway.json builder choice
- Exact Railway service name for Caddy
- Health check configuration

## Deferred Ideas

None — discussion stayed within phase scope
