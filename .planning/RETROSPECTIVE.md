# Retrospective

## Milestone: v1.0 — Monorepo Refactoring

**Shipped:** 2026-03-23
**Phases:** 9 (+ 2 inserted) | **Plans:** 34

### What Was Built

- Turborepo monorepo avec `apps/api` (Hono), `apps/web` (TanStack Start), 4 packages partagés
- API REST complète remplaçant tRPC — tous les endpoints portés + rate limiting + CLI alias
- Better Auth cross-subdomain sur Hono — OAuth 3 providers + API keys CLI
- TanStack Start frontend — toutes pages, TanStack Query, SSG landing, realtime SSE
- BullMQ workers avec logique métier réelle (XP, analytics, Resend contacts)
- Dashboard radar chart + profil complet (tokens, email prefs, danger zone)
- Observabilité OTel full-stack — pino, pg/ioredis/http auto-instrumentations, SigNoz
- Déploiement Railway production — multi-stage Dockerfiles, plugins PostgreSQL + Redis, smoke test ✅

### What Worked

- **turbo prune --docker** : pattern 3-stage parfaitement adapté au monorepo, images minimales
- **@kubeasy/api-schemas JIT** : pas de build step, consommable partout, supprime tRPC sans friction
- **BullMQ dans `apps/api` / défini dans `packages/jobs`** : couplage minimal, workers faciles à déplacer
- **Railway plugins PostgreSQL + Redis** : injection d'env vars automatique, ISO avec docker-compose
- **SigNoz via template Railway** : traces visibles immédiatement post-deploy, sans config manuelle

### What Was Inefficient

- **Phases 5, 5.1, 5.2 mal trackées dans ROADMAP** : les 3 phases avaient leurs SUMMARY mais le ROADMAP ne reflétait pas la réalité — découvert en fin de milestone
- **REQUIREMENTS.md non mis à jour** : DEPLOY-03 et DEPLOY-04 faits mais checkboxes restées `[ ]` — extra friction lors du complete-milestone
- **gsd-tools summary-extract** : retourne "None" sur tous les SUMMARY.md (pas de frontmatter `one_liner`) — les accomplishments doivent être rédigés manuellement
- **Commits git peu nombreux** : le travail a été fait mais seulement ~10 commits dans la branche main — perte de granularité dans l'historique

### Patterns Established

- **pg Pool obligatoire pour OTel** : postgres.js incompatible avec OTel pg auto-instrumentation — toujours utiliser `pg` quand OTel traces sont requises
- **RAILWAY_CONFIG_PATH par service** : Railway n'auto-découvre pas les sous-répertoires — variable service obligatoire
- **crawlLinks: false en Docker build** : routes API-dépendantes crashent sans backend au build time — restreindre prerender à `/` uniquement
- **tsconfig noEmit:false override** : base.json hérite `noEmit:true` — override obligatoire dans apps/api pour tsc emit
- **createStartHandler(callback)** : TanStack Start v1.166.x prend un callback direct, pas `{createRouter}` — pattern stable à documenter

### Key Lessons

1. **Mettre à jour REQUIREMENTS.md en temps réel** — ne pas attendre le complete-milestone pour cocher les cases
2. **Vérifier ROADMAP progress counts après chaque phase** — les compteurs "X/Y plans" dérivent facilement
3. **TanStack Start RC = instabilité** — vérifier la doc contre la version exacte (v1.166.x) avant chaque plan; les patterns changent entre releases
4. **Toujours tester prerender en Docker** — les bugs SSR ne se manifestent qu'au build time sans backend

### Cost Observations

- Sessions: plusieurs sessions sur 5 jours (2026-03-18 → 2026-03-23)
- Model: Claude Sonnet 4.6 (balanced profile)
- Phases insérées: 2 (5.1, 5.2) — features découvertes manquantes après la migration initiale

---

## Cross-Milestone Trends

| Metric | v1.0 |
|--------|------|
| Phases | 9 (+ 2 inserted) |
| Plans | 34 |
| LOC | ~14 900 TS |
| Duration | 5 days |
| Inserted phases | 2 |
| Known gaps at ship | 2 |
