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

## Milestone: v1.1 — UI Parity + Micro-Frontend + Admin

**Shipped:** 2026-03-25
**Phases:** 5 | **Plans:** 13

### What Was Built

- `packages/ui` (`@kubeasy/ui`) — 17 composants shadcn JIT, CSS tokens neobrutalism, peerDeps React
- `apps/web` migré vers `@kubeasy/ui` — zero shadcn copies locales, 32 imports mis à jour
- Parité visuelle complète — blog (BlogCard, ToC, AuthorCard), landing, challenges, dashboard identiques à `../website`
- Turborepo micro-frontend proxy — `localhost:3024` unifie web/api/admin, `$TURBO_MFE_PORT` injecté
- `apps/admin` SPA Vite + React — TanStack Router, auth guard, top-nav neo-brutalist, routes placeholder
- Admin challenges page — 4 stats cards (completion/success rate), table optimistic toggle
- Admin users page — 4 stats cards, pagination 50/page, role/ban via Better Auth adminClient
- 5 Hono admin REST endpoints avec Drizzle aggregates (challenges, users, stats)
- Caddy reverse proxy Railway — Caddyfile multi-routing, `flush_interval -1` SSE, admin servi en statique depuis container
- Production `v2.kubeasy.dev` — OAuth end-to-end (GitHub/Google/Microsoft), admin accessible

### What Worked

- **`@kubeasy/ui` JIT pattern** : export source .tsx directement, sub-path exports, peerDeps — aucun build step, Tailwind @source fonctionne parfaitement
- **Admin dans container Caddy** : architecture simplifiée vs service Railway séparé — nginx multi-stage propre, moins de services à gérer
- **Better Auth adminClient** : mutations ban/unban/setRole sans duplication de logique auth — API officielle plutôt qu'endpoints custom
- **Turborepo MFE proxy** : `microfrontends.json` + `$TURBO_MFE_PORT` — DX locale excellente, toutes les apps sur même origin
- **5-phase scope bien défini** : aucune phase insérée en urgence, scope respecté (à part ADMIN-18 changé délibérément)

### What Was Inefficient

- **MFE-05 DNS cutover non complété** : kutover `kubeasy.dev` → Caddy toujours pending — feature différée mais encore dans "Active" requirements
- **Quelques SUMMARY.md sans one_liner** : gsd-tools summary-extract retourne null sur les fichiers sans frontmatter — même problème qu'en v1.0
- **ROADMAP.md progress table manquait les plans Phase 8 et 12** : les compteurs "0/2" n'ont été corrigés qu'au complete-milestone
- **TanStack Router `@tanstack/router-plugin` pin requis** : compatibilité entre router et router-plugin non évidente — coût de debug non anticipé

### Patterns Established

- **Caddyfile syntaxe env vars** : `{$VAR_NAME}` (accolades simples avec dollar) — pas `${VAR_NAME}` style shell
- **nginx `alias` vs `root` pour SPA** : Vite dist/ n'a pas de sous-dossier `/admin/` — toujours utiliser `alias` pour les apps sous-chemin
- **VITE_API_URL comme `--build-arg` Docker** : les variables d'env buildtime Vite doivent être passées explicitement au build step Docker
- **`window.location.href` pour redirections cross-SPA** : `router.navigate` ne fonctionne pas entre apps séparées — redirection HTTP obligatoire
- **Better Auth adminClient baseURL = proxy MFE** : en dev, le client admin doit pointer vers `localhost:3024` pour partager les cookies same-origin

### Key Lessons

1. **Valider la prod avant DNS cutover** — déployer sur sous-domaine dédié (`v2.kubeasy.dev`) puis couper est la bonne approche
2. **ADMIN-18 architectural pivot accepté** : changer d'architecture en cours d'exécution (service séparé → Caddy container) est OK si décision délibérée et documentée
3. **Peerdingest peerDeps dès le début** : déclarer `react`/`react-dom` en peerDependencies dans les packages partagés évite les doubles instances — ne pas attendre les erreurs runtime
4. **Admin baseURL dépend de l'environnement** : ne pas hardcoder localhost:3001 dans le client admin — utiliser le proxy MFE en dev, même origin en prod

### Cost Observations

- Sessions: 2 jours (2026-03-24 → 2026-03-25)
- Model: Claude Sonnet 4.6 (balanced profile)
- Phases insérées: 0 — scope initial respecté
- Known gaps at ship: 1 (MFE-05 DNS cutover délibérément différé)

---

## Cross-Milestone Trends

| Metric | v1.0 | v1.1 |
|--------|------|------|
| Phases | 9 (+ 2 inserted) | 5 |
| Plans | 34 | 13 |
| LOC | ~14 900 TS | ~17 000 TS |
| Duration | 5 days | 2 days |
| Inserted phases | 2 | 0 |
| Known gaps at ship | 2 | 1 |
