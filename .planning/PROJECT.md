# Kubeasy — Monorepo v1.0 (Shipped)

## What This Is

Monorepo TypeScript avec Turborepo hébergeant deux apps distinctes — une API Hono REST long-lived (`apps/api`) et un frontend TanStack Start (`apps/web`) — plus des packages partagés pour les contrats d'API, les jobs BullMQ, le logger et la config TypeScript. Déployé sur Railway.

Les fonctionnalités restent identiques au monolithe Next.js original : apprentissage Kubernetes par challenges interactifs, suivi de progression, XP, blog Notion, et validation en temps réel des soumissions CLI.

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

### Active (v1.1)

- [ ] SSG blog articles à build time (WEB-04) — actuellement SSR uniquement
- [ ] Vérifier et corriger le rendu SSR/SSG de la liste challenges — bug suspecté
- [ ] Vérifier cross-subdomain cookie flow sur domaine `*.kubeasy.dev` stable

### Out of Scope

- tRPC — remplacé par REST + @kubeasy/api-schemas
- Upstash (Redis REST serverless) — remplacé par Redis natif
- Vercel deployment — remplacé par Railway
- Neon serverless driver — remplacé par pg
- App worker BullMQ séparée — architecture préparée dans `packages/jobs`, extraction future
- Migration blog Notion → MDX — évaluation post-v1.0
- OpenAPI / génération client Go — v2

## Current State (post-v1.0)

**Stack en production :**
- `apps/api` — Hono 4.x + @hono/node-server, Better Auth 1.5, Drizzle ORM + pg, ioredis, BullMQ, pino, OTel SDK
- `apps/web` — TanStack Start 1.166.x, TanStack Router, TanStack Query, shadcn/ui, Tailwind CSS 4, pino, OTel SDK
- `packages/api-schemas` — Zod schemas JIT (no build step)
- `packages/jobs` — BullMQ queue definitions JIT
- `packages/logger` — pino wrapper
- `packages/typescript-config` — tsconfig partagées

**Infra production (Railway) :**
- Service `api` — Hono, port 3001, `api.kubeasy.dev`
- Service `web` — TanStack Start SSR/SSG, port 3000, `kubeasy.dev`
- PostgreSQL plugin Railway → `DATABASE_URL`
- Redis plugin Railway → `REDIS_URL`, `maxmemory-policy noeviction`
- SigNoz template Railway — OTel traces/logs des deux services

**Infra locale (docker-compose) :**
- PostgreSQL, Redis (`noeviction`), OTel Collector

**LOC :** ~14 900 TypeScript

## Context

**Décisions architecturales confirmées en v1.0 :**
- API Hono REST + @kubeasy/api-schemas remplace tRPC — contrats partagés sans couplage framework
- SSE cache-invalidation channel (invalidate-cache:{userId}) — générique, extensible
- BullMQ workers dans `apps/api` avec définitions dans `packages/jobs` — ready pour extraction
- pg Pool à la place de postgres.js — nécessaire pour OTel pg auto-instrumentation
- turbo prune --docker 3-stage pattern — images minimales pour Railway

**Problèmes rencontrés et résolus :**
- TanStack Start v1.166.x : `createStartHandler` prend un callback direct (pas `{createRouter}`)
- Vinxi output path : `dist/` (pas `.output/`) — corrigé dans Dockerfiles et railway.json
- Prerender Docker build : `crawlLinks:false` obligatoire — routes API-dépendantes crashent sans backend
- tsconfig `noEmit:false` override requis dans apps/api — base.json hérite `noEmit:true`
- RAILWAY_CONFIG_PATH service variable nécessaire par service — Railway n'auto-découvre pas les sous-répertoires

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

---
*Last updated: 2026-03-23 after v1.0 milestone*
