# SEO Full Audit Report — kubeasy.dev

**Audit Date:** 2026-03-13
**Site:** https://kubeasy.dev
**Business Type:** SaaS / EdTech — Kubernetes learning platform
**Audited pages:** 48 (homepage, 16 challenges, 9 themes, 15 blog posts, core pages)

---

## Overall SEO Health Score: 59 / 100

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Technical SEO | 25% | 61 / 100 | 15.3 |
| Content Quality & E-E-A-T | 25% | 54 / 100 | 13.5 |
| On-Page SEO | 20% | 65 / 100 | 13.0 |
| Schema / Structured Data | 10% | 55 / 100 | 5.5 |
| Performance (Core Web Vitals) | 10% | 60 / 100 | 6.0 |
| Images | 5% | 70 / 100 | 3.5 |
| AI Search / GEO Readiness | 5% | 54 / 100 | 2.7 |
| **Total** | | | **59.5 / 100** |

---

## Top 5 Critical Issues

1. **`Disallow: /_next/*` in robots.txt** — blocks Googlebot from fetching all JavaScript bundles, degrading rendering fidelity across every page
2. **No Privacy Policy or Terms of Service pages** — the single largest E-E-A-T trust signal gap for a platform that collects OAuth tokens, sessions, and user progress data
3. **Schema spec violations** — relative URLs in `LearningResource`/`Course` schemas, invalid `applicationCategory`, missing `hasCourseInstance` on `Course`
4. **Homepage LCP is a client-rendered H1** — `HeroSection` is a client component; the H1 heading is not in the SSR HTML, pushing LCP past JS hydration
5. **No `llms.txt`** — AI crawlers have no guided entry point; content is invisible to AI-powered search assistants

## Top 5 Quick Wins

1. Remove `Disallow: /_next/*` from `robots.txt` (1 line, immediate crawlability gain)
2. Add `noindex` metadata export to `app/login/page.tsx` (5 min)
3. Fix relative URLs in `lib/seo.ts` — prepend `siteConfig.url` in `generateLearningResourceSchema()` and `generateCourseSchema()` (5 min, unblocks rich results)
4. Guard `ReactQueryDevtools` behind `process.env.NODE_ENV === 'development'` in `app/layout.tsx` (1 line, ~150KB production savings)
5. Create `/public/llms.txt` with site overview, blog post list, and challenge index (2 hours, immediate AI search benefit)

---

## 1. Technical SEO

**Score: 61 / 100**

### Crawlability

**[CRITICAL] `Disallow: /_next/*` blocks JavaScript assets from Googlebot**
`robots.txt` blocks `/_next/*`, which is where all Next.js JS bundles live (`/_next/static/chunks/`). Googlebot renders JavaScript — this rule prevents full rendering of every page.
- File: `public/robots.txt`
- Fix: Remove `Disallow: /_next/*`. If you want to block internal data routes, use `Disallow: /_next/data/*` only.

**[HIGH] robots.txt uses non-standard `Host:` directive**
The `Host:` directive is a Yandex-only extension; Google ignores it. Also, `http://www.kubeasy.dev` returns a 308 to `https://www.kubeasy.dev/` without confirming a further redirect to the apex domain — this creates a potential www/non-www split.
- Fix: Remove `Host:` from robots.txt. Confirm Vercel domain aliases redirect `www` to apex.

### Indexability

**[HIGH] `/login` page is indexable — no `noindex` directive**
`app/login/page.tsx` exports no metadata. Next.js applies the root layout's `robots: { index: true }`. The `Disallow` in robots.txt prevents crawling but not indexing of pre-discovered URLs.
- File: `app/login/page.tsx`
- Fix: Add `export const metadata = generateSEOMetadata({ noIndex: true })`

**[MEDIUM] Challenge `generateMetadata` returns `{}` on 404 path**
When a challenge slug is not found, the metadata function returns `{}` instead of `noIndex: true`, making thin/error pages indexable.
- File: `app/(main)/challenges/[slug]/page.tsx` line 53
- Fix: Return `generateSEOMetadata({ noIndex: true })` on not-found branch

**[MEDIUM] Blog pagination pages lack `rel="prev"` / `rel="next"` link elements**
`/blog?page=2` sets canonical to `/blog` (correct) but emits no `rel` link elements. This makes it harder for crawlers to understand the pagination relationship.
- File: `app/(main)/blog/page.tsx`

### Security Headers

**[MEDIUM] No Content-Security-Policy header**
All other headers are well-configured (HSTS preload, X-Frame-Options: DENY, referrer-policy, permissions-policy). CSP is the one gap.
- Fix: Add via `headers()` in `next.config.ts` or `vercel.json`

**[LOW] `Access-Control-Allow-Origin: *` on HTML pages**
Set by Vercel CDN on all responses. No direct SEO impact; worth reviewing if personalized content is ever served in the initial HTML.

### Core Web Vitals (structural signals)

**[HIGH] Above-fold `<Image>` components missing `priority` prop**
The featured blog card image on `/blog` and some above-fold images lack `priority`, so they load lazily despite being LCP candidates.
- Fix: Add `priority` to the first featured `BlogCard` image in `components/blog/blog-card.tsx`

**[MEDIUM] Skeleton heights may not match real card dimensions**
In `app/(main)/blog/page.tsx` lines 83–87, the Suspense fallback uses `h-72 sm:h-96`. If real cards render at different heights, CLS occurs.

**[MEDIUM] `ReactQueryDevtools` shipped to production**
`app/layout.tsx` renders `<ReactQueryDevtools>` unconditionally — ~150KB of devtools JS sent to every user.
- Fix: `{process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}`

### Structured Data (Technical perspective)

**[MEDIUM] `softwareVersion: "1.0.0"` hardcoded in SoftwareApplication schema**
Will go stale with every CLI release.
- File: `lib/seo.ts` line 133

**[LOW] `generateCourseSchema()` defined but never called**
Dead code in `lib/seo.ts`; the Course schema would be valuable on `/themes/[slug]` pages.

---

## 2. Content Quality & E-E-A-T

**Score: 54 / 100**

### Experience (12/20)
- CLI commands and the interactive terminal on homepage demonstrate genuine first-hand experience
- `ChallengeBookmark` component allows rich challenge embeds in blog posts — strong integration signal
- No user testimonials, community quotes, or verified community-scale signals anywhere

### Expertise (15/25)
- The validation system's six check types (status, log, event, metrics, rbac, connectivity) require real Kubernetes operational knowledge
- `LearningResource` schema uses correct `timeRequired` ISO 8601 format
- **Author type lacks credential fields** — `types/blog.ts` has only `name`, `bio`, `twitter`, `github`. No `role`, `certifications`, or `company`. Even if filled in Notion, the data model cannot express professional credentials

### Authoritativeness (10/25)
- Apache 2.0 open-source, GitHub and Twitter social links in Organization `sameAs`
- **No external citations** — no links to Kubernetes docs, CNCF, or third-party authority
- **No social proof numbers** — `stats-section.tsx` shows "100% Free", "Local", "Real", "5min" — all product attributes, not evidence of community scale
- `aggregateRating: undefined` in SoftwareApplication — no rich result eligibility

### Trustworthiness (17/30)

**[CRITICAL] No Privacy Policy or Terms of Service pages**
The app collects OAuth tokens, session cookies, user progress data, XP transactions, and email (Resend). No `/privacy` or `/terms` route exists in the entire `app/` directory. This is the most impactful single gap for E-E-A-T Trustworthiness.
- Footer links reference these pages but they don't exist

**[CRITICAL] `/get-started` page has no indexable prose content**
The page title and meta description target high-intent queries ("learn kubernetes free"), but the rendered page is a pure interactive widget with zero explanatory text. Google cannot rank it.
- File: `app/(main)/get-started/page.tsx`
- Fix: Add 400+ words of explanatory content above/below the demo widget

**[HIGH] `DEFAULT_AUTHOR` fallback masks authorship**
`lib/notion.ts` line 48–53 sets `DEFAULT_AUTHOR` to "Kubeasy Team" for posts with no Notion author relation. "Kubeasy Team" with a generic bio is the weakest possible attribution for technical troubleshooting content.

**[HIGH] Zero social proof on homepage**
No GitHub star count, user count, challenge completion count, or testimonials. The platform is described as "community driven" with no evidence of community scale.

**[HIGH] Release Notes category has 0 posts**
Visible, filterable category with no content creates a dead end and signals incomplete editorial commitment.

### AI Citation Readiness (38/100)

**[HIGH] No FAQ schema or question-based headings**
Every troubleshooting article answers a question. Headings are declarative ("Common Causes") rather than interrogative ("What Causes CrashLoopBackOff?"). FAQ schema + question-form H2/H3 is the highest-correlation structural change for AI Overviews.

**[HIGH] Articles are too short for reliable AI citation**
- CrashLoopBackOff: 366 words
- OOMKilled: 333 words
- ImagePullBackOff: 604 words
- Pod Pending: 842 words (best)
Optimal AI-citable passage: 134–167 words. Section-level passages average 45–105 words — too short to be self-contained.

**[MEDIUM] Word count calculation excludes code, lists, headings**
`blog/[slug]/page.tsx` lines 83–90 count only `paragraph` blocks, understating content depth by 30–50% for technical Kubernetes content heavy in code examples.

**[MEDIUM] Challenge linking is opt-in with no enforcement**
Authors must use a challenge URL in a paragraph with CTA keywords for the rich `ChallengeBookmark` card to render. No publication check enforces at least one challenge link per post.

---

## 3. Schema / Structured Data

**Score: 55 / 100**

### Schema Inventory

| Page Type | Implemented | Missing |
|---|---|---|
| All pages (global) | Organization, WebSite, SoftwareApplication | @id on entities |
| `/blog/[slug]` | BlogPosting | BreadcrumbList, FAQPage |
| `/challenges/[slug]` | LearningResource, BreadcrumbList | provider, image |
| `/themes/[slug]` | Course, BreadcrumbList | hasCourseInstance |
| `/challenges`, `/blog`, `/themes` listing pages | (global only) | ItemList, BreadcrumbList |

### Spec Violations (Blocks Rich Results)

**[CRITICAL] Relative URLs in `LearningResource` and `Course` schemas**
`generateLearningResourceSchema()` and `generateCourseSchema()` in `lib/seo.ts` set `url` to a relative path (e.g., `/challenges/pod-evicted`). Schema.org requires absolute URLs.
- Fix: Change to `` `${siteConfig.url}/challenges/${slug}` ``

**[CRITICAL] `applicationCategory: "DeveloperApplication"` is not a valid Schema.org value**
Valid values are strings from the iTunes taxonomy. Use `"Developer Tools"`.
- File: `lib/seo.ts`

**[HIGH] `Course` schema missing `hasCourseInstance`**
Google's Course rich result spec requires `hasCourseInstance` with a `CourseInstance` for rich result eligibility.

**[HIGH] `WebSite SearchAction.target` uses `EntryPoint` object**
Google's current spec requires a plain string URL template, not an `EntryPoint` wrapper.

```json
// Current (wrong)
"target": { "@type": "EntryPoint", "urlTemplate": "https://kubeasy.dev/challenges?search={search_term_string}" }

// Correct
"target": "https://kubeasy.dev/challenges?search={search_term_string}"
```

**[HIGH] `BlogPosting` schema has `timeRequired` property**
`timeRequired` is a `LearningResource` property, not a `BlogPosting` property. It will be silently ignored by Google.

**[HIGH] `SoftwareApplication` missing `url` property**
The application has no `url` linking to the npm page or dedicated landing page.

### Missing High-Value Schemas

**[MEDIUM] No BreadcrumbList on blog post pages**
BreadcrumbList displays in Google SERPs and is one of the easiest rich results to qualify for. Challenge detail pages have it; blog posts don't.

**[MEDIUM] No `@id` on Organization and WebSite schemas**
Without stable `@id` values (e.g., `https://kubeasy.dev/#organization`), Google cannot reliably disambiguate the entity across pages. Add `@id` to both global schemas and reference them from page-level schemas.

**[LOW] `aggregateRating: undefined` in SoftwareApplication source**
Should be removed from the source object entirely rather than explicitly set to `undefined`.

### Ready-to-Use Fix for SearchAction

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://kubeasy.dev/#website",
  "name": "Kubeasy",
  "url": "https://kubeasy.dev",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://kubeasy.dev/challenges?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

---

## 4. Sitemap

**Score: 82 / 100**

Overall: sitemap is valid and well-formed. All tested URLs return HTTP 200. No actual 404s.

**[MEDIUM] Blog category URLs use capitalized path segments**
Sitemap includes `/blog/category/Announcements`, `/blog/category/Troubleshooting`, etc. — capital letters in URL paths are fragile and non-canonical by web convention. Root cause: `encodeURIComponent(category)` in `app/sitemap.ts` line 101 preserves Notion's capitalized category names.
- Fix: Add `.toLowerCase()` before `encodeURIComponent` and ensure the route handler matches case-insensitively

**[LOW] Static page `lastmod` regenerates on every request**
`app/sitemap.ts` uses `new Date()` for the 5 static core pages and 4 category pages. Google will ignore lastmod it cannot trust. Use a stable hardcoded date or build-time timestamp.

**[LOW] Blog sitemap fetches max 100 posts — silent failure above that limit**
`getBlogPosts(1, null, 100)` will silently drop posts 101+ without error. Not urgent at 11 posts but becomes critical at scale.

**[INFO] `priority` and `changefreq` are ignored by Google**
Both fields can be removed to reduce XML size and maintenance overhead.

---

## 5. Performance / Core Web Vitals

**Score: 60 / 100**

### What's Well-Implemented
- Vercel edge CDN: TTFB 70ms (homepage), 76ms (blog) — excellent
- Umami analytics via stats.kubeasy.io — privacy-friendly and lightweight
- `next/image` with AVIF/WebP formats configured throughout
- Geist fonts preloaded via HTTP `Link` response headers — no render-blocking
- Static assets at `immutable` cache, 1-year TTL
- Header Suspense boundary uses height-matched skeleton

### Critical Issues

**[CRITICAL] `HeroSection` is a client component — H1 not in SSR HTML**
The H1 heading on the homepage is the most likely LCP element. Because `hero-section.tsx` is `"use client"`, it does not appear in the server-rendered HTML. LCP is delayed until after JS hydration.
- File: `components/hero-section.tsx`
- Fix: Split into a server component shell (H1, paragraph, CTA buttons) + dynamic client leaf nodes for `TypewriterText` and `InteractiveTerminal`
- Expected impact: LCP -300–800ms on slower connections

**[CRITICAL] Perpetual `setState` loops on the main thread**
`TypewriterText` schedules a new `setTimeout` on every render (80–150ms interval), creating a continuous feedback loop: timeout fires → setState → render → new timeout → repeat. `InteractiveTerminal` drives 50ms-interval updates during command typing. Together they generate ~10 React renders/second on the homepage, indefinitely, competing with all user interactions.
- Files: `components/typewriter-text.tsx`, `components/interactive-terminal.tsx`
- Fix: Rewrite with CSS animations where possible; use `useRef` to track state without re-render loops; throttle to `requestAnimationFrame`

### High Issues

**[HIGH] `ReactQueryDevtools` shipped to all production users (~150KB)**
`app/layout.tsx` renders `<ReactQueryDevtools>` unconditionally.
- Fix: `{process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}`

**[HIGH] `full-logo.png` is 100KB in `/public/`**
Images in `/public/` bypass Next.js image optimization. If this image is used in any render path, it contributes ~100KB of unoptimized weight.

### Medium Issues

**[MEDIUM] Featured blog card image lacks `priority`**
The first (featured) blog post card on `/blog` is above the fold but uses no `priority` prop, so it loads lazily.
- File: `components/blog/blog-card.tsx`

**[MEDIUM] `ChallengesView` has bare `<div>Loading...</div>` Suspense fallback**
If the challenge grid loads at a different height than the fallback, measurable CLS results.
- File: `components/challenges-view.tsx` line 63

---

## 6. GEO / AI Search Readiness

**Score: 54 / 100**

### AI Crawler Access
All AI crawlers (GPTBot, ClaudeBot, PerplexityBot, anthropic-ai) are implicitly allowed via `User-Agent: *`. No explicit rules. Functional but not optimized.

### Critical Gaps

**[CRITICAL] `llms.txt` does not exist**
`https://kubeasy.dev/llms.txt` returns 404. This is the primary signal for LLM crawlers to understand site content and prioritize indexing. At 11 blog posts and 16 challenges, an `llms.txt` is low-effort and high-impact.

Sample structure for `/public/llms.txt`:
```
# Kubeasy
> Free, open-source platform for learning Kubernetes through hands-on troubleshooting challenges.

## Troubleshooting Guides
- https://kubeasy.dev/blog/kubernetes-crashloopbackoff-debug : Diagnose and fix CrashLoopBackOff errors
- https://kubeasy.dev/blog/kubernetes-oomkilled-fix : Fix OOMKilled pod terminations
- https://kubeasy.dev/blog/kubernetes-pod-pending-fix : Troubleshoot pods stuck in Pending state
- https://kubeasy.dev/blog/kubernetes-imagepullbackoff-fix : Fix ImagePullBackOff errors
- https://kubeasy.dev/blog/kubernetes-service-not-reachable : Debug unreachable Kubernetes services

## Challenges
- https://kubeasy.dev/challenges/pod-evicted : Easy — fix a pod being evicted due to resource constraints
- https://kubeasy.dev/challenges/first-job : Easy — create your first Kubernetes Job

## Author
Paul Brissaud — DevOps/Platform Engineer, creator of Kubeasy
```

**[HIGH] No FAQ schema — highest-correlation AI Overview signal**
Every troubleshooting post answers specific questions. Headings are declarative ("Common Causes") not interrogative ("What Causes CrashLoopBackOff?"). FAQ schema + question-form headings is the single highest-ROI structural change for Google AI Overviews and Bing Copilot.

**[HIGH] Core troubleshooting articles are too short for reliable citation**
- CrashLoopBackOff: 366 words (minimum target: 800)
- OOMKilled: 333 words (minimum target: 800)
Optimal AI-citable passage: 134–167 words. Current section-level passages: 45–105 words.

**[HIGH] No YouTube channel**
YouTube mention correlation with ChatGPT citation: 0.737 (strongest known signal). Zero video presence is the largest multi-modal gap.

### Platform Scores

| Platform | Score | Key Gap |
|---|---|---|
| Google AI Overviews | 48/100 | No FAQ schema, thin word counts |
| ChatGPT web citations | 38/100 | No llms.txt, no YouTube, weak entity graph |
| Perplexity | 52/100 | Good SSR + schema, but passages too short |
| Bing Copilot | 55/100 | BlogPosting schema helps; needs FAQ |

### Entity Establishment
- Organization schema present with GitHub + Twitter `sameAs` — partial
- No Wikipedia/Wikidata entity
- Author (Paul Brissaud) consistently attributed across all articles — good
- Author has no `Person` schema with `knowsAbout` or Kubernetes credentials (CKA/CKAD)
- No LinkedIn in `sameAs` for either Organization or Person

---

## 7. On-Page SEO Summary

**Score: 65 / 100**

### What's Working
- Homepage: Strong, focused title and meta description targeting "learn Kubernetes"
- Challenge pages: Titles follow `[Challenge Name] - Kubernetes Challenge | Kubeasy` pattern — descriptive and keyword-rich
- Blog posts: Descriptive titles with clear intent alignment (troubleshooting, concepts, comparisons)
- H1 tags: Present and unique on all pages
- Internal linking: Challenge Bookmark component enables rich blog-to-challenge links

### Gaps
- `/challenges` listing: ~40 words of body text — minimal prose for a key category page
- `/blog` listing: Thin prose; mostly UI chrome around post cards
- No external outbound links to authoritative sources (Kubernetes docs, CNCF)
- No `rel="prev"` / `rel="next"` on paginated blog
- Meta descriptions on listing pages are generic and don't include numbers or specifics

---

## Appendix: Source Files Referenced

| File | Issues |
|---|---|
| `public/robots.txt` | `/_next/*` block, non-standard `Host:`, www redirect |
| `app/sitemap.ts` | `new Date()` for lastmod, category casing, 100-post limit |
| `app/layout.tsx` | ReactQueryDevtools unconditional, 3 separate JSON-LD scripts |
| `app/login/page.tsx` | Missing noindex metadata |
| `app/(main)/get-started/page.tsx` | No indexable prose content |
| `app/(main)/challenges/[slug]/page.tsx` | Empty `{}` metadata on 404 |
| `app/(main)/blog/page.tsx` | Missing rel=prev/next, skeleton height mismatch |
| `app/(main)/blog/[slug]/page.tsx` | `timeRequired` invalid on BlogPosting, no BreadcrumbList, word count undercounts |
| `lib/seo.ts` | Relative URLs in schemas, invalid `applicationCategory`, missing SearchAction fix, no hasCourseInstance |
| `lib/notion.ts` | DEFAULT_AUTHOR fallback, `isNotionConfigured` guard |
| `types/blog.ts` | Author type missing credential fields |
| `components/hero-section.tsx` | Full client component — LCP risk |
| `components/typewriter-text.tsx` | Perpetual setState loop — INP risk |
| `components/interactive-terminal.tsx` | 50ms setState loop — INP risk |
| `components/providers.tsx` | RealtimeProvider on every page |
| `components/challenges-view.tsx` | Bare Loading... Suspense fallback |
| `components/blog/blog-card.tsx` | Missing `priority` on featured card image |
| `components/stats-section.tsx` | No social proof — product attributes only |
| `config/site.ts` | `softwareVersion` hardcoded |
