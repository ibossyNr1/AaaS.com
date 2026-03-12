# AaaS Knowledge Index — Implementation Plan

> **Status: ALL 7 PHASES COMPLETE**
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

## Architecture Summary

```
apps/blog/
├── src/
│   ├── app/                          # 45+ routes
│   │   ├── page.tsx                  # Homepage (trending, channels, latest, CTAs)
│   │   ├── explore/                  # Search + filter (client-side)
│   │   ├── compare/                  # Side-by-side entity comparison
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
│   │   ├── api/
│   │   │   ├── entities/             # List/filter entities
│   │   │   ├── entity/[type]/[slug]/ # Single entity + changelog
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
│   ├── components/                   # 15 components
│   ├── lib/                          # 11 modules (types, entities, channels, firebase, schemas, media, tts, diff, webhooks, email-templates)
│   ├── agents/                       # 15 self-healing agent scripts + runner
│   └── seed/                         # Seed data + runner
├── .eslintrc.json                    # Excludes agents/
├── tsconfig.json                     # target es2017, excludes agents/
├── next.config.mjs
└── apphosting.yaml

.github/workflows/
├── agents.yml                        # Scheduled agent runs (daily/weekly/supplemental)
└── deploy-blog.yml                   # Auto-deploy on push

firestore.rules                       # Security rules (14 collections)
firestore.indexes.json                # 35+ composite indexes
```

## Required GitHub Secrets

- `FIREBASE_SERVICE_ACCOUNT` — Service account key JSON for agent scripts
- `FIREBASE_SERVICE_ACCOUNT_JSON` — Service account key JSON for deploy workflow
