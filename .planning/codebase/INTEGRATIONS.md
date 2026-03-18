# External Integrations

**Analysis Date:** 2025-03-18

## APIs & External Services

**OAuth & Social Authentication:**
- GitHub - User login via OAuth
  - SDK/Client: better-auth built-in
  - Auth: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
  - Callback: `/api/auth/callback/github`

- Google - User login via OAuth
  - SDK/Client: better-auth built-in
  - Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - Callback: `/api/auth/callback/google`

- Microsoft - User login via OAuth
  - SDK/Client: better-auth built-in
  - Auth: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`
  - Callback: `/api/auth/callback/microsoft`

**Content Management:**
- Notion - Blog content source via dataSources API (SDK v5+)
  - SDK/Client: @notionhq/client 5.12.0
  - Auth: `NOTION_INTEGRATION_TOKEN`
  - Configuration: `NOTION_BLOG_DATASOURCE_ID`, `NOTION_PEOPLE_DATASOURCE_ID`
  - Usage: `lib/notion.ts` fetches blog posts, authors, and categories
  - Features: Supports all block types (paragraphs, headings, code, tables, etc.)

## Data Storage

**Databases:**
- PostgreSQL (Neon serverless)
  - Connection: `DATABASE_URL` (Neon connection string with pooling)
  - Client: Drizzle ORM 0.45.1 via @neondatabase/serverless
  - Schema location: `server/db/schema/`
  - Schemas: auth.ts, challenge.ts

**File Storage:**
- Unsplash - External image CDN
  - Remote pattern: `images.unsplash.com`
  - Configuration: Allowed in Next.js image optimization
- AWS S3 - CDN for images
  - Remote patterns:
    - `*.s3.eu-central-1.amazonaws.com`
    - `*.s3.us-west-2.amazonaws.com`
  - Configuration: Allowed in Next.js image optimization
- Local filesystem - Static assets in `public/`

**Caching & Sessions:**
- Upstash Redis (optional)
  - Connection: REST API via `@upstash/redis`
  - Configuration: `KV_REST_API_URL`, `KV_REST_API_TOKEN`
  - Usage: Session caching via Better Auth, real-time events via Upstash Realtime
  - Fallback: Uses PostgreSQL for sessions if Redis not configured
  - Implementation: `lib/redis.ts` - Returns null if unconfigured, 5s timeout per request

## Authentication & Identity

**Auth Provider:**
- Better Auth 1.5.5 (replaces NextAuth)
  - Implementation: Server-side auth via `lib/auth.ts`
  - Session storage: PostgreSQL (Drizzle adapter)
  - OAuth plugins: GitHub, Google, Microsoft
  - Additional: API Key authentication, admin operations
  - API routes: `app/api/auth/[...all]/route.ts`
  - Hooks: User creation triggers Resend contact creation, account creation triggers PostHog signup tracking
  - OAuth Proxy: Enabled on Vercel deployments for preview URLs (via `oAuthProxy` plugin)
  - Trusted origins:
    - `http://localhost:3000` (dev)
    - `https://kubeasy.dev` (production)
    - `https://website-*-kubeasy.vercel.app` (Vercel preview deployments)

**User Data:**
- Resend contact ID stored on user record for email list management
- API Key support via @better-auth/api-key plugin

## Monitoring & Observability

**Error Tracking:**
- PostHog - Client & server-side error tracking
  - SDK: posthog-js 1.360.1 (client), posthog-node 5.28.1 (server)
  - Configuration: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
  - Server errors captured via: `instrumentation.ts` onRequestError hook, tRPC error middleware
  - Client errors captured via: Automatic uncaught exception capture (capture_exceptions: true)
  - Implementation: `lib/analytics-server.ts` for server-side tracking

**Logs:**
- OpenTelemetry OTLP (HTTP)
  - Provider: @opentelemetry/exporter-logs-otlp-http
  - Destination: PostHog at `https://eu.i.posthog.com/i/v1/logs`
  - Active on: Vercel deployments only (preview + production)
  - Fallback: console.* in local development
  - Implementation: `lib/logger.ts` with structured logging support
  - Resource attributes: service.name (kubeasy), service.version (git SHA), deployment.environment
  - Registration: `instrumentation.ts` sets global LoggerProvider

**Analytics:**
- PostHog - Product analytics
  - Client events: User signup, challenge started, challenge completed
  - Server events: Tracked via tRPC procedures and API routes
  - Disabled in development mode
  - Implementation: `lib/analytics-server.ts` and client-side `posthog.trackEvent()`

**Performance Monitoring:**
- Vercel Analytics 2.0.1 - Web Vitals tracking
  - Integration: `@vercel/analytics` in root layout

## CI/CD & Deployment

**Hosting:**
- Vercel
  - Primary deployment target
  - Support for: Preview deployments, production deployments
  - Environment detection: `process.env.VERCEL`, `process.env.VERCEL_ENV`
  - Preview URL pattern: `https://{branch-name}-kubeasy.vercel.app`

**CI Pipeline:**
- Not detected (likely uses Vercel's built-in deployment triggers)

## Environment Configuration

**Required env vars (server-side):**
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `BETTER_AUTH_SECRET` - Better Auth secret key
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` - GitHub OAuth
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` - Microsoft OAuth
- `RESEND_API_KEY` - Email service API key
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog API key
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog instance URL

**Optional env vars (server-side):**
- `KV_REST_API_URL` - Upstash Redis REST URL
- `KV_REST_API_TOKEN` - Upstash Redis token
- `NOTION_INTEGRATION_TOKEN` - Notion API integration token
- `NOTION_BLOG_DATASOURCE_ID` - Notion blog database ID
- `NOTION_PEOPLE_DATASOURCE_ID` - Notion people database ID
- `POSTHOG_PERSONAL_API_KEY` - PostHog CLI key (for next.config.ts)
- `POSTHOG_PROJECT_ID` - PostHog project ID (for next.config.ts)

**Secrets location:**
- `.env` file (local development, not committed)
- Vercel environment variables dashboard (production + preview)

## Webhooks & Callbacks

**Incoming:**
- Better Auth OAuth callbacks:
  - `/api/auth/callback/github`
  - `/api/auth/callback/google`
  - `/api/auth/callback/microsoft`
- PostHog rewrite endpoints:
  - `/ingest/static/:path*` → https://eu-assets.i.posthog.com/static/:path*
  - `/ingest/:path*` → https://eu.i.posthog.com/:path*

**Outgoing:**
- CLI submission webhook (`submitChallenge` tRPC endpoint):
  - Receives validation results from kubeasy-cli
  - Publishes validation events to Upstash Realtime (if configured)
  - Implementation: `server/api/routers/userProgress.ts`
- Demo session events via Upstash Realtime (if configured):
  - Channel: `demo:{token}` (Realtime channel)
  - Session storage: Upstash Redis with 24-hour TTL (key prefix: `demo:session:`)

## Real-time Communications

**Upstash Realtime (Optional):**
- Event types defined in `lib/realtime.ts`:
  - `validation.update` - Challenge objective validation results
  - `demo.started` - CLI demo initiation
  - `onboarding.stepCompleted` - User onboarding progress
- Channel naming: `{userId}:{challengeSlug}` for user-specific updates
- Implementation: `@upstash/realtime` with schema validation (Zod)
- Graceful degradation: Falls back to polling if Redis not configured

---

*Integration audit: 2025-03-18*
