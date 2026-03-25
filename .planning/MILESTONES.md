# Milestones

## v1.1 UI Parity + Micro-Frontend + Admin (Shipped: 2026-03-25)

**Phases completed:** 5 phases, 13 plans, 21 tasks

**Key accomplishments:**

- @kubeasy/ui package created with 17 shadcn components, neobrutalism CSS token file, cn() utility, and JIT TypeScript exports — no build step required
- apps/web fully rewired to consume all UI components from @kubeasy/ui — zero local shadcn copies, CSS tokens delegated to shared package, 32 imports across 14 files updated, monorepo typecheck clean
- Blog list and article pages ported to match ../website: BlogCard featured/compact variants, category filter badges, sidebar ToC with IntersectionObserver, AuthorCard, RelatedPosts, prose-neo typography, and grid layout
- Challenge detail back button migrated to Button ghost asChild pattern; all 6 challenge/theme/type route pages verified visually identical to ../website reference
- Dashboard stats rewritten with Award/Trophy/Star/Flame icons, Completed/Points/Rank/Day Streak labels, 2-column chart+activity grid, Button quick actions, and bg-secondary rounded-xl insight box
- One-liner:
- Admin-only auth guard in __root.tsx with role-based cross-SPA redirects, neo-brutalist top-nav shell (logo + Challenges/Users/Settings + avatar dropdown), placeholder routes, and Caddy production proxy reference template — verified in browser.
- Five Hono admin REST endpoints with Drizzle aggregate queries and three new Zod schemas in @kubeasy/api-schemas/auth
- TanStack Query-powered admin challenges page with 4 neo-brutalist stat cards, 8-column table, and optimistic availability toggle
- Admin users page with 4 stats cards, paginated table (avatar/role/XP/ban status), role change and ban/unban actions via Better Auth adminClient, and self-action guard
- Caddy single-stage caddy:alpine Dockerfile with env var placeholders in Caddyfile, plus two-stage node/nginx admin Dockerfile with SPA routing config — both Railway-ready with DOCKERFILE builder railway.json

---

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
