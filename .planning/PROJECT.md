# Kubeasy — v1.1 Shipped

## What This Is

Monorepo TypeScript avec Turborepo hébergeant trois apps — une API Hono REST long-lived (`apps/api`), un frontend TanStack Start (`apps/web`), et une SPA admin Vite + React (`apps/admin`) — plus des packages partagés (`@kubeasy/ui` shadcn, api-schemas, jobs, logger, typescript-config). Routage unifié en production via un reverse proxy Caddy sur Railway.

Les fonctionnalités couvrent l'apprentissage Kubernetes par challenges interactifs, suivi de progression, XP, blog Notion, validation en temps réel des soumissions CLI, et interface d'administration complète (gestion challenges + utilisateurs).

## Core Value

L'API Hono est la source de vérité unique (auth, données, temps réel). Le web TanStack Start est un client hybride qui la consomme. BullMQ est assez découplé (`packages/jobs`) pour migrer vers un worker dédié sans refacto majeur.

## Requirements

### Validated (v1.0)

- ✓ Monorepo Turborepo + pnpm workspaces — `apps/api`, `apps/web`, packages partagés — v1.0
- ✓ `apps/api` — Hono REST + SSE, postgres.js → pg driver, Drizzle ORM — v1.0
- ✓ `packages/api-schemas` — contrats Zod partagés requêtes/réponses API — v1.0
- ✓ `packages/jobs` — définitions BullMQ découplées, factory createQueue — v1.0
- ✓ Better Auth migré dans `apps/api`, web utilise le client Better Auth — v1.0
- ✓ OAuth GitHub, Google, Microsoft + cross-subdomain cookies `.kubeasy.dev` — v1.0
- ✓ API keys CLI avec middleware Bearer token — v1.0
- ✓ TanStack Start remplaçant Next.js — toutes pages migrées, TanStack Query — v1.0
- ✓ SSG landing page `/` — v1.0
- ✓ Realtime SSE via Redis pub/sub (invalidate-cache channel) — v1.0
- ✓ BullMQ workers avec logique métier réelle (XP, analytics, Resend) — v1.0
- ✓ Dashboard radar chart + recent activity + profil complet (tokens, email prefs, danger zone) — v1.0
- ✓ Observabilité OTel full-stack — pino, pg/ioredis/http instrumentations, SigNoz Railway — v1.0
- ✓ Dockerfiles multi-stage turbo prune + railway.json par service — v1.0
- ✓ Railway production — PostgreSQL + Redis plugins, smoke test ✅ — v1.0
- ✓ Suppression dépendances Vercel/Upstash serverless/Neon serverless — v1.0

### Validated (v1.1)

- ✓ `packages/ui` (`@kubeasy/ui`) — 17 composants shadcn JIT, CSS tokens neobrutalism, peerDeps React — v1.1
- ✓ `apps/web` migré vers `@kubeasy/ui` — dossier `components/ui/` supprimé, 32 imports mis à jour — v1.1
- ✓ Parité visuelle complète — blog, landing, challenges, dashboard identiques à `../website` — v1.1
- ✓ Turborepo micro-frontend proxy — `localhost:3024` unifie web/api/admin, `$TURBO_MFE_PORT` — v1.1
- ✓ `apps/admin` SPA Vite + React, TanStack Router, `base: "/admin/"`, auth guard, top-nav shell — v1.1
- ✓ Admin challenges page — 4 stats cards, table + optimistic toggle — v1.1
- ✓ Admin users page — 4 stats cards, pagination 50/page, role/ban actions via Better Auth adminClient — v1.1
- ✓ 5 Hono admin REST endpoints avec Drizzle aggregates et middleware admin — v1.1
- ✓ Caddy reverse proxy Railway — Caddyfile routing web/api/admin, `flush_interval -1` SSE, DOCKERFILE builder — v1.1
- ✓ Admin servi depuis container Caddy (build statique multi-stage nginx) — pas de service Railway séparé — v1.1
- ✓ Production déployée sur `v2.kubeasy.dev` — OAuth end-to-end fonctionnel — v1.1

### Active

- [ ] **MFE-05**: DNS cutover `kubeasy.dev` → Caddy (transférer custom domain depuis service `web`) + mettre à jour `API_URL` et OAuth redirect URIs (GitHub/Google/Microsoft) — délibérément différé post-v1.1

### Out of Scope

- tRPC — remplacé par REST + @kubeasy/api-schemas
- Upstash (Redis REST serverless) — remplacé par Redis natif
- Vercel deployment — remplacé par Railway
- Neon serverless driver — remplacé par pg
- App worker BullMQ séparée — architecture préparée dans `packages/jobs`, extraction future
- Migration blog Notion → MDX — évaluation post-v1.0
- OpenAPI / génération client Go — v2
- Admin submissions view — trop de complexité pour v1.1 (ADMIN-DEF-01)
- Admin analytics dashboard PostHog — v2 (ADMIN-DEF-02)
- Challenge import UI depuis GitHub — v2 (ADMIN-DEF-03)

## Current State (post-v1.1)

**Stack en production :**
- `apps/api` — Hono 4.x + @hono/node-server, Better Auth 1.5, Drizzle ORM + pg, ioredis, BullMQ, pino, OTel SDK
- `apps/web` — TanStack Start 1.166.x, TanStack Router, TanStack Query, @kubeasy/ui, Tailwind CSS 4, pino, OTel SDK
- `apps/admin` — Vite SPA, React 19, TanStack Router, @kubeasy/ui, Better Auth adminClient, @kubeasy/api-schemas
- `apps/caddy` — caddy:alpine Dockerfile, Caddyfile reverse proxy, admin SPA statique (nginx multi-stage)
- `packages/ui` — 17 shadcn/ui components JIT, CSS tokens, cn() utility
- `packages/api-schemas` — Zod schemas JIT (no build step)
- `packages/jobs` — BullMQ queue definitions JIT
- `packages/logger` — pino wrapper
- `packages/typescript-config` — tsconfig partagées

**Infra production (Railway) :**
- Service `caddy` — reverse proxy, custom domain `v2.kubeasy.dev` (kubeasy.dev cutover pending)
- Service `api` — Hono, port 8080, Railway internal (`api.railway.internal`)
- Service `web` — TanStack Start SSR/SSG, port 8080, Railway internal (`web.railway.internal`)
- PostgreSQL plugin Railway → `DATABASE_URL`
- Redis plugin Railway → `REDIS_URL`, `maxmemory-policy noeviction`
- SigNoz template Railway — OTel traces/logs

**Infra locale (docker-compose + Turborepo MFE proxy) :**
- PostgreSQL, Redis (`noeviction`), OTel Collector
- `localhost:3024` → proxy Turborepo unifie web:3000, api:3001, admin:3002

**LOC :** ~17 000 TypeScript (estimation post-v1.1, +2 100 depuis v1.0)

## Context

**Décisions architecturales confirmées en v1.1 :**
- `@kubeasy/ui` pattern JIT — export `.tsx` source directement, pas de build step, sub-path exports uniquement (pas de barrel)
- `react`/`react-dom` en `peerDependencies` dans `@kubeasy/ui` — évite les instances React dupliquées
- Admin servi depuis container Caddy (multi-stage avec nginx) — ADMIN-18 change d'architecture vs spec initiale (service Railway séparé) — simplifie le déploiement
- Better Auth `adminClient()` pour toutes les mutations utilisateurs (ban/unban/setRole) — pas d'endpoints Hono custom ADMIN-15/16/17
- Redirections cross-app via `window.location.href` — admin et web sont des SPAs séparées sur des ports différents
- DNS cutover `kubeasy.dev` → Caddy délibérément différé — `v2.kubeasy.dev` validé en prod d'abord

**Problèmes rencontrés et résolus (v1.1) :**
- `@tanstack/router-plugin` épinglé à 1.167.4 pour correspondre au lockfile (compatible avec react-router 1.168.3)
- Admin auth-client baseURL vers `localhost:3024` (proxy MFE) — les cookies partagent le même origin
- Caddyfile syntaxe env vars : `{$VAR_NAME}` (accolades simples) et non `${VAR_NAME}` (style shell)
- nginx `alias` (pas `root`) pour `/admin/` SPA — Vite dist/ n'a pas de sous-dossier admin/
- RAILWAY_CONFIG_PATH nécessaire par service — Railway n'auto-découvre pas les sous-répertoires de Dockerfiles
- `VITE_API_URL` doit être passé comme `--build-arg` Docker pour le build statique admin

## Constraints

- **Compatibilité CLI Go** : endpoints API doivent rester compatibles avec `kubeasy-cli`
- **Schéma DB** : pas de changements dans ce milestone — migration pure
- **PostHog** : conservé pour analytics produit uniquement, logs/traces via OTel

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Turborepo comme orchestrateur monorepo | Cache de build, pipelines task, bien intégré pnpm | ✓ Good — build cache fonctionnel, turbo prune essentiel pour Docker |
| Hono pour l'API (remplace tRPC dans Next.js) | Découplage web/api, support natif SSE, standard HTTP REST | ✓ Good — SSE natif, middleware flexible, long-lived process sur Railway |
| TanStack Start pour le web (remplace Next.js) | SSG natif, Tanstack Query intégré, pas de vendor lock Vercel | ⚠️ Revisit — RC instable (daily publish), API prerender change souvent, blog SSG incomplet |
| REST + @kubeasy/api-schemas (remplace tRPC) | Contrats partagés sans couplage framework, consommable par CLI Go | ✓ Good — schemas Zod JIT, aucun build step requis |
| @kubeasy/jobs package (découplage BullMQ) | Migration future vers worker dédié sans refacto API | ✓ Good — workers dans api, definitions dans package, prêt pour extraction |
| SSE via Redis pub/sub (remplace Upstash Realtime) | Stack self-hosted, contrôle, ISO local/prod | ✓ Good — invalidate-cache channel générique, cleanup onAbort propre |
| Railway (remplace Vercel) | Adapté aux apps non-serverless (Hono long-lived, Redis, workers) | ✓ Good — déploiement prod fonctionnel, SigNoz intégré |
| OTel Collector → SigNoz Railway template | Flexibilité observabilité + UI traces intégrée | ✓ Good — traces visibles dès le smoke test |
| pg Pool remplace postgres.js | OTel pg auto-instrumentation requiert le driver pg officiel | ✓ Good — DB spans visibles dans SigNoz |
| Refacto in-place dans ce repo | Historique git préservé, transition progressive | ✓ Good — pas de friction de migration |
| `@kubeasy/ui` JIT sans build step | Sub-path exports source .tsx — apps consomment directement | ✓ Good — pas de compilation, Tailwind @source fonctionne, peerDeps propres |
| Admin dans container Caddy (vs service Railway séparé) | Simplifie déploiement — 1 service pour proxy + admin static | ✓ Good — moins de services Railway, pas de CORS cross-service |
| Better Auth adminClient pour mutations users | Évite duplication auth logic dans endpoints custom | ✓ Good — ban/unban/setRole gérés par Better Auth, self-action guard côté UI |
| DNS cutover `kubeasy.dev` différé | Valider Caddy sur `v2.kubeasy.dev` avant de basculer le domaine principal | — Pending — risque maîtrisé, cutover peut se faire indépendamment |
| Cross-app redirects via `window.location.href` | Admin et web sont des SPAs séparées — pas de router.navigate cross-app | ✓ Good — correct pour architecture micro-frontend |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-25 — v1.1 milestone complete: UI parity + admin app + Caddy production shipped*
