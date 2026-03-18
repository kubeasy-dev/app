# Technical Concerns

## High Priority

### 1. No Rate Limiting on Public tRPC Endpoints

**Location:** `server/api/trpc.ts` — `publicProcedure`

Public tRPC endpoints (challenge listing, submission, blog) have no rate limiting. The `submitChallenge` endpoint in particular could be abused to spam submissions.

**Risk:** Abuse of submission endpoint; XP farming; DB load from unauthenticated scraping.

**Mitigation:** Upstash Redis (`@upstash/redis`) is already installed. Could add rate limiting middleware using Upstash's rate-limit library.

---

### 2. API Key Rate Limiting Disabled

**Location:** `lib/auth.ts` — `@better-auth/api-key` plugin config

The API key plugin is configured but rate limiting may be disabled or not enforced for CLI API key requests.

**Risk:** Unconstrained CLI-to-backend traffic, potential abuse vector for automated submissions.

---

### 3. Missing Integration Tests for Critical Submission Flow

**Location:** `server/api/routers/userProgress.ts`

The `submitChallenge` mutation has complex logic: objective validation, XP awarding, concurrent deduplication via `onConflictDoNothing`. No tests exist for this path.

**Risk:** Silent breakage of the core user journey (submit challenge → get XP) on schema or logic changes.

**Mitigation:** Add Vitest integration tests. The infrastructure (Vitest + fast-check) is already installed.

---

### 4. Fragile Objective Metadata Sync

**Location:** `server/db/schema/challenge.ts` — `challengeObjective` table; CLI sync logic

Challenge objectives in the database must stay in sync with `challenge.yaml` files in the separate `challenges` repo. There's no automated sync mechanism visible in this codebase — the CLI is responsible for upsyncing objective metadata.

**Risk:** Frontend shows stale/incorrect objective descriptions; validation logic breaks if objective keys drift between CLI and DB.

**Mitigation:** Add a sync job or webhook from the challenges repo. Add DB-level validation that objective counts match expectations.

---

## Medium Priority

### 5. No Audit Logging for Admin Operations

**Location:** `app/(admin)/` routes, `server/api/routers/`

Admin mutations (challenge creation/deletion, user management) are logged to PostHog as errors when they fail, but there's no audit trail for successful admin actions.

**Risk:** Inability to trace who changed what in the admin panel; compliance concerns.

---

### 6. `objectives` Stored as Untyped JSON

**Location:** `server/db/schema/challenge.ts` — `userSubmission.objectives: json`

Submission objectives are stored as `json` without a typed column. This means the database doesn't enforce the structure of `Objective[]`.

**Risk:** Schema drift between what's stored and what's expected by the frontend; silent data corruption.

**Mitigation:** Consider `jsonb` with a CHECK constraint, or migrate to a separate `submissionObjective` table.

---

### 7. OAuth Proxy Security Assumptions

**Location:** `lib/auth.ts` — `oAuthProxy()` plugin + `trustedOrigins`

The `trustedOrigins` wildcard `"https://*.vercel.app"` accepts all Vercel preview deployments as trusted origins. This is broad.

**Risk:** A malicious Vercel deployment could potentially exploit the proxy trust relationship.

---

### 8. Upstash Realtime Event Failures Are Silent

**Location:** Any component using `@upstash/realtime`

If Upstash Realtime is unavailable, real-time validation status updates will fail silently. The UI may show stale data without indicating an issue.

**Risk:** Users submit challenges and see no status update, unclear whether submission worked.

---

## Low Priority / Tech Debt

### 9. No Application-Level Tests

The test runner (Vitest) is configured but zero test files exist in the app source. Quality assurance relies entirely on TypeScript and Biome at commit time.

### 10. Mixed Language in DB Comments

Some database schema index comments are in French (e.g., `// Index pour le filtre par difficulté`). This is inconsistent with the English-language codebase.

### 11. Knip (Dead Code Detection) Not in CI

`pnpm knip` is available but not part of the CI/pre-commit pipeline. Dead exports and unused dependencies could accumulate undetected.

### 12. Blog Content Fully Managed by Notion

**Location:** `lib/` — Notion client (`@notionhq/client`)

Blog content depends on an external Notion workspace. If Notion API changes or access is revoked, the blog breaks entirely with no fallback.

---

## Performance Notes

- **Database indexes are well-considered** — composite indexes on common filter combinations (`challenge_theme_difficulty_idx`, `user_progress_user_status_challenge_idx`)
- **Neon serverless** cold starts can add latency on low-traffic routes — consider connection pooling config
- **No caching layer** on challenge listing queries — same DB queries on every page load

---
*Generated: 2026-03-18*
