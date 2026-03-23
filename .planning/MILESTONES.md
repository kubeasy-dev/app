# Milestones

## v1.0 Monorepo Refactoring (Shipped: 2026-03-23)

**Phases completed:** 9 phases, 34 plans | ~14 900 LOC TypeScript | 2026-03-18 → 2026-03-23

**Key accomplishments:**
- Monorepo Turborepo + pnpm workspaces avec `apps/api`, `apps/web`, `packages/api-schemas`, `packages/jobs`, `packages/logger`, `packages/typescript-config`
- API Hono REST long-lived remplaçant tRPC Next.js — tous les endpoints portés, rate limiting ioredis, CLI alias, postgres.js → pg driver
- Better Auth cross-subdomain sur Hono — OAuth GitHub/Google/Microsoft, API keys pour CLI, cookies `.kubeasy.dev`
- TanStack Start remplaçant Next.js — toutes les pages migrées, TanStack Query replacing tRPC hooks, SSG landing page
- Realtime SSE via Redis pub/sub + BullMQ workers avec logique métier réelle (XP, analytics, Resend contacts)
- Dashboard radar chart (recharts), recent activity groupée par mois, gestion profil complète (tokens API, email prefs, danger zone)
- Observabilité full OTel — pino logger, pg/ioredis/http auto-instrumentations, OTel Collector docker-compose, SigNoz Railway
- Déploiement Railway — Dockerfiles multi-stage turbo prune, railway.json par service, PostgreSQL + Redis plugins, smoke test production ✅

**Known gaps (v1.1):**
- WEB-04: Blog articles non SSG à build time (seul `/` est pré-rendu) — SSR uniquement pour le blog
- Challenges list: bug SSR/SSG à vérifier en v1.1

---

