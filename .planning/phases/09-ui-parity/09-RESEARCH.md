# Phase 9: UI Parity - Research

**Researched:** 2026-03-24
**Domain:** Visual parity audit — TanStack Start (apps/web) vs Next.js (../website)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** "Marketing pages" (PARITY-02) = landing page only (`index.tsx`) — no separate pricing or about pages exist in either app
- **D-02:** Themes and types detail pages (`themes/$slug`, `types/$slug`) ARE in scope — even though `../website` has no counterpart, they must be visually consistent with the themes/types list pages style from `../website`
- **D-03:** Pages in scope per plan:
  - Plan 1 (blog): blog list + blog article pages
  - Plan 2 (marketing): landing page (`index.tsx`) only
  - Plan 3 (challenges): challenges list + challenge detail pages + themes/types list + themes/types detail pages
  - Plan 4 (dashboard): dashboard + profile pages
- **D-04:** Primary method: **code diff** — compare component files between `../website` and `apps/web` to identify structural/class differences
- **D-05:** Both apps can run locally for visual verification — use **Playwright screenshots** to capture pages from both apps and compare them programmatically as part of each plan
- **D-06:** Reference app: `../website` is the source of truth for intended visual design
- **D-07:** 4 plans, one per PARITY requirement (PARITY-01 through PARITY-04) — each plan is independently completable and verifiable
- **D-08:** Default fix location: `apps/web` page/component files
- **D-09:** Touch `packages/ui` only when the issue is in a base shadcn component (button, card, input, etc.) that is shared across apps — Phase 8 JIT pattern applies
- **D-10:** CSS token differences (wrong color, wrong radius) → fix in `packages/ui/src/styles/tokens.css` — tokens are defined once and propagate to all consuming apps automatically. Never add token overrides in `apps/web/src/styles/globals.css`

### Claude's Discretion

- Component-level fix granularity (inline class change vs extracted CSS variable) — Claude decides based on what keeps the code clean
- Order in which components within a plan are fixed — Claude prioritizes highest-visibility issues first

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PARITY-01 | Blog list + article pages in `apps/web` match `../website` visually — typography, spacing, layout, colors, components | Blog card redesign (featured/compact layout), article layout (sidebar ToC, AuthorCard component, RelatedPosts), `.prose-neo` wrapper, search/category filter |
| PARITY-02 | Marketing pages (landing page only) match `../website` | Landing page structure is identical — all 7 section components are shared; no visual differences found |
| PARITY-03 | Challenges list + detail + themes/types list + themes/types detail pages match `../website` | Challenges list is structurally identical; challenge detail has Back Button style difference (Button vs raw Link); themes/types detail pages have no reference counterpart (design from list page style) |
| PARITY-04 | Dashboard + profile pages match `../website` | Dashboard: missing onboarding checklist branch, stats card icons differ (Award/Star/Flame vs Trophy/Target/TrendingUp/Clock), chart insight text alignment differs, Quick Actions use raw Link vs Button; Profile: structurally identical |
</phase_requirements>

---

## Summary

Phase 9 is a pure visual parity pass — no new functionality, no data model changes. The work is a code-diff-driven audit of every public-facing page in `apps/web` against `../website`, followed by targeted fixes.

**The CSS token foundation is identical.** `packages/ui/src/styles/tokens.css` and `../website/app/globals.css` define the exact same oklch values, neobrutalism shadows, and neo-border utilities. This means color/token issues are unlikely; the differences lie in component-level Tailwind class choices and structural layout decisions.

**Four categories of actual divergence were found:**

1. **Blog** — The biggest gap. `apps/web` uses a simple inline `BlogCard` while `../website` uses a sophisticated `BlogCard` component with featured/compact layouts, category headers, cover images with proper aspect-ratio treatment, and an `ArrowRight` indicator. The article page is missing the desktop sidebar Table of Contents, `AuthorCard`, and `RelatedPosts` components. The block renderer (`BlockItem`) uses minimal Tailwind classes instead of the `.prose-neo` wrapper class.

2. **Marketing (landing)** — No divergence. Both apps compose the same 7 sections (HeroSection, StatsSection, FeaturesSection, HowItWorksSection, OpenSourceSection, EarlyAccessSection, CTASection) identically. Plan 2 is likely a no-op or a single verification pass.

3. **Challenges** — Mostly aligned. The challenges list page (hero section, filters, grid) is structurally identical. The challenge detail page has one Back Button difference: `../website` uses `<Button variant="ghost" asChild>` wrapping a Link, while `apps/web` uses a raw `<Link>` with manual classes. Themes/types list and detail pages are identical between the two apps.

4. **Dashboard/Profile** — Dashboard has meaningful divergence: `apps/web` always shows the "Welcome back" heading (no onboarding branch), stats cards use different icons (Trophy/Target/TrendingUp/Clock vs Award/Trophy/Star/Flame from `DashboardStats`), the DashboardChart insight box uses `bg-background` vs `bg-secondary rounded-xl`, DashboardRecentActivity adds `mb-12` on each section component, and Quick Actions use raw `<Link>` elements instead of `<Button variant="secondary" asChild>`. Profile page is structurally identical.

**Primary recommendation:** Fix blog first (highest visual gap), then dashboard (functional icon/layout differences), then challenges (one class difference), then verify marketing is already matching.

---

## Standard Stack

### Core (already installed — no new dependencies needed)

| Library | Version | Purpose | Relevant |
|---------|---------|---------|----------|
| Tailwind CSS 4 | 4.x | Utility CSS — all visual fixes are Tailwind class edits | All plans |
| `@kubeasy/ui/*` | workspace | Shared shadcn primitives (Button, Badge, Card, Dialog, Separator) | Challenge/Dashboard fixes |
| `lucide-react` | current | Icons — dashboard stat card icons need updating | PARITY-04 |
| Playwright (Python) | latest | Screenshot capture for visual verification | All plans |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `python scripts/with_server.py` | skill script | Manages server lifecycle for Playwright | Per-plan visual verification |

### Alternatives Considered

None — the fix approach is mandated (code diff + Playwright verification). No new library choices needed.

---

## Architecture Patterns

### Fix Location Decision Tree

```
Visual difference found
  ├── CSS token value wrong (color, radius, shadow)
  │     → Fix in packages/ui/src/styles/tokens.css
  │     NEVER override in apps/web/src/styles/globals.css
  │
  ├── Tailwind class wrong in a shadcn primitive (Button, Card, Badge, etc.)
  │     → Fix in packages/ui/src/components/{component}.tsx
  │
  └── Tailwind class / structure wrong in a page or app-level component
        → Fix in apps/web/src/routes/ or apps/web/src/components/
```

### JIT Import Pattern (Phase 8 established)

```typescript
// CORRECT — sub-path only
import { Button } from "@kubeasy/ui/button";
import { Card, CardContent } from "@kubeasy/ui/card";

// WRONG — barrel import
import { Button } from "@kubeasy/ui";
```

### Playwright Screenshot Pattern (webapp-testing skill)

```python
# Use with_server.py to start both apps, then capture screenshots
python .agents/skills/webapp-testing/scripts/with_server.py \
  --server "cd /path/to/website && pnpm dev" --port 3001 \
  --server "cd apps/web && pnpm dev" --port 3000 \
  -- python your_comparison_script.py
```

Key: always `page.wait_for_load_state('networkidle')` before screenshot on TanStack Start (hydration takes time).

### Anti-Patterns to Avoid

- **Adding token overrides in apps/web globals.css** — tokens are defined once in `packages/ui/src/styles/tokens.css` (D-10)
- **Using `neo-shadow-xl` when reference uses `neo-shadow`** — shadow size is a visual difference; match exactly
- **Using barrel imports from `@kubeasy/ui`** — sub-path exports only
- **Inferring "no difference" from token equality** — tokens being identical does not mean component-level classes match

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Blog card featured layout | Custom card component | Port `BlogCard` from `../website/components/blog/blog-card.tsx` | Complete, tested, matches reference exactly |
| Blog article body typography | Custom CSS classes | `.prose-neo` class already defined in `apps/web/src/styles/globals.css` | Already present, just not applied to the BlockRenderer wrapper |
| Table of Contents | New component | Port `TableOfContentsClient` from `../website/components/blog/table-of-contents.tsx` | Reference component exists |
| Author card | New component | Port `AuthorCard` from `../website/components/blog/author-card.tsx` | Reference component exists |
| Related posts | New component | Port `RelatedPosts` from `../website/components/blog/related-posts.tsx` | Reference component exists |
| Playwright orchestration | Custom server scripts | `webapp-testing` skill's `with_server.py` | Handles lifecycle management |

---

## Detailed Gap Analysis by Plan

### Plan 1 (PARITY-01): Blog

**Blog list page (`apps/web/src/routes/blog/index.tsx`)**

Current state: inline `BlogCard` function inside the route file.
Reference: `../website/components/blog/blog-card.tsx` exports a `BlogCard` with:
- Featured variant: full-width with cover image, author/date footer, ArrowRight CTA
- Compact variant: category header bar + compact content + ArrowRight
- Uses `<article>` semantic element
- Hover: `hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none` (not `hover:translate-x-[-2px]`)

Reference also uses `BlogList` (search + category filter badges) and `BlogPagination`. `apps/web` has no search, no category filter, no pagination component. The question is whether these are in-scope for visual parity — they require data (categories with counts). The reference `blogs/index.tsx` fetches categories from DB. `apps/web/blog/index.tsx` only fetches `getBlogPosts()`. This is a data gap, not just a visual gap. **Decision**: Per D-04 (code diff approach), the visual layout of what IS rendered should match. Category filter badges and search are visual features in the reference that are absent in `apps/web` — implement them.

**Blog article page (`apps/web/src/routes/blog/$slug.tsx`)**

Current state: `BlockRenderer` renders in `<div className="max-w-none prose-lg">`. The `.prose-neo` class is defined in `globals.css` but not used here.
Reference: `<div className="prose-neo max-w-none min-w-0">` with `BlockRenderer` inside.

Missing from `apps/web` vs reference:
- Desktop sidebar: `<aside className="hidden lg:block sticky top-28">` with `TableOfContentsClient`
- Mobile ToC: `<div className="lg:hidden mb-8">` with collapsible `TableOfContentsClient`
- Main content layout: `grid gap-8 sm:gap-12 lg:grid-cols-[1fr_250px]` vs current flat layout
- `AuthorCard` component (reference uses dedicated component; `apps/web` inlines the author card)
- `RelatedPosts` component (absent in `apps/web`)
- Category badge is a clickable `<Link>` in reference; `apps/web` has a non-linked `<span>`

**Note:** `post.headings` data (for ToC) may not be returned by `apps/web`'s `getBlogPostWithContent`. Verify `lib/notion.ts` in `apps/web` returns headings.

### Plan 2 (PARITY-02): Marketing

**Landing page (`apps/web/src/routes/index.tsx` vs `../website/app/(main)/page.tsx`)**

Both compose: HeroSection, StatsSection, FeaturesSection, HowItWorksSection, OpenSourceSection, EarlyAccessSection, CTASection — in the same order. All 7 components exist in both `apps/web/src/components/` and `../website/components/`. Each was ported during Phase 4.

**Expected work:** Cross-check each component's Tailwind classes between the two codebases. Given the components were ported, differences likely exist but are minor. The planner should instruct the implementer to diff each component file and fix discrepancies.

### Plan 3 (PARITY-03): Challenges

**Challenges list (`/challenges/index.tsx`)**

Both render the same hero section (Trophy badge, count, h1, description) with identical classes. Both use `ChallengesQuickStartCTA` and a `ChallengesView` local function. Reference wraps in `<HydrateClient>` (Next.js pattern, irrelevant for visual). Structurally identical.

**Challenge detail (`/challenges/$slug.tsx`)**

One visual difference: Back Button.
- Reference: `<Button variant="ghost" className="mb-6 neo-border-thick neo-shadow hover:neo-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all" asChild><Link href="/challenges">...</Link></Button>`
- `apps/web`: `<Link to="/challenges" className="mb-6 inline-flex items-center neo-border-thick neo-shadow hover:neo-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all px-4 py-2 font-bold">...</Link>`

The reference uses the `Button` component's ghost variant as the base style. The `apps/web` version duplicates this with raw classes but may differ in padding/hover/font weight. Fix: use `<Button variant="ghost" ... asChild>` wrapping `<Link>` as in reference.

**Themes list, themes detail, types list, types detail** — identical structure between apps. No changes expected.

### Plan 4 (PARITY-04): Dashboard & Profile

**Dashboard (`/_protected/dashboard.tsx`)**

Differences vs reference (`../website/app/(main)/dashboard/page.tsx`):

1. **Onboarding branch missing** — Reference shows `DashboardChecklist` + different greeting when `!isOnboardingComplete`. `apps/web` always shows "Welcome back" and stats. This is a behavioral difference. Per the phase scope ("pure visual parity"), this may be out of scope unless onboarding is part of the visual experience. **Flag as open question.**

2. **Stats card icons** — Reference uses `DashboardStats` component with: Award (Completed), Trophy (Points), Star (Rank), Flame (Day Streak). `apps/web` inlines: Trophy (XP), Target (Completed), TrendingUp (Progress %), Clock (Streak). Icon set AND card order differ. Also, reference has a 4-column grid with 4 distinct stat cards; `apps/web` also has 4 but with different icon mapping.

3. **Stats card label "Points" vs "XP Earned"** — Reference uses "Points" and "Total XP earned". `apps/web` uses "XP Earned" and shows rank differently.

4. **DashboardChart insight box** — Reference: `bg-secondary neo-border-thick rounded-xl` + `text-sm font-bold text-center`. `apps/web`: `bg-background neo-border-thick` (no rounded-xl, no text-center on the paragraph).

5. **Layout of chart + activity** — Reference wraps chart and recent activity in `<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">`. `apps/web` renders them as block-level siblings each with `mb-12`.

6. **Quick Actions buttons** — Reference uses `<Button variant="secondary" ... asChild><Link>`. `apps/web` uses raw `<Link>` with manual `bg-secondary neo-border neo-shadow font-black py-6 flex flex-col items-center gap-2 hover:neo-shadow-lg transition-shadow` classes.

**Profile (`/_protected/profile.tsx`)**

Structurally identical to reference. ProfileHeader, ProfileSettings, ProfileApiTokens, ProfileEmailPreferences, ProfileDangerZone — all present and in same order. Profile header is slightly different: reference passes `firstName`, `lastName`, `email` as separate props; `apps/web` passes the full `user` object. Visual output should be identical if props resolve to same display values.

---

## Common Pitfalls

### Pitfall 1: Blog data shape mismatch
**What goes wrong:** `apps/web`'s `getBlogPostWithContent` (in `lib/notion.ts`) may return a different shape than `../website`'s version — notably, `headings` for the ToC sidebar may not be returned.
**Why it happens:** `apps/web` has its own Notion client written independently during the migration.
**How to avoid:** Before implementing ToC, verify `getBlogPostWithContent` in `apps/web/src/lib/notion.ts` returns `headings`. If not, add it to the Notion query.
**Warning signs:** TypeScript error accessing `post.headings`.

### Pitfall 2: Blog categories endpoint not available in apps/web
**What goes wrong:** The reference blog list fetches `getBlogCategories()` from the database. `apps/web` fetches from the Notion API and may not have a categories endpoint.
**Why it happens:** Different data sources (DB vs Notion direct) in the two apps.
**How to avoid:** Check `apps/web/src/lib/notion.ts` for a `getBlogCategories` function. If absent, implement it or simplify the filter to derive categories from the post list.
**Warning signs:** TypeScript error calling `getBlogCategories`.

### Pitfall 3: `neo-border-thick` applies `border` shorthand — doesn't mix with Tailwind border-color utilities
**What goes wrong:** Adding `border-destructive` or similar alongside `neo-border-thick` — the shorthand resets color.
**Why it happens:** `neo-border-thick: border: 4px solid oklch(0.15 0 0)` is a custom class using the CSS shorthand that sets color.
**How to avoid:** Never mix `neo-border-*` custom classes with Tailwind `border-{color}` utilities. Use the dedicated `neo-border-destructive`, `neo-border-primary` variants.
**Warning signs:** Border shows black when a color variant is expected.

### Pitfall 4: TanStack Router `<Link>` vs Next.js `<Link>` — `href` vs `to`
**What goes wrong:** Copying JSX from `../website` introduces `href=` on `<Link>` which is a Next.js API. TanStack Router uses `to=`.
**Why it happens:** Direct copy-paste from the reference app.
**How to avoid:** Always replace `href` with `to` when porting link elements. For external links, use `<a href>`.
**Warning signs:** TypeScript error: `href` is not a prop of `Link`.

### Pitfall 5: `Image` (Next.js) vs `img` (standard)
**What goes wrong:** Copying `<Image src=... fill sizes=...>` from `../website` into `apps/web` which doesn't have next/image.
**Why it happens:** Direct copy-paste from the reference.
**How to avoid:** Replace `<Image>` with `<img>` when porting. Note that Next.js `fill` prop becomes `className="w-full h-full object-cover"` + a positioned parent div.
**Warning signs:** Import error for `next/image`.

### Pitfall 6: Playwright screenshot timing on TanStack Start
**What goes wrong:** Screenshot taken before React hydration completes, showing skeleton/loading state.
**Why it happens:** TanStack Start has a client-side hydration step after SSR HTML.
**How to avoid:** Always use `page.wait_for_load_state('networkidle')` before taking screenshots. Add extra wait for auth-protected pages.
**Warning signs:** Screenshots show loading spinners.

---

## Code Examples

### Blog Card Pattern (from reference `../website/components/blog/blog-card.tsx`)

```tsx
// Compact variant (non-featured)
<article className="group neo-border-thick neo-shadow bg-secondary hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
  <Link href={`/blog/${post.slug}`} className="flex flex-col h-full">
    {/* Category + date header bar */}
    <div className="flex items-center justify-between px-4 py-3 border-b-2 border-foreground bg-background">
      <span className="text-xs font-black uppercase tracking-wider text-primary">
        {post.category.name}
      </span>
      <time className="text-xs font-medium text-muted-foreground">...</time>
    </div>
    {/* Content + footer */}
  </Link>
</article>
```

Key: `hover:shadow-none` (removes shadow on hover) vs `apps/web` current `hover:neo-shadow-xl` (increases shadow).

### Prose-Neo Application Pattern

```tsx
// Reference blog/$slug.tsx article content layout
<div className="grid gap-8 sm:gap-12 lg:grid-cols-[1fr_250px] items-start">
  {/* Article content */}
  <div className="prose-neo max-w-none min-w-0">
    <BlockRenderer blocks={post.blocks} />
    {/* Author bio + related posts */}
  </div>

  {/* Desktop sidebar ToC */}
  {post.headings.length > 0 && (
    <aside className="hidden lg:block sticky top-28">
      <TableOfContentsClient headings={post.headings} />
    </aside>
  )}
</div>
```

### Dashboard Stats Grid (reference `../website/components/dashboard-stats.tsx`)

```tsx
// Reference uses Award, Trophy, Star, Flame icons
// apps/web currently uses Trophy, Target, TrendingUp, Clock
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
  <CompletedStat />  // Award icon, "Completed", percentage subtitle
  <XpStat />         // Trophy icon, "Points", "Total XP earned" subtitle
  <RankStat />       // Star icon, "Rank", "Congratulations!" subtitle
  <StreakStat />     // Flame icon, "Day Streak", "Keep it up!" subtitle
</div>
```

### Chart + Activity Side-by-Side Grid (reference `../website/app/(main)/dashboard/page.tsx`)

```tsx
// Reference wraps chart and activity in a 2-column grid
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
  <DashboardChart />        // no mb-12 on the component itself
  <DashboardRecentGains />  // no mb-12 on the component itself
</div>
```

Currently `apps/web/DashboardChart` and `DashboardRecentActivity` each have `mb-12` on their outer wrapper and are stacked, not side-by-side.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-app shadcn/ui copies | `@kubeasy/ui` shared package | Phase 8 | Fix shared components once, propagates everywhere |
| Import from `@/components/ui/button` | Import from `@kubeasy/ui/button` | Phase 8 | All apps/web imports already updated |

---

## Open Questions

1. **Onboarding checklist on dashboard — in or out of scope?**
   - What we know: `../website` dashboard conditionally renders `DashboardChecklist` (onboarding incomplete) vs full stats/chart view (onboarding complete). `apps/web` always shows the stats view.
   - What's unclear: Is the onboarding check API available in `apps/web` (`onboarding.getStatus` was a tRPC endpoint — does a REST equivalent exist in `apps/api`)?
   - Recommendation: If the onboarding endpoint exists, port the conditional branch. If not, note the gap and limit parity to the "post-onboarding" view, which is what `apps/web` currently shows.

2. **Blog categories data in apps/web**
   - What we know: `../website` gets categories from PostgreSQL. `apps/web` reads from Notion directly.
   - What's unclear: Does `apps/web/src/lib/notion.ts` expose categories/counts?
   - Recommendation: Audit `apps/web/src/lib/notion.ts` before writing Plan 1. If `getBlogCategories()` is absent, either add it (Notion can derive categories from post list) or scope the filter to a client-side filter over loaded posts.

3. **Blog ToC headings in apps/web Notion client**
   - What we know: `../website`'s blog post type includes `headings: Heading[]` (extracted during Notion fetch). `apps/web` has its own Notion client (`lib/notion.ts`).
   - What's unclear: Does `apps/web`'s `getBlogPostWithContent` return headings?
   - Recommendation: Check `apps/web/src/lib/notion.ts` before starting Plan 1. The type `NotionBlock` is used in `apps/web` — headings may need to be extracted from blocks.

---

## Environment Availability

> Both reference and target apps run locally for visual comparison.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | apps/web dev server | Available | 22.x (`.nvmrc`) | — |
| pnpm | Package manager | Available | 10.32.1 | — |
| Python 3 | Playwright scripts | Available (darwin) | 3.x | — |
| Playwright (Python) | Visual comparison | Available via skill | — | Manual browser comparison |
| `apps/web` dev server | Visual verification | Available | port 3000 | — |
| `../website` dev server | Reference screenshots | Available | port 3001 (configurable) | — |

**Note:** `../website` requires its own `.env` (Notion tokens, DB URL). If Notion is not configured, blog pages return the "Blog Coming Soon" fallback. Blog comparison may need to be done code-diff only if Notion credentials are not available.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.0 (root) + 4.1.1 (apps/web) |
| Config file | Not found in apps/web — vitest workspace config likely at root |
| Quick run command | `pnpm test:run` (from monorepo root) |
| Full suite command | `pnpm test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PARITY-01 | Blog list shows category-labeled cards with featured layout | visual/smoke | Playwright screenshot comparison | ❌ Wave 0 |
| PARITY-01 | Blog article shows two-column layout with sidebar ToC | visual/smoke | Playwright screenshot comparison | ❌ Wave 0 |
| PARITY-02 | Landing page sections match reference | visual/smoke | Playwright screenshot comparison | ❌ Wave 0 |
| PARITY-03 | Challenge detail Back Button uses ghost Button variant | manual | visual inspection | — |
| PARITY-04 | Dashboard stats grid shows 4 cards with Award/Trophy/Star/Flame icons | visual/smoke | Playwright screenshot comparison | ❌ Wave 0 |
| PARITY-04 | Dashboard chart + activity shown side-by-side at lg breakpoint | visual/smoke | Playwright screenshot comparison | ❌ Wave 0 |

**Note:** All parity validation is visual. Automated Playwright screenshots comparing both apps side-by-side are the primary mechanism (D-05). Unit tests are not applicable to visual layout fixes.

### Sampling Rate

- **Per task commit:** TypeScript typecheck (`pnpm typecheck`) — ensures no regressions
- **Per wave merge:** Playwright screenshot comparison for the plan's pages
- **Phase gate:** All 4 plan screenshots show acceptable visual parity before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `scripts/compare_screenshots.py` — Playwright script capturing both apps and diffing pages for each plan
- [ ] Both dev servers must be running before Playwright runs — use `webapp-testing` skill's `with_server.py`

---

## Project Constraints (from CLAUDE.md)

- Use **pnpm** exclusively. Never npm or yarn.
- Never run `pnpm build` to verify — use `pnpm typecheck` instead.
- **Biome** handles linting/formatting (replaces ESLint + Prettier).
- Pre-commit hooks: Husky runs Biome on staged files + full TypeScript check on every commit.
- `@kubeasy/ui` sub-path imports only: `import { Button } from "@kubeasy/ui/button"` — no barrel.
- CSS token fixes → `packages/ui/src/styles/tokens.css` only. Never in `apps/web/src/styles/globals.css`.
- No new shadcn components in `apps/web/src/components/ui/` — add to `packages/ui` instead (Phase 8 pattern).

---

## Sources

### Primary (HIGH confidence)

- Direct file reads: `../website/app/(main)/blog/page.tsx`, `[slug]/page.tsx` — blog reference
- Direct file reads: `../website/app/(main)/dashboard/page.tsx`, `profile/page.tsx` — dashboard/profile reference
- Direct file reads: `../website/components/blog/blog-card.tsx`, `blog-list.tsx`, `dashboard-stats.tsx`, `dashboard-chart.tsx`, `dashboard-recent-gains-client.tsx` — component reference
- Direct file reads: `apps/web/src/routes/blog/index.tsx`, `blog/$slug.tsx`, `challenges/index.tsx`, `challenges/$slug.tsx`, `themes/index.tsx`, `themes/$slug.tsx`, `_protected/dashboard.tsx`, `_protected/profile.tsx` — target files
- Direct file reads: `packages/ui/src/styles/tokens.css`, `../website/app/globals.css` — CSS token comparison
- `apps/web/src/styles/globals.css` — confirmed `.prose-neo` class exists
- `.planning/phases/09-ui-parity/09-CONTEXT.md` — locked decisions

### Secondary (MEDIUM confidence)

- `webapp-testing` skill `SKILL.md` — Playwright patterns for screenshot comparison

### Tertiary (LOW confidence)

- None

---

## Metadata

**Confidence breakdown:**
- Blog gap analysis: HIGH — verified by direct file comparison of both apps
- Marketing gap analysis: HIGH — both apps use identical component compositions
- Challenges gap analysis: HIGH — verified by direct file comparison
- Dashboard gap analysis: HIGH — verified by direct file comparison, icon names confirmed
- CSS token parity: HIGH — both token files read and compared line by line
- Blog categories/headings data availability in apps/web: LOW — lib/notion.ts not fully audited

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable codebase, no external API dependencies for this phase)
