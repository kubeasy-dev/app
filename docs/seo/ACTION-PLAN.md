# SEO Action Plan — kubeasy.dev

**Generated:** 2026-03-13
**Overall Score:** 59 / 100
**Target Score:** 78 / 100 (after completing Critical + High items)

---

## Critical — Fix Immediately

### C1. Remove `Disallow: /_next/*` from robots.txt
**Impact:** Crawlability — affects every page on the site
**File:** `public/robots.txt`
**Effort:** 2 minutes

```diff
- Disallow: /_next/*
```

Googlebot fetches JavaScript from `/_next/static/chunks/`. Blocking it prevents full rendering of all pages.

---

### C2. Create Privacy Policy and Terms of Service pages
**Impact:** E-E-A-T Trustworthiness — the largest single trust gap
**Files:** Create `app/(legal)/privacy/page.tsx` and `app/(legal)/terms/page.tsx`
**Effort:** 2–4 hours

The app collects OAuth tokens, session cookies, user progress, and email addresses (Resend integration). Without these pages, every page on the site scores lower on Google's quality rater guidelines. Link them from the footer.

---

### C3. Fix relative URLs in LearningResource and Course schemas
**Impact:** Blocks rich results for all 16 challenge pages and 9 theme pages
**File:** `lib/seo.ts`
**Effort:** 5 minutes

```typescript
// generateLearningResourceSchema() — change:
url: `/${url}`,
// to:
url: `${siteConfig.url}/challenges/${url}`,

// generateCourseSchema() — same fix for the url field
url: `${siteConfig.url}/themes/${url}`,
```

---

### C4. Split HeroSection into server shell + client leaf nodes
**Impact:** LCP -300–800ms on slower connections
**File:** `components/hero-section.tsx`
**Effort:** 2–3 hours

The H1 heading is inside a `"use client"` component and doesn't appear in SSR HTML. Move the H1, paragraph, and CTA buttons to a server component. Load `TypewriterText` and `InteractiveTerminal` as dynamic client-only leaf nodes:

```tsx
// New: hero-section.tsx (server component)
export function HeroSection() {
  return (
    <section>
      <h1>Build it. Fix it. Learn Kubernetes.</h1>
      <p>...</p>
      <HeroCTAs />
      <DynamicTerminal /> {/* client-only, below fold initially */}
    </section>
  )
}
```

---

### C5. Create `/public/llms.txt`
**Impact:** AI search readiness — immediate benefit for ChatGPT, Perplexity, Claude
**Effort:** 2 hours

```
# Kubeasy
> Free, open-source Kubernetes learning platform. Hands-on troubleshooting challenges in a local cluster.

## Troubleshooting Guides
- https://kubeasy.dev/blog/kubernetes-crashloopbackoff-debug : Diagnose and fix CrashLoopBackOff errors
- https://kubeasy.dev/blog/kubernetes-oomkilled-fix : Fix OOMKilled pod terminations
- https://kubeasy.dev/blog/kubernetes-pod-pending-fix : Troubleshoot pods stuck in Pending state
- https://kubeasy.dev/blog/kubernetes-imagepullbackoff-fix : Fix ImagePullBackOff errors
- https://kubeasy.dev/blog/kubernetes-service-not-reachable : Debug unreachable Kubernetes services
- https://kubeasy.dev/blog/kubernetes-service-types-explained : ClusterIP vs NodePort vs LoadBalancer explained
- https://kubeasy.dev/blog/kubernetes-probes-explained : Liveness, Readiness & Startup probes guide

## Challenges (hands-on exercises)
- https://kubeasy.dev/challenges/pod-evicted : Easy — fix a pod being evicted due to resource constraints
- https://kubeasy.dev/challenges/first-job : Easy — create your first Kubernetes Job
- https://kubeasy.dev/challenges : Full list of 16 challenges

## Author
Paul Brissaud — DevOps/Platform Engineer, creator of Kubeasy — https://twitter.com/paulbrissaud

## Sitemap
https://kubeasy.dev/sitemap.xml
```

---

## High — Fix Within 1 Week

### H1. Add `noindex` to the login page
**File:** `app/login/page.tsx`
**Effort:** 5 minutes

```typescript
export const metadata: Metadata = generateSEOMetadata({
  noIndex: true,
})
```

---

### H2. Fix `generateMetadata` returning `{}` on challenge 404 path
**File:** `app/(main)/challenges/[slug]/page.tsx` line 53
**Effort:** 5 minutes

```typescript
// Change:
return {}
// To:
return generateSEOMetadata({ noIndex: true })
```

---

### H3. Guard ReactQueryDevtools behind dev-only check
**File:** `app/layout.tsx`
**Effort:** 5 minutes

```tsx
{process.env.NODE_ENV === 'development' && (
  <ReactQueryDevtools initialIsOpen={false} />
)}
```

Saves ~150KB of production JS for every user.

---

### H4. Fix schema spec violations in `lib/seo.ts`

**Effort:** 30 minutes total. All in `lib/seo.ts`:

**a) Fix `SearchAction.target`** (blocks Sitelinks Search Box eligibility):
```typescript
// Change:
target: {
  "@type": "EntryPoint",
  urlTemplate: `${siteConfig.url}/challenges?search={search_term_string}`,
},
// To:
target: `${siteConfig.url}/challenges?search={search_term_string}`,
```

**b) Fix `applicationCategory`** (invalid value):
```typescript
// Change:
applicationCategory: "DeveloperApplication",
// To:
applicationCategory: "Developer Tools",
```

**c) Add `url` to SoftwareApplication**:
```typescript
url: "https://www.npmjs.com/package/@kubeasy-dev/kubeasy-cli",
```

**d) Add `hasCourseInstance` to Course schema** (required for Course rich results):
```typescript
hasCourseInstance: {
  "@type": "CourseInstance",
  courseMode: "online",
  courseWorkload: "PT30M",
  inLanguage: "en",
},
```

**e) Remove `timeRequired` from BlogPosting schema** (not a valid property — in `blog/[slug]/page.tsx`):
Remove the `timeRequired` field from the inline JSON-LD on blog post pages.

**f) Add `@id` to Organization and WebSite schemas**:
```typescript
// Organization
"@id": `${siteConfig.url}/#organization`,

// WebSite
"@id": `${siteConfig.url}/#website`,
```

---

### H5. Add BreadcrumbList schema to blog post pages
**File:** `app/(main)/blog/[slug]/page.tsx`
**Effort:** 20 minutes

Call `generateBreadcrumbSchema()` from `lib/seo.ts` with the blog post breadcrumb trail and inject it as a second JSON-LD script tag alongside BlogPosting. This enables breadcrumb display in Google SERPs.

---

### H6. Add at least 400 words of prose to `/get-started`
**File:** `app/(main)/get-started/page.tsx`
**Effort:** 1 hour

The page targets high-intent queries ("learn kubernetes free") but has zero indexable text content — only an interactive widget. Add an explanation above the demo: what the user will learn, what skill is demonstrated, what happens next. This is the minimum viable content for the page to rank.

---

### H7. Fix perpetual setState loops in TypewriterText and InteractiveTerminal
**Files:** `components/typewriter-text.tsx`, `components/interactive-terminal.tsx`
**Effort:** 3–4 hours

Both components run continuous `setTimeout`-driven React renders indefinitely, generating ~10 renders/second and competing with all user interactions (INP).

Options:
1. Replace `TypewriterText` with a CSS-only animation (`@keyframes` steps) for the typing effect — zero JS overhead
2. For `InteractiveTerminal`, use `useRef` to manage animation state without triggering re-renders; schedule updates via `requestAnimationFrame` instead of `setTimeout`
3. Add `document.addEventListener('visibilitychange')` to pause animations when tab is hidden

---

### H8. Add FAQ schema and question-based headings to top 3 troubleshooting posts
**Target posts:** CrashLoopBackOff, OOMKilled, Pod Pending
**Effort:** 2 hours per article (content + schema)

Convert declarative H2/H3 headings to interrogative form:
- "Common Causes" → "What Causes CrashLoopBackOff in Kubernetes?"
- "Step-by-Step Troubleshooting" → "How Do I Debug a CrashLoopBackOff?"

Add `FAQPage` JSON-LD to each post with 4–6 Q&A pairs drawn from the existing content. This is the highest-correlation structural change for Google AI Overviews.

---

### H9. Scope RealtimeProvider to only routes that need it
**File:** `components/providers.tsx`
**Effort:** 1 hour

Move `<RealtimeProvider>` out of the global `Providers` component. Add it only to the layouts that actually need real-time features (challenge detail, dashboard).

---

## Medium — Fix Within 1 Month

### M1. Expand core troubleshooting articles to 800–1,200 words
**Target posts:** CrashLoopBackOff (366w), OOMKilled (333w), ImagePullBackOff (604w)
**Effort:** 1 day per article

Per article, add:
- A "Real-World Example" narrative paragraph (150–200 words)
- One cited statistic from CNCF Survey or Datadog State of Kubernetes report
- Expand each "Solutions by Cause" block to be self-contained (100–150 words each)
- A "When to Escalate" section

---

### M2. Add social proof to homepage
**File:** `components/stats-section.tsx`
**Effort:** 2–4 hours

Replace the four product-attribute cards ("100% Free", "Local", "Real", "5min") with verifiable social proof. Options:
- GitHub stars count (via `https://api.github.com/repos/kubeasy-dev/kubeasy-cli` at build time)
- Total challenges started (aggregate query from database)
- "X developers learning" with a real number
- 1–2 testimonial quotes from GitHub Issues or Discord

---

### M3. Add `rel="prev"` / `rel="next"` to paginated blog
**File:** `app/(main)/blog/page.tsx`
**Effort:** 30 minutes

Use Next.js `alternates` metadata:
```typescript
alternates: {
  ...(page > 1 && { prev: `/blog?page=${page - 1}` }),
  ...(hasNextPage && { next: `/blog?page=${page + 1}` }),
},
```

---

### M4. Normalize blog category URLs to lowercase
**File:** `app/sitemap.ts` line 101, `app/(main)/blog/category/[category]/`
**Effort:** 30 minutes

```typescript
// Change:
url: `${baseUrl}/blog/category/${encodeURIComponent(category)}`
// To:
url: `${baseUrl}/blog/category/${encodeURIComponent(category.toLowerCase())}`
```

Ensure the route handler also normalizes the slug parameter to lowercase.

---

### M5. Add `priority` to first featured blog card image
**File:** `components/blog/blog-card.tsx`
**Effort:** 15 minutes

Add `priority` prop to the `<Image>` in the featured (large) blog card variant. This is the likely LCP element on `/blog`.

---

### M6. Add Content-Security-Policy header
**File:** `next.config.ts` or `vercel.json`
**Effort:** 2–4 hours (testing required)

Start with report-only mode to avoid breaking the site:
```
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline' https://stats.kubeasy.io; connect-src 'self' https://stats.kubeasy.io;
```

---

### M7. Fix static page `lastmod` in sitemap
**File:** `app/sitemap.ts`
**Effort:** 15 minutes

Replace `new Date()` for the 5 static core pages with a stable date constant or the `VERCEL_GIT_COMMIT_SHA` environment variable mapped to a timestamp.

---

### M8. Add `HowTo` schema to the homepage "How It Works" section
**File:** `lib/seo.ts`, `app/(main)/page.tsx`
**Effort:** 30 minutes

The "From zero to Kubernetes hero in 6 simple steps" section is a canonical `HowTo` pattern. The 6 named steps with CLI commands map directly to `HowToStep` items.

---

### M9. Add explicit AI crawler rules to robots.txt
**File:** `public/robots.txt`
**Effort:** 10 minutes

```
User-Agent: GPTBot
Allow: /

User-Agent: OAI-SearchBot
Allow: /

User-Agent: ClaudeBot
Allow: /

User-Agent: PerplexityBot
Allow: /
```

Signals intent and may improve crawl priority by AI search engines.

---

### M10. Add ItemList schema to challenge and blog listing pages
**Files:** `app/(main)/challenges/page.tsx`, `app/(main)/blog/page.tsx`
**Effort:** 1 hour

Generate an `ItemList` with each challenge/post as a `ListItem`. This allows AI crawlers to discover all content from a single structured data entry point.

---

### M11. Add Author credential fields to the data model
**File:** `types/blog.ts`
**Effort:** 1 hour (code) + populate in Notion

Add `role`, `company`, and `certifications` fields to the `Author` type. For Kubernetes content, "Platform Engineer with CKA certification" is a primary Expertise signal.

---

### M12. Fix ChallengesView Suspense fallback
**File:** `components/challenges-view.tsx` line 63
**Effort:** 30 minutes

Replace `<div>Loading...</div>` with a dimensioned skeleton that approximates the challenge grid layout to prevent CLS.

---

## Low — Backlog

- **L1.** Remove `Host:` directive from `robots.txt` — non-standard, ignored by Google
- **L2.** Confirm Vercel apex-only configuration — verify `https://www.kubeasy.dev` redirects to `https://kubeasy.dev`
- **L3.** Implement `generateCourseSchema()` on `/themes/[slug]` — the function exists in `lib/seo.ts` but is never called
- **L4.** Merge three JSON-LD script tags in `app/layout.tsx` into one `@graph` array
- **L5.** Remove `aggregateRating: undefined` from SoftwareApplication schema source
- **L6.** Convert `logo` in Organization schema from bare string to `ImageObject`
- **L7.** Pull `softwareVersion` from package.json at build time rather than hardcoding `"1.0.0"`
- **L8.** Add pagination safeguard in sitemap — increase post limit from 100 to 500 or add a loop
- **L9.** Implement IndexNow — ping `api.indexnow.org` on new content publication for faster Bing indexation
- **L10.** Expand the Kubeasy vs Killercoda comparison post from 352 to 1,200+ words
- **L11.** Add an About page explaining team, project origin, and motivation
- **L12.** Populate the Release Notes category with at least one post
- **L13.** Add LinkedIn to Organization `sameAs` and Author `sameAs` in schemas
- **L14.** Generate per-article Open Graph images using Next.js `ImageResponse` in `opengraph-image.tsx`
- **L15.** Audit and remove/convert `full-logo.png` (100KB PNG in `/public/` bypassing optimization)
- **L16.** Start a YouTube channel with 5-minute walkthroughs of the top troubleshooting scenarios (highest-correlation ChatGPT citation signal: 0.737)

---

## Score Projection

| Phase | Actions | Projected Score |
|---|---|---|
| Baseline | Current state | 59 / 100 |
| After Critical | C1–C5 | ~68 / 100 |
| After High | H1–H9 | ~76 / 100 |
| After Medium | M1–M12 | ~83 / 100 |
| After Low | L1–L16 | ~88 / 100 |
