# AaaS Knowledge Index — Implementation Plan

> **Status: ALL 14 PHASES COMPLETE**
> Last updated: 2026-03-12

**Goal:** Transform the static blog (aaas-blog.web.app) into the most extensive, autonomously functioning agentic knowledge index with 15 self-healing agents, real-time entity discovery, auto-approval pipeline, page view analytics, entity comparison, and full CI/CD automation.

**Architecture:** Firestore-backed entity database with typed data access layer. Next.js 14 with server rendering via Firebase App Hosting. Shared `@aaas/ui` design system. Self-healing agent scripts run via `tsx` CLI on scheduled GitHub Actions.

**Tech Stack:** Next.js 14, TypeScript, Firestore (firebase-admin for agents, client SDK for reads), Tailwind CSS via @aaas/ui, JSON-LD for structured data, Firebase App Hosting, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-03-10-aaas-knowledge-index-design.md`

---

## Phase 1: Data Layer, Components, Pages, API (COMPLETE)

- [x] **Task 1:** Entity type definitions (`lib/types.ts`) — BaseEntity, 6 typed variants, EntityScores, ENTITY_TYPES
- [x] **Task 2:** Channel definitions (`lib/channels.ts`) — 10 topic channels with helpers
- [x] **Task 3:** Firebase client setup (`lib/firebase.ts`) — client SDK init
- [x] **Task 4:** Data access layer (`lib/entities.ts`) — getEntity, getEntitiesByType, getEntitiesByChannel, getTrending, getRecent, getAllSlugs
- [x] **Task 5:** Seed data (`seed/seed-data.ts`) — 11 representative entities across all types
- [x] **Task 5b:** Seed script (`seed/run-seed.ts`) — firebase-admin seeder
- [x] **Task 5c:** Firestore indexes (`firestore.indexes.json`) — composite indexes for all query patterns
- [x] **Task 6:** JSON-LD schema generators (`lib/schemas.ts`) — per-type structured data
- [x] **Task 7:** Entity card component (`components/entity-card.tsx`)
- [x] **Task 8:** Entity page components — header, schema table, scores, relations, JSON-LD injector
- [x] **Task 9:** Entity page template (`components/entity-page.tsx`) + all 6 type pages
- [x] **Task 10:** Navigation overhaul (`components/index-navbar.tsx`) — explore, leaderboard, listen, submit, dashboard
- [x] **Task 11:** Homepage rewrite — trending, channels grid, latest additions, CTA
- [x] **Task 12:** Channel listing pages (`channel/[topic]/page.tsx`)
- [x] **Task 13:** Explore page with entity type filter
- [x] **Task 14:** Clean up old blog files (data.ts, [slug] pages, blog-navbar)
- [x] **Task 15:** Next.js config — removed static export for server rendering
- [x] **Task 16:** Read-only API routes — GET /api/entities, GET /api/entity/:type/:slug
- [x] **Task 17:** Firebase config update for App Hosting
- [x] **Task 18:** Placeholder pages — leaderboard, listen, submit, dashboard, author profiles
- [x] **Task 19:** Footer expansion — 4-column knowledge index footer
- [x] **Task 20:** Final verification — build passes, all routes working

---

## Phase 2: Leaderboards, Submissions, Profiles, Dashboard (COMPLETE)

- [x] **Task 1:** Extended types — Persona (5 variants with channel mappings), RegisteredAgent, EntitySubmission
- [x] **Task 2:** Extended data layer — getLeaderboard, getEntitiesByAgent, getAgent, getEntitiesForChannels
- [x] **Task 3:** Leaderboard page — category tabs, TrendingCard top-5, expandable score breakdowns, ScoreBar
- [x] **Task 4:** Leaderboard API — GET /api/leaderboard/:category with validation
- [x] **Task 5:** Submission API — POST /api/submit with x-api-key auth, field validation
- [x] **Task 6:** Submit documentation page — API reference, curl examples, error responses, schema reference
- [x] **Task 7:** Author/agent profile pages — trust score, contributions, expertise badges
- [x] **Task 8:** Dashboard (/me) — persona selector, localStorage persistence, channel-based recommendations
- [x] **Task 9:** Navbar updates — added Submit, Dashboard, Listen links

---

## Phase 3: Audio/Media Pipeline (COMPLETE)

- [x] **Task 1:** Media types (`lib/media-types.ts`) — Episode, AudioFormat, MediaJob interfaces
- [x] **Task 2:** TTS provider interface (`lib/tts.ts`) — TTSProvider with synthesize/listVoices, StubTTSProvider
- [x] **Task 3:** Script generators (`lib/media.ts`) — narration, digest, podcast script generation
- [x] **Task 4:** Listen page — server component + ListenClient with format tabs, episode cards, sticky player bar
- [x] **Task 5:** Episodes API — GET /api/episodes with format filter and limit
- [x] **Task 6:** Coming Soon state — 3-format description cards when no episodes exist

---

## Phase 4: Self-Healing Agent System (COMPLETE)

- [x] **Task 1:** Agent logger (`agents/logger.ts`) — firebase-admin init, Firestore agent_logs collection
- [x] **Task 2:** Schema auditor (`agents/schema-auditor.ts`) — completeness scoring, healing queue flagging
- [x] **Task 3:** Schema healer (`agents/schema-healer.ts`) — auto-fill missing fields, retry logic
- [x] **Task 4:** Link validator (`agents/link-validator.ts`) — HEAD/GET requests, broken link tracking
- [x] **Task 5:** Freshness agent (`agents/freshness-agent.ts`) — 30-day stale detection
- [x] **Task 6:** Ranking agent (`agents/ranking-agent.ts`) — citation counting, composite score recalculation
- [x] **Task 7:** Media agent (`agents/media-agent.ts`) — placeholder episode generation
- [x] **Task 8:** Ingestion agent (`agents/ingestion-agent.ts`) — curated source discovery, 20/day cap
- [x] **Task 9:** CLI runner (`agents/runner.ts`) — dependency-ordered execution, consecutive failure alerting
- [x] **Task 10:** npm scripts — agent:audit, agent:heal, agent:rank, etc. via tsx

---

## Phase 5: Infrastructure & Automation (COMPLETE)

- [x] **Task 1:** Firestore security rules — submissions (public write), episodes/agents (public read), internal collections (deny)
- [x] **Task 2:** Firestore indexes — 30+ composite indexes for all query patterns
- [x] **Task 3:** Dynamic sitemap (`sitemap.ts`) — static pages, channels, all entity slugs
- [x] **Task 4:** robots.txt — allow all, disallow /api/
- [x] **Task 5:** RSS feed (GET /api/feed) — RSS 2.0 XML with 20 recent entities
- [x] **Task 6:** Search API (GET /api/search) — text search, type/channel filters, sort options
- [x] **Task 7:** Dynamic OG images (/og) — edge runtime, type-colored accents, composite score display
- [x] **Task 8:** OG images wired into all 6 entity types + layout + Twitter cards
- [x] **Task 9:** Enhanced /explore page — search bar, type tabs, channel dropdown, sort options
- [x] **Task 10:** GitHub Actions: scheduled agent runs (daily/weekly cron, failure alerting via GitHub issues)
- [x] **Task 11:** GitHub Actions: blog deploy workflow (push to main triggers build + deploy)
- [x] **Task 12:** RSS feed linked via alternates in layout metadata
- [x] **Task 13:** Build verification — all phases compile, 37+ pages generated

---

## Phase 6: Autonomous Systems & Real Data Pipeline (COMPLETE)

- [x] **Task 1:** Real TTS pipeline (`lib/tts.ts`) — Google Cloud TTS, ElevenLabs, stub auto-detection
- [x] **Task 2:** Enrichment agent (`agents/enrichment-agent.ts`) — npm, GitHub, HuggingFace API enrichment
- [x] **Task 3:** Categorization agent (`agents/categorization-agent.ts`) — keyword-based channel assignment
- [x] **Task 4:** Changelog agent (`agents/changelog-agent.ts`) — diff-based entity change tracking with snapshots
- [x] **Task 5:** Webhook agent (`agents/webhook-agent.ts`) — HMAC-SHA256 signed delivery with exponential backoff
- [x] **Task 6:** Digest email agent (`agents/digest-email-agent.ts`) — weekly HTML digest, SendGrid/Resend integration
- [x] **Task 7:** Dashboard page (`/dashboard`) — system health, agent status, entity health, media stats
- [x] **Task 8:** Episode detail page (`/listen/[id]`) — audio player, transcript, source link
- [x] **Task 9:** Subscribe page + API (`/subscribe`, `/api/subscribe`, `/api/unsubscribe`)
- [x] **Task 10:** Webhook CRUD API (`/api/webhooks`, `/api/webhooks/[id]`)
- [x] **Task 11:** Podcast RSS feed (`/api/podcast`) — iTunes namespace
- [x] **Task 12:** Dashboard stats API (`/api/dashboard/stats`)
- [x] **Task 13:** Entity changelog API (`/api/entity/[type]/[slug]/changelog`)
- [x] **Task 14:** Firestore rules + indexes for all new collections
- [x] **Task 15:** Seed episodes script (`seed/seed-episodes.ts`)
- [x] **Task 16:** Updated runner with all 12 agents in dependency order

---

## Phase 7: Production-Grade Autonomous Pipeline (COMPLETE)

- [x] **Task 1:** Real ingestion agent — GitHub Search API, HuggingFace Models API, arXiv API with XML parsing
- [x] **Task 2:** Auto-review agent (`agents/auto-review-agent.ts`) — validates and auto-approves submissions (score ≥70/100)
- [x] **Task 3:** Views agent (`agents/views-agent.ts`) — aggregates page views into engagement scores, 30-day cleanup
- [x] **Task 4:** Entity comparison page (`/compare`) — side-by-side scores, field diffs, capabilities Venn overlap
- [x] **Task 5:** Interactive submit form (`submit/submit-form.tsx`) — client-side form + existing API docs
- [x] **Task 6:** Entity changelog display (`components/entity-changelog.tsx`) — collapsible timeline on entity pages
- [x] **Task 7:** Page view tracking (`/api/track` + `page-tracker.tsx`) — fire-and-forget beacon, atomic counters
- [x] **Task 8:** PageTracker component in root layout for site-wide tracking
- [x] **Task 9:** Updated runner with 15 agents (added auto-review, views) in dependency order
- [x] **Task 10:** Updated GitHub Actions workflow for new agents (daily + weekly schedules)
- [x] **Task 11:** Dashboard agent labels updated for all 15 agents
- [x] **Task 12:** Navbar + homepage updated with Compare link, Subscribe link
- [x] **Task 13:** Firestore rules + indexes for page_views and page_view_counts collections

---

## Phase 8: Intelligence & Discoverability Layer (COMPLETE)

- [x] **Task 1:** Score history tracking — ranking agent writes `score_history` subcollection, `/api/entity/[type]/[slug]/history` API, `ScoreHistoryChart` component with SVG sparklines on entity pages
- [x] **Task 2:** Entity health badge API (`/api/badge/[type]/[slug]`) — SVG shields.io-style badges, color-coded by score (green ≥70, yellow ≥40, red <40), metric selection via query param
- [x] **Task 3:** Bulk export API (`/api/export`) — JSON and CSV download, type filtering, proper Content-Disposition headers
- [x] **Task 4:** Admin review queue (`/admin/review`) — API-key-gated admin page, submission approve/reject, categorization suggestion accept/dismiss, PATCH APIs for status updates
- [x] **Task 5:** Trending detection agent (`agents/trending-agent.ts`) — compares current scores against entity snapshots, flags ≥15 point changes, dedup within 7 days, writes to `trending_alerts` collection
- [x] **Task 6:** `/api/trending` endpoint — serves recent trending alerts
- [x] **Task 7:** Entity relationship graph (`/graph`) — pure SVG force-directed visualization, spring-based physics simulation, type-colored nodes, pan/zoom, type filter, clickable nodes linking to entity pages
- [x] **Task 8:** Updated runner with 16 agents (added trending) in dependency order
- [x] **Task 9:** Dashboard agent labels updated for all 16 agents including trending
- [x] **Task 10:** GitHub Actions workflow updated — trending added to daily core agents
- [x] **Task 11:** Navbar updated with Graph link
- [x] **Task 12:** Firestore rules for trending_alerts collection (public read)
- [x] **Task 13:** Admin API routes — `/api/admin/submissions`, `/api/admin/suggestions`, `/api/admin/suggestions/[id]`, `/api/submit/[id]` (GET + PATCH)

---

## Phase 9: Intelligence & Developer Experience Layer (COMPLETE)

- [x] **Task 1:** Similarity agent (`agents/similarity-agent.ts`) — computes pairwise entity similarity using shared tags, capabilities, integrations, category, type, and related entities. Writes top 5 per entity to `entity_similarities` collection
- [x] **Task 2:** Similar entities API (`/api/entity/[type]/[slug]/similar`) — serves pre-computed similarity data
- [x] **Task 3:** SimilarEntities component — grid of similar entity cards with type badges and similarity score bars on every entity page
- [x] **Task 4:** Search autocomplete (`components/search-autocomplete.tsx`) — debounced 300ms search, keyboard navigation, type-colored badges, integrated into explore page replacing static input
- [x] **Task 5:** Developer portal (`/developer`) — API key registration form, key lookup by email, key revocation, API documentation quick reference
- [x] **Task 6:** API key CRUD (`/api/keys`) — POST to register (SHA-256 hashed storage, `aaas_` prefixed keys), GET to list by email, DELETE `/api/keys/[id]` to revoke
- [x] **Task 7:** Entity diff viewer (`components/entity-diff-viewer.tsx`) — collapsible field-level diff display, array diffs with added/removed pills, scalar diffs with strikethrough/green, grouped by changelog timestamp
- [x] **Task 8:** Entity versions API (`/api/entity/[type]/[slug]/versions`) — current entity + snapshot comparison
- [x] **Task 9:** Unified activity feed (`/activity`) — merges agent_logs, trending_alerts, submissions into timeline with auto-refresh (30s), type filters, relative timestamps, icon-coded entries
- [x] **Task 10:** Activity feed API (`/api/activity`) — aggregates 3 collections, normalizes to unified format, returns top 50 sorted by timestamp
- [x] **Task 11:** Updated runner with 17 agents (added similarity) in dependency order
- [x] **Task 12:** Navbar updated with Developers and Activity links
- [x] **Task 13:** Search autocomplete replaces static input on explore page

---

## Phase 10: API Hardening & User Engagement Layer (COMPLETE)

- [x] **Task 1:** Rate limiting middleware (`lib/rate-limit.ts`) — SHA-256 API key validation with daily usage reset, atomic Firestore increment, anonymous IP-based fallback (20/day), `X-RateLimit-*` headers. Applied to `/api/submit`, `/api/search`, `/api/export`
- [x] **Task 2:** Entity watchlist (`lib/use-watchlist.ts`, `components/watch-button.tsx`, `/watchlist`) — localStorage-backed watch/unwatch with heart icon toggle, custom "watchlist-change" event for cross-component sync, dedicated page with lazy-fetched scores and remove/clear-all
- [x] **Task 3:** OpenAPI 3.0.3 specification (`/api/openapi`) — full spec covering all 15+ endpoints with parameter types, request bodies, response schemas, security schemes, and tag grouping
- [x] **Task 4:** Interactive API documentation (`/api-docs`) — auto-fetches OpenAPI spec, sidebar navigation by tag, expandable endpoint cards with parameter tables, schema viewers, and "Try it" panel with live request execution and response display
- [x] **Task 5:** Entity health grades (`lib/grades.ts`, `components/grade-badge.tsx`) — 8-tier grading system (A+ through F) computed from composite scores, colored circular badges (sm/md/lg), dimension-level grades on entity header, integrated into entity cards
- [x] **Task 6:** System analytics (`/api/stats`, `/stats`) — entity counts by type, agent success rate, submissions/media/subscriber/API key stats, trending counts, SVG circular progress rings, CSS bar charts, top performers table, auto-refresh 60s
- [x] **Task 7:** Firestore rules updated for `rate_limit_anonymous` collection
- [x] **Task 8:** Navbar updated with Watchlist, Stats, and API Docs links
- [x] **Task 9:** Build verification — all routes compile cleanly

---

## Phase 11: Platform Polish & Embeddable Ecosystem (COMPLETE)

- [x] **Task 1:** Global command palette (`components/command-palette.tsx`) — Cmd+K/Ctrl+K overlay with entity search (300ms debounce), page navigation (15 pages), full keyboard nav (arrows, Enter, Escape), click-outside dismiss. Trigger pill in navbar
- [x] **Task 2:** Embeddable widgets system (`/embed/`) — iframe-ready entity card, leaderboard, and score badge pages with `?theme=dark|light` and `?limit=N` support. Minimal embed layout hides site chrome. Code generator page at `/embed` with live preview and copy-to-clipboard
- [x] **Task 3:** Entity sparkline charts — pure inline SVG sparklines (`components/sparkline.tsx`) with gradient fill, last-point dot, dashed fallback for sparse data. EntitySparkline wrapper fetches `/api/entity/[type]/[slug]/sparkline` (30 snapshots). Integrated into entity cards (60x20) and headers (120x32)
- [x] **Task 4:** Admin moderation UI overhaul (`/admin/review`) — two tabs (Submissions, Categorization Suggestions) with count badges, status filters, expand/collapse details, batch actions (Approve All, Reject All, Apply All High Confidence), auto-refresh 30s
- [x] **Task 5:** Webhook dispatch agent (`agents/webhook-agent.ts`) — two-phase dispatch+deliver, matches trending_alerts to webhook event subscriptions (entity.score.up/down/change/*), HMAC-SHA256 signatures, 10s timeout, retry queue with exponential backoff, auto-pause after 5 failures. Test endpoint at `/api/webhooks/test`
- [x] **Task 6:** Navbar updated with Embed link and command palette integration
- [x] **Task 7:** Build verification — all routes compile cleanly

---

## Phase 12: Intelligence & Real-time Engagement Layer (COMPLETE)

- [x] **Task 1:** Notification center (`components/notification-bell.tsx`, `/api/notifications`) — bell icon with red unread badge in navbar, dropdown panel with watchlist-filtered trending alerts (7 days), agent failure logs (24h), submission updates (7 days). 60s auto-refresh, localStorage read state persistence, click-outside dismiss
- [x] **Task 2:** Entity relationship editor (`components/relationship-editor.tsx`, `/api/entity/[type]/[slug]/relations`) — visual relationship manager showing grouped relation chips, "Suggest Relationship" form with type dropdown (8 relation types) and autocomplete entity search, writes suggestions to submissions collection
- [x] **Task 3:** Advanced search filters (`components/search-filters.tsx`) — collapsible filter panel replacing explore page type tabs. Multi-select type checkboxes, dual range slider (score 0-100), provider autocomplete, multi-tag input with AND logic, date picker, sort controls, active filter pills, "Showing X of Y" result count
- [x] **Task 4:** Entity changelog RSS — per-entity feed at `/api/entity/[type]/[slug]/feed` (queries changelog subcollection, 50 items, 10min cache) and global changes feed at `/api/changes` (collectionGroup query, 100 items). RSS icons on entity headers and activity page
- [x] **Task 5:** Keyboard shortcuts (`components/keyboard-shortcuts.tsx`, `components/shortcuts-help.tsx`) — vim-style `g` prefix navigation (11 routes with 1s timeout + toast indicator), `?` help overlay, `/` to open command palette, input-aware (skips in form fields), categorized help modal at z-[55]. Mounted in root layout
- [x] **Task 6:** Build verification — all routes compile cleanly

---

## Phase 13: Social & Content Enrichment Layer (COMPLETE)

- [x] **Task 1:** Entity comments (`components/entity-comments.tsx`, `/api/entity/[type]/[slug]/comments`) — threaded discussions with 2-level nesting, upvoting with localStorage deduplication, author persistence, HTML sanitization, vote API, integrated into entity pages after SimilarEntities
- [x] **Task 2:** User contribution profiles (`/profile`, `/api/profile`) — localStorage-based identity, stats cards (submissions with status breakdown, comments, upvotes, watchlist count), activity timeline, watchlist grid, 60s auto-refresh, Profile link added to navbar
- [x] **Task 3:** Metadata capture agent (`agents/metadata-agent.ts`) — extracts title, description, favicon, OG image from entity URLs via regex HTML parsing (first 50KB), 7-day freshness check, writes to `entity_metadata` collection. Added to runner (18 agents total) and weekly-supplemental GitHub Actions schedule
- [x] **Task 4:** Entity link preview (`components/entity-link-preview.tsx`) — rich preview card showing OG image, favicon, title, description from metadata API, loading skeleton, graceful fallback. Shown on entity pages below header when URL exists
- [x] **Task 5:** Hover preview cards (`components/entity-hover-card.tsx`, `components/entity-link.tsx`) — 300ms hover delay, viewport-aware positioning, module-level cache Map, fade-in animation. EntityLink wrapper integrated into similar-entities and entity-relations components
- [x] **Task 6:** Comparison export (`components/comparison-export.tsx`) — shareable links via `?e=type:slug` URL params with auto-load, JSON/CSV/Markdown download via Blob+createObjectURL, clipboard copy with toast notifications
- [x] **Task 7:** Firestore rules for comments (public read/write) and entity_metadata (public read)
- [x] **Task 8:** Build verification — all routes compile cleanly

---

## Phase 14: Performance, AI & Platform Maturity (COMPLETE)

- [x] **Task 1:** ISR + edge caching — `revalidate` config on 10 page types (entity 300s, explore 60s, homepage 120s, leaderboard/channels 300s). LazySection component with IntersectionObserver for 7 below-the-fold entity page sections. Loading skeletons for explore, leaderboard, stats
- [x] **Task 2:** Entity auto-summaries agent (`agents/summary-agent.ts`) — deterministic template-based summaries with overview, strengths (scores>70), weaknesses (scores<40), positioning, recommendation (tiered by composite), keyFacts. 3-day freshness, writes to entity_summaries. EntitySummary component with sparkle icon, color-coded pills/recommendation box
- [x] **Task 3:** Error boundaries — global `error.tsx` + branded `not-found.tsx` + 6 route-specific error boundaries (explore, leaderboard, compare, stats, activity, watchlist). Reusable `ErrorFallback` component with retry + go-home actions
- [x] **Task 4:** Accessibility — `SkipToContent` link, ARIA labels/roles on navbar (banner, navigation), command palette (dialog, listbox, option), notification bell (menu, menuitem), entity comments (article, required). `VisuallyHidden` utility component
- [x] **Task 5:** SEO enhancements — `Breadcrumbs` component with BreadcrumbList JSON-LD on entity pages, `metadataBase` for canonical URLs, enhanced sitemap with 10 new routes + changeFrequency/priority, robots.txt blocking /api/ /admin/ /embed/
- [x] **Task 6:** Firestore rules for entity_summaries, summary agent in daily-core schedule
- [x] **Task 7:** Build verification — all 40 files compile cleanly

---

## Architecture Summary

```
apps/blog/
├── src/
│   ├── app/                          # 65+ routes
│   │   ├── page.tsx                  # Homepage (trending, channels, latest, CTAs)
│   │   ├── explore/                  # Search + filter (client-side)
│   │   ├── compare/                  # Side-by-side entity comparison
│   │   ├── graph/                    # Force-directed relationship graph
│   │   ├── admin/review/             # Admin review queue (submissions + suggestions)
│   │   ├── leaderboard/              # Category tabs, score breakdowns
│   │   ├── listen/                   # Audio hub with player
│   │   ├── listen/[id]/              # Episode detail page
│   │   ├── submit/                   # Interactive form + API documentation
│   │   ├── subscribe/                # Email subscription form
│   │   ├── me/                       # Persona dashboard
│   │   ├── dashboard/                # System health dashboard
│   │   ├── {tool,model,agent,skill,script,benchmark}/[slug]/  # Entity pages
│   │   ├── channel/[topic]/          # 10 channel pages
│   │   ├── author/[id]/             # Agent profiles
│   │   ├── og/                       # Dynamic OG images (edge)
│   │   ├── api-docs/                 # Interactive API documentation
│   │   ├── stats/                    # System analytics dashboard
│   │   ├── watchlist/                # User entity watchlist
│   │   ├── api/
│   │   │   ├── openapi/              # OpenAPI 3.0.3 spec
│   │   │   ├── stats/                # System analytics API
│   │   │   ├── keys/                 # API key CRUD
│   │   │   ├── activity/             # Unified activity feed API
│   │   │   ├── entities/             # List/filter entities
│   │   │   ├── entity/[type]/[slug]/ # Single entity + changelog + history + similar + grade + versions
│   │   │   ├── badge/[type]/[slug]/  # SVG health badges
│   │   │   ├── export/               # Bulk JSON/CSV export
│   │   │   ├── trending/             # Trending alerts
│   │   │   ├── admin/submissions/    # Admin submission list
│   │   │   ├── admin/suggestions/    # Admin categorization suggestions
│   │   │   ├── submit/[id]/          # Single submission GET + PATCH
│   │   │   ├── leaderboard/[cat]/    # Leaderboard
│   │   │   ├── search/               # Full-text search
│   │   │   ├── episodes/             # Audio episodes + play count
│   │   │   ├── submit/               # Entity submission (POST)
│   │   │   ├── subscribe/            # Email subscription
│   │   │   ├── unsubscribe/          # Email unsubscription
│   │   │   ├── webhooks/             # Webhook CRUD
│   │   │   ├── dashboard/stats/      # System health stats
│   │   │   ├── podcast/              # Podcast RSS feed (iTunes)
│   │   │   ├── track/                # Page view tracking beacon
│   │   │   └── feed/                 # RSS 2.0
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   └── not-found.tsx
│   ├── components/                   # 48+ components
│   ├── lib/                          # 14 modules (types, entities, channels, firebase, schemas, media, tts, diff, webhooks, email-templates, grades, rate-limit, use-watchlist)
│   ├── agents/                       # 19 self-healing agent scripts + runner
│   └── seed/                         # Seed data + runner
├── .eslintrc.json                    # Excludes agents/
├── tsconfig.json                     # target es2017, excludes agents/
├── next.config.mjs
└── apphosting.yaml

.github/workflows/
├── agents.yml                        # Scheduled agent runs (daily/weekly/supplemental)
└── deploy-blog.yml                   # Auto-deploy on push

firestore.rules                       # Security rules (20 collections)
firestore.indexes.json                # 36+ composite indexes
```

## Required GitHub Secrets

- `FIREBASE_SERVICE_ACCOUNT` — Service account key JSON for agent scripts
- `FIREBASE_SERVICE_ACCOUNT_JSON` — Service account key JSON for deploy workflow
