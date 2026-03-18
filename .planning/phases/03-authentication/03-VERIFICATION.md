---
phase: 03-authentication
verified: 2026-03-18T17:00:00Z
status: passed
score: 10/10 must-haves verified
re_verification: false
human_verification:
  - test: "OAuth login flow end-to-end (GitHub, Google, Microsoft)"
    expected: "User can sign in via each OAuth provider and session cookie is set on .kubeasy.dev domain"
    why_human: "Requires live OAuth app credentials, browser redirect flow, and real network — cannot verify programmatically"
  - test: "Cross-subdomain cookie sharing between api.kubeasy.dev and kubeasy.dev"
    expected: "Session cookie set by api.kubeasy.dev is readable by kubeasy.dev (same .kubeasy.dev domain)"
    why_human: "Requires deployed staging environment with both subdomains configured — cannot verify in local dev"
  - test: "CLI Bearer token authentication end-to-end"
    expected: "Go CLI sends Authorization: Bearer <key> to POST /api/cli/challenges/:slug/submit and receives 200 with valid key"
    why_human: "Requires a valid API key created via web UI and a running CLI binary"
---

# Phase 3: Authentication Verification Report

**Phase Goal:** Implement authentication infrastructure — Better Auth with OAuth providers, cross-subdomain cookies, API key plugin for CLI auth, and user lifecycle BullMQ hook
**Verified:** 2026-03-18T17:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Better Auth config includes socialProviders for GitHub, Google, and Microsoft with correct redirectURI pointing to api.kubeasy.dev | VERIFIED | `apps/api/src/lib/auth.ts` lines 58-73: github, google, microsoft blocks each with `redirectURI: \`${process.env.API_URL ?? "http://localhost:3001"}/api/auth/callback/{provider}\`` |
| 2 | Cross-subdomain cookies are enabled for .kubeasy.dev domain | VERIFIED | `apps/api/src/lib/auth.ts` lines 45-50: `advanced.crossSubDomainCookies.enabled: true, domain: ".kubeasy.dev"` |
| 3 | apiKey() plugin is activated in Better Auth plugins array | VERIFIED | `apps/api/src/lib/auth.ts` lines 30-34: `apiKey({ rateLimit: { enabled: false } })` in plugins array alongside `admin()` |
| 4 | User signup dispatches a BullMQ job to the user-lifecycle queue (fire-and-forget) | VERIFIED | `apps/api/src/lib/auth.ts` lines 74-91: `databaseHooks.user.create.after` calls `userLifecycleQueue.add("user-signup", ...)` without await, error caught and logged but never thrown |
| 5 | CORS preflight for requests with User-Agent header succeeds | VERIFIED | `apps/api/src/app.ts` line 20: `allowHeaders: ["Content-Type", "Authorization", "User-Agent"]` |
| 6 | trustedOrigins no longer includes *.vercel.app wildcard | VERIFIED | `apps/api/src/lib/auth.ts` lines 18-23: trustedOrigins array contains only localhost:3000, localhost:3001, kubeasy.dev, api.kubeasy.dev — no vercel.app reference |
| 7 | CLI requests with valid API key are authenticated and user injected into Hono context | VERIFIED | `apps/api/src/middleware/api-key.ts`: full implementation with `auth.api.verifyApiKey`, DB lookup via `result.key.referenceId`, and `c.set("user", foundUser as SessionUser)` |
| 8 | CLI requests with missing or invalid API key receive 401 Unauthorized | VERIFIED | `apps/api/src/middleware/api-key.ts` lines 25-27, 31-33, 42-44: three distinct 401 return paths covering missing header, invalid key, and user not found |
| 9 | API key middleware is wired to CLI routes | VERIFIED | `apps/api/src/routes/cli/index.ts` line 8: `cli.use("/*", apiKeyMiddleware)` applied before route mounting |
| 10 | AUTH-06 is tracked as deferred to Phase 4 | VERIFIED | Documented in 03-02-PLAN.md line 264, 03-02-SUMMARY.md lines 33 and 85-103, 03-CONTEXT.md lines 67-68 |

**Score:** 10/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/jobs/src/queue-names.ts` | USER_LIFECYCLE queue name constant | VERIFIED | Line 4: `USER_LIFECYCLE: "user-lifecycle"` present alongside existing queue names |
| `packages/jobs/src/payloads.ts` | UserSignupPayload interface | VERIFIED | Lines 16-19: `export interface UserSignupPayload { userId: string; email: string; }` + included in JobPayload intersection (lines 25-27) |
| `packages/jobs/src/index.ts` | UserSignupPayload exported | VERIFIED | Line 5: `UserSignupPayload` in type export list |
| `apps/api/src/lib/auth.ts` | Full Better Auth config with OAuth, cookies, apiKey, hooks | VERIFIED | 93-line file with all required sections: socialProviders, crossSubDomainCookies, apiKey plugin, additionalFields, databaseHooks |
| `apps/api/src/app.ts` | CORS with User-Agent header | VERIFIED | Line 20: `"User-Agent"` in allowHeaders array; origin list synced with trustedOrigins |
| `apps/api/src/middleware/api-key.ts` | apiKeyMiddleware for CLI Bearer token validation | VERIFIED | 49-line file with full implementation: Bearer extraction, verifyApiKey call, referenceId-based DB lookup, user injection |
| `apps/api/src/routes/cli/index.ts` | CLI routes with apiKeyMiddleware applied | VERIFIED | Line 8: `cli.use("/*", apiKeyMiddleware)` before `cli.route("/challenges", submit)` |
| `apps/api/src/__tests__/auth.test.ts` | Test stubs for AUTH-01 behaviors | VERIFIED | 7 it.todo stubs covering Better Auth config and BullMQ hook behaviors |
| `apps/api/src/__tests__/oauth.test.ts` | Test stubs for AUTH-02, AUTH-04 | VERIFIED | 7 it.todo stubs covering OAuth providers, trustedOrigins, CORS |
| `apps/api/src/__tests__/cookie.test.ts` | Test stubs for AUTH-03 | VERIFIED | 3 it.todo stubs covering crossSubDomainCookies config |
| `apps/api/src/__tests__/api-key.test.ts` | Test stubs for AUTH-05 | VERIFIED | 8 it.todo stubs covering apiKeyMiddleware and CLI route wiring |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `apps/api/src/lib/auth.ts` | `@kubeasy/jobs` | `import createQueue, QUEUE_NAMES` | WIRED | Line 5: `import { createQueue, QUEUE_NAMES } from "@kubeasy/jobs"` + line 14: `createQueue(QUEUE_NAMES.USER_LIFECYCLE, redis.options)` |
| `apps/api/src/lib/auth.ts` | `apps/api/src/lib/redis.ts` | `redis.options` for BullMQ connection | WIRED | Line 8: `import { redis } from "./redis.js"` + line 14: `redis.options` (no fragile host/port extraction) |
| `apps/api/src/app.ts` | `hono/cors` | `allowHeaders` includes User-Agent | WIRED | Line 2: `import { cors } from "hono/cors"` + line 20: `"User-Agent"` in allowHeaders |
| `apps/api/src/middleware/api-key.ts` | `apps/api/src/lib/auth.ts` | `auth.api.verifyApiKey` | WIRED | Line 5: `import { auth } from "../lib/auth.js"` + line 29: `auth.api.verifyApiKey({ body: { key } })` |
| `apps/api/src/middleware/api-key.ts` | `apps/api/src/db/schema/auth.ts` | user table for DB lookup | WIRED | Line 4: `import { user as userTable } from "../db/schema/auth.js"` + line 36-40: `db.select().from(userTable).where(eq(userTable.id, result.key.referenceId))` |
| `apps/api/src/routes/cli/index.ts` | `apps/api/src/middleware/api-key.ts` | `apiKeyMiddleware` applied before routes | WIRED | Line 2: `import { apiKeyMiddleware } from "../../middleware/api-key.js"` + line 8: `cli.use("/*", apiKeyMiddleware)` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AUTH-01 | 03-00, 03-01 | Better Auth configured in apps/api with Drizzle adapter, mounted on GET/POST /api/auth/* | SATISFIED | auth.ts uses drizzleAdapter; app.ts mounts `auth.handler` on `/api/auth/**`; test stubs in auth.test.ts |
| AUTH-02 | 03-01 | GitHub, Google, Microsoft OAuth providers configured in Better Auth | SATISFIED | auth.ts lines 57-73: all three providers with clientId, clientSecret, redirectURI |
| AUTH-03 | 03-01 | @hono/cors configured before Better Auth handler with credentials: true and trusted origins | SATISFIED | app.ts: cors middleware at line 11 (before auth handler at line 32), credentials: true at line 22, all trusted origins listed |
| AUTH-04 | 03-01 | apiKey() Better Auth plugin enabled | SATISFIED | auth.ts line 30: `apiKey({ rateLimit: { enabled: false } })` in plugins array; @better-auth/api-key@1.5.5 in package.json |
| AUTH-05 | 03-02 | Hono middleware validates API keys (Authorization: Bearer) on CLI routes, injects user into c.var | SATISFIED | api-key.ts: full middleware implementation; routes/cli/index.ts: `cli.use("/*", apiKeyMiddleware)` |
| AUTH-06 | 03-02 | apps/web uses createAuthClient from Better Auth pointing to API URL | DEFERRED | Intentional — apps/web (TanStack Start) does not exist in Phase 3. Documented in 03-02-PLAN.md, 03-02-SUMMARY.md, and 03-CONTEXT.md. Moves to Phase 4. |

**Note on AUTH-06:** This requirement is marked complete in REQUIREMENTS.md but is not satisfied in Phase 3. It is an explicit, documented deferral agreed upon before execution began (see 03-CONTEXT.md lines 11, 67-68). Phase 4 is responsible for satisfying AUTH-06 when apps/web is scaffolded.

### Anti-Patterns Found

No blocker or warning anti-patterns found in modified files. Scanned:
- `apps/api/src/lib/auth.ts` — no TODOs, stubs, or placeholder returns
- `apps/api/src/app.ts` — no TODOs, stubs, or placeholder returns
- `apps/api/src/middleware/api-key.ts` — no TODOs, stubs, or placeholder returns
- `apps/api/src/routes/cli/index.ts` — no TODOs, stubs, or placeholder returns
- `packages/jobs/src/queue-names.ts` — no TODOs, stubs, or placeholder returns
- `packages/jobs/src/payloads.ts` — no TODOs, stubs, or placeholder returns

The test stub files (auth.test.ts, oauth.test.ts, cookie.test.ts, api-key.test.ts) contain `it.todo()` entries, which is their intended design — these are placeholder stubs to be implemented in a later quality phase, not implementation stubs.

### Human Verification Required

#### 1. OAuth Login Flow End-to-End

**Test:** Open browser, navigate to the web app login page, click "Sign in with GitHub" (or Google or Microsoft), complete OAuth flow
**Expected:** Successful redirect back to app, session cookie set with domain `.kubeasy.dev`, user record created in database
**Why human:** Requires live OAuth app credentials registered with each provider, browser-based redirect flow, and real network connectivity. Cannot verify by static analysis.

#### 2. Cross-Subdomain Cookie Accessibility

**Test:** On staging with both `api.kubeasy.dev` and `kubeasy.dev` deployed, sign in via `api.kubeasy.dev`, then open browser devtools on `kubeasy.dev` and inspect cookies
**Expected:** Session cookie (set by `api.kubeasy.dev`) is present and accessible on `kubeasy.dev` because domain is `.kubeasy.dev`
**Why human:** Requires a deployed staging environment with SSL and both subdomains live. Browser cookie domain policy cannot be validated via static analysis.

#### 3. CLI Bearer Token Authentication

**Test:** Create an API key via the web UI, then run the Go CLI with `Authorization: Bearer <key>` to POST /api/cli/challenges/:slug/submit
**Expected:** Server returns 200 with challenge submission result; invalid key returns 401
**Why human:** Requires a compiled CLI binary, a running API server, a valid API key in the database, and a matching challenge slug.

### Gaps Summary

No gaps. All automated checks passed. Phase 3 has successfully implemented:

1. **Better Auth OAuth infrastructure** — GitHub, Google, Microsoft socialProviders configured with correct redirectURIs pointing to `api.kubeasy.dev`
2. **Cross-subdomain cookies** — `advanced.crossSubDomainCookies` enabled for `.kubeasy.dev` domain
3. **API key plugin** — `apiKey()` activated in Better Auth plugins, `@better-auth/api-key@1.5.5` installed
4. **User lifecycle BullMQ hook** — Fire-and-forget job dispatched on user creation, using module-level `redis.options` singleton for BullMQ connection
5. **CORS with User-Agent** — CLI preflight requests accommodated by adding `User-Agent` to `allowHeaders`
6. **Synced trusted origins** — `trustedOrigins` and CORS `origin` list are identical; no `*.vercel.app` wildcard
7. **API key middleware** — `apiKeyMiddleware` validates Bearer tokens, looks up user via `result.key.referenceId`, injects into Hono context
8. **CLI route wiring** — `cli.use("/*", apiKeyMiddleware)` applied before all CLI route handlers
9. **AUTH-06 deferral** — Documented and tracked; apps/web does not exist in Phase 3

---

_Verified: 2026-03-18T17:00:00Z_
_Verifier: Claude (gsd-verifier)_
