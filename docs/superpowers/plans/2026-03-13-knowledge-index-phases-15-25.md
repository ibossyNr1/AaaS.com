# AaaS Knowledge Index — Implementation Plan (Phases 15-25)

> **Status: ALL 25 PHASES COMPLETE**
> Last updated: 2026-03-13

**Goal:** Extend the AaaS Knowledge Index (aaas.blog) from a 19-agent autonomous knowledge platform into a fully enterprise-ready, multi-tenant, internationalized, gamified, and AI-powered ecosystem with 32 self-healing agents, semantic search, A/B testing, integration marketplace, and comprehensive testing infrastructure.

**Architecture:** Firestore-backed entity database with typed data access layer. Next.js 14 with server rendering via Firebase App Hosting. Shared `@aaas/ui` design system. Self-healing agent scripts run via `tsx` CLI on scheduled GitHub Actions. Pinecone vector database for semantic search. Firebase Auth for user identity.

**Tech Stack:** Next.js 14, TypeScript, Firestore (firebase-admin for agents, client SDK for reads), Tailwind CSS via @aaas/ui, JSON-LD for structured data, Firebase App Hosting, Firebase Auth, Pinecone, GitHub Actions, Vitest.

**Prior Phases:** `docs/superpowers/plans/2026-03-10-knowledge-index-phase1.md` (Phases 1-14)

---

## Phase 15: Content Pipeline & Distribution Layer (COMPLETE)

- [x] **Task 1:** Digest agent (`agents/digest-agent.ts`) — auto-generates weekly summaries of new entities, score changes, and trending items. Writes to `digests` Firestore collection
- [x] **Task 2:** Comparison agent (`agents/comparison-agent.ts`) — identifies high-interest entity matchups using shared tags, capabilities, and category overlap. Scores pairings by interest level
- [x] **Task 3:** Digest page (`/digest`) — client-side digest viewer with auto-generated weekly summaries, timeline navigation, entity highlights
- [x] **Task 4:** Comparisons page (`/comparisons`) — auto-generated comparison matchups ranked by interest score, entity pair cards with quick-compare links
- [x] **Task 5:** Changelog digest page (`/changelog`) — weekly/monthly changelog rollup with bar charts showing entity change volume over time
- [x] **Task 6:** Changelog digest API (`/api/changelog-digest`) — aggregates changelog entries into weekly/monthly rollups with field-level change counts
- [x] **Task 7:** Comparisons API (`/api/comparisons`) — serves pre-computed comparison matchups with interest scores
- [x] **Task 8:** Digests API (`/api/digests`) — serves weekly digest summaries
- [x] **Task 9:** Platform status page (`/status`) — per-agent health indicators, uptime tracking, last-run timestamps, error rate display
- [x] **Task 10:** Status API (`/api/status`) — system-wide health check with agent status, Firestore connectivity, queue depths
- [x] **Task 11:** Entity print view — print button component (`components/print-button.tsx`), `@media print` CSS rules in globals.css for clean entity page printing
- [x] **Task 12:** Entity header updated with print button integration
- [x] **Task 13:** Firestore rules for `digests` and `comparisons` collections (public read)
- [x] **Task 14:** GitHub Actions updated — digest and comparison agents added to scheduled runs
- [x] **Task 15:** ISR revalidation on all new pages, sitemap updated with 4 new routes
- [x] **Task 16:** Updated runner with 21 agents in dependency-ordered execution

**Agent count: 21** (+2: digest-agent, comparison-agent)

---

## Phase 16: Personalization & User Intelligence (COMPLETE)

- [x] **Task 1:** Firebase Auth integration (`lib/auth.ts`) — Google sign-in provider, lazy initialization to prevent SSR build failures
- [x] **Task 2:** AuthProvider context (`components/auth-provider.tsx`) — React context wrapping Firebase Auth state, user session management
- [x] **Task 3:** Auth button component (`components/auth-button.tsx`) — Google sign-in/sign-out with avatar display, dropdown menu
- [x] **Task 4:** Persona system (`lib/personalization.ts`) — 5 persona variants (developer, researcher, executive, agent-builder, enterprise) with channel mappings and entity reordering weights
- [x] **Task 5:** Persona banner (`components/persona-banner.tsx`) — quick-switch dropdown for persona selection, persisted to localStorage
- [x] **Task 6:** Personalized feed (`components/personalized-feed.tsx`) — persona-based entity reordering on homepage, weighted by channel affinity
- [x] **Task 7:** Behavioral tracking (`lib/behavior.ts`) — entity views, search queries tracked via localStorage with cross-device sync API
- [x] **Task 8:** Entity view tracker (`components/entity-view-tracker.tsx`) — integrated on all entity pages for implicit interest signals
- [x] **Task 9:** Recently viewed component (`components/recently-viewed.tsx`) — shows last N visited entities from localStorage
- [x] **Task 10:** Recommended entities (`components/recommended-entities.tsx`) — persona-weighted suggestions based on viewing history
- [x] **Task 11:** User behavior API (`/api/user/behavior`) — cross-device sync for behavioral data (POST to save, GET to retrieve)
- [x] **Task 12:** Enhanced search page (`/search`) — fuzzy matching, weighted scoring, autocomplete, type filters, sort options
- [x] **Task 13:** Search analytics agent (`agents/search-analytics-agent.ts`) — aggregates search queries for trending topic detection
- [x] **Task 14:** Follow system (`lib/follows.ts`) — follow entities and channels via localStorage + Firestore persistence
- [x] **Task 15:** Follow button (`components/follow-button.tsx`) — toggle on entity headers
- [x] **Task 16:** Following page (`/following`) — activity feed for followed entities and channels
- [x] **Task 17:** User settings page (`/settings`) — persona selection, preferred channels, digest frequency preferences
- [x] **Task 18:** Auth context module (`lib/auth-context.tsx`) — shared authentication state helpers
- [x] **Task 19:** Firestore rules for `users`, `user_behavior`, `search_logs`, `search_analytics` collections
- [x] **Task 20:** Command palette updated with persona-aware search results
- [x] **Task 21:** Updated runner with 22 agents — search-analytics added to daily-core schedule
- [x] **Task 22:** Sitemap updated with 3 new routes

**Agent count: 22** (+1: search-analytics-agent)

---

## Phase 17: Audio/Video Pipeline (COMPLETE)

- [x] **Task 1:** TTS provider interface (`lib/tts.ts`) — SuperTonic and EdgeTTS provider placeholders with synthesize/listVoices methods
- [x] **Task 2:** Narration templates (`lib/narration-templates.ts`) — entity narration, channel digest, and weekly trends script generators with SSML support
- [x] **Task 3:** Audio agent (`agents/audio-agent.ts`) — automated TTS generation per entity and channel, writes to `audio_episodes` collection
- [x] **Task 4:** Full audio player (`components/audio-player.tsx`) — progress bar, volume control, speed selector (0.5x-2x), keyboard shortcuts (space, arrows)
- [x] **Task 5:** Mini player (`components/mini-player.tsx`) — inline entity page audio embedding with play/pause and progress
- [x] **Task 6:** Global audio queue (`components/audio-queue.tsx`) — persistent bottom bar with playlist management, next/prev, shuffle, repeat
- [x] **Task 7:** Entity audio component (`components/entity-audio.tsx`) — integrated on all entity pages for per-entity narration playback
- [x] **Task 8:** Enhanced listen page (`/listen`) — tabs (narrations/digests/weekly), filters by type, sort options, queue integration
- [x] **Task 9:** Podcast RSS feed (`/api/podcast/feed`) — iTunes-compatible XML with namespace, cover art, episode metadata
- [x] **Task 10:** Podcast episodes API (`/api/podcast/episodes`) — JSON feed with type filtering and pagination
- [x] **Task 11:** Individual episode pages (`/listen/[id]`) — full player with JSON-LD PodcastEpisode schema
- [x] **Task 12:** Podcast subscribe buttons (`components/podcast-subscribe.tsx`) — RSS, Apple Podcasts, Spotify, Google Podcasts links
- [x] **Task 13:** Video template system (`lib/video-templates.ts`) — entity spotlight and daily roundup scene definitions with timing, transitions, overlays
- [x] **Task 14:** Video agent (`agents/video-agent.ts`) — generates render queue jobs from entity updates, writes to `video_queue` collection
- [x] **Task 15:** Video queue API (`/api/video/queue`) — queue listing with status filtering
- [x] **Task 16:** Video detail API (`/api/video/[id]`) — status transitions and API key auth for render pipeline
- [x] **Task 17:** Entity audio API (`/api/entity/[type]/[slug]/audio`) — serves audio episodes for specific entities
- [x] **Task 18:** Media dashboard (`/media`) — production stats, coverage metrics, format breakdown, auto-refresh
- [x] **Task 19:** Media stats API (`/api/media/stats`) — aggregated audio/video production metrics
- [x] **Task 20:** Firestore rules for `audio_episodes` and `video_queue` collections
- [x] **Task 21:** GitHub Actions — audio and video agents added to weekly-supplemental schedule
- [x] **Task 22:** Updated runner with 24 agents in dependency order

**Agent count: 24** (+2: audio-agent, video-agent)

---

## Phase 18: Vault Integration, Admin, Webhooks v2, Exports (COMPLETE)

- [x] **Task 1:** Vault integration page (`/vault`) — subscription plan management, tier display (free/pro/enterprise), feature comparison
- [x] **Task 2:** Vault library (`lib/vault.ts`) — subscription management, plan definitions, entitlement checking
- [x] **Task 3:** Subscriptions API (`/api/subscriptions`) — create/manage subscription plans, list active subscriptions
- [x] **Task 4:** Subscription alerts API (`/api/subscriptions/alerts`) — subscription event notifications
- [x] **Task 5:** Subscription agent (`agents/subscription-agent.ts`) — monitors subscription lifecycle, renewal reminders, usage tracking
- [x] **Task 6:** Admin dashboard (`/admin`) — system overview with entity management, agent controls, configuration panel
- [x] **Task 7:** Admin entity management (`/admin/entities`) — sortable/filterable entity table with inline editing, bulk actions
- [x] **Task 8:** Admin APIs — `/api/admin/entities` (CRUD), `/api/admin/agents` (control), `/api/admin/config` (system config)
- [x] **Task 9:** Admin library (`lib/admin.ts`) — admin utilities, entity management helpers
- [x] **Task 10:** Event system (`lib/events.ts`) — 8 event types with structured payloads, Firestore event log
- [x] **Task 11:** Events page (`/events`) — real-time event stream viewer with type filters, auto-scroll
- [x] **Task 12:** Events API (`/api/events`) — event listing with type/date filters
- [x] **Task 13:** SSE real-time stream (`/api/events/stream`) — Server-Sent Events for live event delivery
- [x] **Task 14:** Webhooks management UI (`/webhooks`) — webhook CRUD, event type subscription, delivery logs
- [x] **Task 15:** Webhooks manage API (`/api/webhooks/manage`) — webhook registration, update, deletion
- [x] **Task 16:** Data exports — entity export (`/api/export/entities`) JSON/CSV/JSONL, leaderboard export (`/api/export/leaderboard`), changelog export (`/api/export/changelog`)
- [x] **Task 17:** Developer hub rewrite (`/developer`) — interactive code examples, API key management, export tools integration
- [x] **Task 18:** Developer API keys (`/api/developer/api-keys`) — enhanced key management with usage tracking
- [x] **Task 19:** Code example component (`components/code-example.tsx`) — multi-language syntax highlighting with copy button
- [x] **Task 20:** Health monitoring agent (`agents/health-agent.ts`) — checks Firestore connectivity, agent health, data freshness, queue depths
- [x] **Task 21:** Alerting agent (`agents/alerting-agent.ts`) — severity grouping (critical/warning/info), alert deduplication
- [x] **Task 22:** Health API (`/api/health`) — system health endpoint with component status
- [x] **Task 23:** Health history API (`/api/health/history`) — historical health data for charting
- [x] **Task 24:** Firestore rules for 8 new collections (health, events, subscriptions, admin, webhooks_v2, alerts, vault, developer_keys)
- [x] **Task 25:** GitHub Actions — health + alerting on daily-core, subscription on weekly-supplemental
- [x] **Task 26:** Navbar updated with Events, Webhooks, Vault links
- [x] **Task 27:** Updated runner with 27 agents in dependency order

**Agent count: 27** (+3: subscription-agent, health-agent, alerting-agent)

---

## Phase 19: Semantic Intelligence & Discovery (COMPLETE)

- [x] **Task 1:** Pinecone vector search integration (`lib/pinecone.ts`) — vector index management, upsert/query operations, hybrid scoring (semantic + keyword)
- [x] **Task 2:** Semantic search API (`/api/search/semantic`) — pure vector similarity search with configurable top-K
- [x] **Task 3:** Hybrid search API (`/api/search/hybrid`) — combined semantic + keyword search with weighted scoring
- [x] **Task 4:** Enhanced search page (`/search`) — hybrid search toggle, semantic relevance scoring display
- [x] **Task 5:** Collaborative filtering (`lib/collaborative.ts`) — user-entity interaction matrix, cosine similarity between users, "visitors like you also explored" recommendations
- [x] **Task 6:** Collaborative recommendations component (`components/collaborative-recommendations.tsx`) — integrated on entity pages
- [x] **Task 7:** Similar users badge (`components/similar-users-badge.tsx`) — shows user similarity cohort
- [x] **Task 8:** Recommendations API (`/api/recommendations`) — personalized entity recommendations
- [x] **Task 9:** Similar users API (`/api/recommendations/similar-users`) — find users with similar browsing patterns
- [x] **Task 10:** AI query library (`lib/ai-query.ts`) — natural language entity queries with intent parsing, entity extraction, structured response generation
- [x] **Task 11:** AI query page (`/ask`) — conversational interface for natural language entity queries
- [x] **Task 12:** AI query API (`/api/ai/query`) — processes natural language queries, returns structured entity results
- [x] **Task 13:** AI suggestion API (`/api/ai/suggest`) — autocomplete suggestions for AI query input
- [x] **Task 14:** AI search component (`components/ai-search.tsx`) — search bar with AI mode toggle, result cards
- [x] **Task 15:** Entity clustering (`lib/clustering.ts`) — k-means-style clustering based on entity features, topic grouping
- [x] **Task 16:** Discovery page (`/discover`) — entity clusters, topic maps, learning paths with visual navigation
- [x] **Task 17:** Discovery suggestions component (`components/discovery-suggestions.tsx`) — contextual entity recommendations
- [x] **Task 18:** Discovery APIs — clusters (`/api/discover/clusters`), topics (`/api/discover/topics`), paths (`/api/discover/paths`), suggestions (`/api/discover/suggestions`)
- [x] **Task 19:** Embedding agent (`agents/embedding-agent.ts`) — generates and upserts entity embeddings to Pinecone on daily schedule
- [x] **Task 20:** Clustering agent (`agents/clustering-agent.ts`) — runs entity clustering algorithm, writes cluster assignments to Firestore
- [x] **Task 21:** Discovery agent (`agents/discovery-agent.ts`) — generates learning paths and topic maps from cluster data
- [x] **Task 22:** Firestore rules for `embeddings`, `clusters`, `discovery_paths`, `user_interactions`, `recommendations` collections
- [x] **Task 23:** Navbar updated with Discover and Ask links
- [x] **Task 24:** Sitemap updated with 2 new routes
- [x] **Task 25:** Updated runner with 30 agents in dependency order

**Agent count: 30** (+3: embedding-agent, clustering-agent, discovery-agent)

---

## Phase 20: Advanced Analytics & Intelligence Dashboard (COMPLETE)

- [x] **Task 1:** Analytics library (`lib/analytics.ts`) — entity growth tracking, search trend aggregation, agent performance metrics, period-based snapshots
- [x] **Task 2:** Analytics dashboard (`/analytics`) — period selectors (7d/30d/90d), entity growth charts, search trend visualization, agent performance metrics
- [x] **Task 3:** Analytics APIs — timeseries (`/api/analytics/timeseries`), snapshot (`/api/analytics/snapshot`), agents (`/api/analytics/agents`)
- [x] **Task 4:** Anomaly detection system (`lib/anomaly.ts`) — z-score analysis for entity scores, traffic patterns, agent staleness detection with configurable sensitivity thresholds
- [x] **Task 5:** Anomaly detection API (`/api/analytics/anomalies`) — serves detected anomalies with severity levels and affected entities
- [x] **Task 6:** Anomaly agent (`agents/anomaly-agent.ts`) — scheduled anomaly scanning across scores, traffic, and agent health
- [x] **Task 7:** Anomaly feed component (`components/anomaly-feed.tsx`) — scrollable anomaly timeline with severity badges, entity links
- [x] **Task 8:** Anomaly alert banner (`components/anomaly-alert-banner.tsx`) — dismissible top-of-page critical anomaly alerts
- [x] **Task 9:** A/B testing framework (`lib/experiments.ts`) — deterministic hash-based variant assignment, experiment CRUD, conversion tracking
- [x] **Task 10:** Experiments page (`/experiments`) — experiment management dashboard with variant stats, conversion funnels
- [x] **Task 11:** Experiment APIs — list/create (`/api/experiments`), detail/update (`/api/experiments/[id]`), assignment (`/api/experiments/assign`)
- [x] **Task 12:** ExperimentProvider context (`components/experiment-provider.tsx`) — global experiment tracking added to root layout
- [x] **Task 13:** Pipeline monitoring dashboard (`/pipeline`) — agent execution timeline, data freshness tracking, queue depth visualization
- [x] **Task 14:** Pipeline library (`lib/pipeline.ts`) — agent execution state, freshness metrics, queue monitoring
- [x] **Task 15:** Pipeline APIs — health (`/api/pipeline/health`), freshness (`/api/pipeline/freshness`), agent detail (`/api/pipeline/agent/[name]`)
- [x] **Task 16:** Reporting agent (`agents/reporting-agent.ts`) — weekly system report generation with key metrics summary
- [x] **Task 17:** New components — analytics sparkline (`components/analytics-sparkline.tsx`), metric card (`components/metric-card.tsx`), agent status dot (`components/agent-status-dot.tsx`), freshness indicator (`components/freshness-indicator.tsx`)
- [x] **Task 18:** Firestore rules for `analytics`, `anomalies`, `experiments`, `pipeline_runs`, `reports` collections
- [x] **Task 19:** Navbar updated with Analytics and Pipeline links
- [x] **Task 20:** Sitemap updated with 3 new routes
- [x] **Task 21:** Updated runner with 32 agents in dependency order

**Agent count: 32** (+2: anomaly-agent, reporting-agent)

---

## Phase 21: Multi-tenancy, Theming & White-label (COMPLETE)

- [x] **Task 1:** Workspace system (`lib/workspaces.ts`) — multi-tenant workspace CRUD, member management, workspace-scoped entity access
- [x] **Task 2:** Workspace auth (`lib/workspace-auth.ts`) — workspace-level authentication and authorization checks
- [x] **Task 3:** Workspace listing page (`/workspaces`) — workspace browser with create/join functionality
- [x] **Task 4:** Workspace detail page (`/workspaces/[slug]`) — workspace dashboard with member list, entity collections, settings
- [x] **Task 5:** Workspace APIs — list/create (`/api/workspaces`), detail/update/delete (`/api/workspaces/[id]`), theme (`/api/workspaces/[id]/theme`)
- [x] **Task 6:** Theming engine (`lib/theming.ts`) — 6 built-in themes (basalt, light, ocean, forest, sunset, midnight) with CSS variable generation
- [x] **Task 7:** Visual theme editor (`components/theme-editor.tsx`) — live preview with color pickers, font selectors, spacing controls
- [x] **Task 8:** Theme preview component (`components/theme-preview.tsx`) — side-by-side theme comparison cards
- [x] **Task 9:** Theme injector (`components/theme-injector.tsx`) — applies workspace theme CSS variables at runtime
- [x] **Task 10:** RBAC system (`lib/rbac.ts`) — 4 roles (owner/admin/editor/viewer) with granular permission definitions
- [x] **Task 11:** Permission gate (`components/permission-gate.tsx`) — conditional rendering based on user role and permission
- [x] **Task 12:** Role badge (`components/role-badge.tsx`) — colored role indicator badges
- [x] **Task 13:** Role selector (`components/role-selector.tsx`) — dropdown for role assignment in workspace settings
- [x] **Task 14:** Collections system (`lib/collections.ts`) — curated entity lists with workspace scoping
- [x] **Task 15:** Collections page (`/collections`) — browse and create entity collections
- [x] **Task 16:** Collection detail page (`/collections/[id]`) — collection viewer with entity management
- [x] **Task 17:** Bookmarks page (`/bookmarks`) — personal entity bookmarks with folder organization
- [x] **Task 18:** Bookmark button (`components/bookmark-button.tsx`) — added to entity headers for quick bookmarking
- [x] **Task 19:** Force-dynamic fix — added `export const dynamic = 'force-dynamic'` to all 47+ API routes to prevent Firestore prerender errors
- [x] **Task 20:** Firestore rules for `workspaces`, `collections`, `bookmarks`, `experiments` collections
- [x] **Task 21:** Navbar updated with Workspaces, Collections, Bookmarks links
- [x] **Task 22:** Sitemap updated with 3 new routes

**Agent count: 32** (no new agents)

---

## Phase 22: Internationalization, Accessibility & Performance (COMPLETE)

- [x] **Task 1:** i18n framework (`lib/i18n.ts`) — locale detection, translation loading, interpolation, pluralization support
- [x] **Task 2:** Locale files — 8 locale JSON files (`i18n/{en,es,fr,de,ja,ko,pt,zh}.json`) with 118+ translation keys each
- [x] **Task 3:** Locale provider (`components/locale-provider.tsx`) — React context for current locale, translation hook, added to root layout
- [x] **Task 4:** Locale switcher (`components/locale-switcher.tsx`) — language dropdown in navbar with flag indicators
- [x] **Task 5:** Accessibility library (`lib/accessibility.ts`) — WCAG contrast ratio checker, color recommendations, focus management utilities
- [x] **Task 6:** Skip-to-content component (`components/skip-to-content.tsx`) — keyboard-accessible skip navigation (existing, enhanced)
- [x] **Task 7:** Focus trap (`components/focus-trap.tsx`) — modal/dialog focus containment with tab cycling
- [x] **Task 8:** ARIA live region (`components/aria-live-region.tsx`) — screen reader announcements for dynamic content updates, added to root layout
- [x] **Task 9:** In-memory cache (`lib/cache.ts`) — TTL-based cache with stats tracking, hit/miss ratios, automatic expiration
- [x] **Task 10:** Performance monitor (`components/performance-monitor.tsx`) — dev overlay showing render times, cache stats, network requests
- [x] **Task 11:** Virtual list (`components/virtual-list.tsx`) — windowed rendering for large entity lists with dynamic row heights
- [x] **Task 12:** Lazy image (`components/lazy-image.tsx`) — IntersectionObserver-based image loading with blur placeholder
- [x] **Task 13:** Prefetch link (`components/prefetch-link.tsx`) — viewport-proximity-based route prefetching
- [x] **Task 14:** Error handling library (`lib/errors.ts`) — ApiError class with status codes, circuit breaker pattern, exponential retry with jitter
- [x] **Task 15:** Error boundary component (`components/error-boundary.tsx`) — React error boundary with fallback UI and retry
- [x] **Task 16:** Custom 404 page (`not-found.tsx`) — branded not-found with search integration
- [x] **Task 17:** Offline detection banner (`components/offline-banner.tsx`) — network status monitoring with reconnection notification
- [x] **Task 18:** SEO library (`lib/seo.ts`) — JSON-LD generators for Organization, BreadcrumbList, FAQPage schemas
- [x] **Task 19:** PWA manifest (`manifest.ts`) — web app manifest for installability
- [x] **Task 20:** Loading skeletons (`components/loading-skeleton.tsx`) — line, circle, card, table, chart skeleton variants
- [x] **Task 21:** Performance library (`lib/performance.ts`) — performance metric collection, Core Web Vitals tracking
- [x] **Task 22:** Updated robots.ts with additional disallow rules
- [x] **Task 23:** Firestore rules for i18n-related collections
- [x] **Task 24:** Navbar updated with locale switcher

**Agent count: 32** (no new agents)

---

## Phase 23: Integration Hub, Plugins & Gamification (COMPLETE)

- [x] **Task 1:** Plugin architecture (`lib/plugins.ts`) — plugin lifecycle management, registration, configuration, event hooks
- [x] **Task 2:** 6 built-in integrations — Slack (notifications), Discord (webhooks), GitHub (issue sync), Zapier (automation triggers), Google Sheets (data export), Notion (page sync)
- [x] **Task 3:** Integration marketplace page (`/integrations`) — category filters (communication, development, productivity, automation), installation management, configuration panels
- [x] **Task 4:** Integration detail pages (`/integrations/[slug]`) — setup instructions, configuration forms, connection status, usage stats
- [x] **Task 5:** Notification system (`lib/notifications.ts`) — unified notification management with preferences, read/unread state, priority levels
- [x] **Task 6:** Notification center (`components/notification-center.tsx`) — full-page notification view with filters, bulk actions, preference management
- [x] **Task 7:** Notifications page (`/notifications`) — dedicated notifications page with history and settings
- [x] **Task 8:** Enhanced notification bell (`components/notification-bell.tsx`) — refactored with unread count badge, extracted center component
- [x] **Task 9:** Webhook v2 system (`lib/webhooks-v2.ts`) — HMAC-SHA256 signing, exponential backoff retry, delivery tracking, event filtering
- [x] **Task 10:** Webhook v2 APIs — list/create (`/api/webhooks/v2`), detail/update/delete (`/api/webhooks/v2/[id]`), delivery logs (`/api/webhooks/v2/deliveries`)
- [x] **Task 11:** Achievement system (`lib/achievements.ts`) — 20+ achievements across 5 categories (exploration, contribution, engagement, mastery, social), progress tracking, unlock conditions
- [x] **Task 12:** Achievements page (`/achievements`) — achievement grid with progress bars, category tabs, unlock history
- [x] **Task 13:** Achievement toast (`components/achievement-toast.tsx`) — celebration animation on achievement unlock with confetti effect
- [x] **Task 14:** SDK generator (`lib/sdk-generator.ts`) — auto-generated TypeScript and Python client libraries from OpenAPI spec
- [x] **Task 15:** SDK download pages — TypeScript (`/developer/sdks`), Python SDK with installation instructions
- [x] **Task 16:** SDK APIs — TypeScript (`/api/sdk/typescript`), Python (`/api/sdk/python`) — generated client download
- [x] **Task 17:** Interactive API playground (`/developer/playground`) — endpoint selector, parameter inputs, live request execution, response viewer
- [x] **Task 18:** API playground component (`components/api-playground.tsx`) — reusable playground with authentication, history
- [x] **Task 19:** Plugin listing API (`/api/plugins`) — installed plugins, available marketplace listings
- [x] **Task 20:** Firestore rules for `achievements`, `user_achievements`, `integrations`, `notifications`, `webhook_v2`, `plugin_configs` collections
- [x] **Task 21:** Navbar updated with Integrations link
- [x] **Task 22:** Sitemap updated with 5 new routes
- [x] **Task 23:** AchievementToast added to root layout for global unlock notifications

**Agent count: 32** (no new agents)

---

## Phase 24: Testing Infrastructure & Deployment (COMPLETE)

- [x] **Task 1:** Vitest configuration (`vitest.config.ts`) — TypeScript, path aliases, Firebase mocks, test environment setup
- [x] **Task 2:** Test setup (`test/setup.ts`) — global test utilities, Firebase admin mock, Firestore mock
- [x] **Task 3:** Test helpers — API helpers (`test/api-helpers.ts`) for route testing, Firestore helpers (`test/firestore-helpers.ts`) for data mocking
- [x] **Task 4:** Unit test suites (9 suites) — `lib/__tests__/rbac.test.ts`, `cache.test.ts`, `i18n.test.ts`, `errors.test.ts`, `achievements.test.ts`, `theming.test.ts`, `seo.test.ts`, `accessibility.test.ts`, `rate-limit.test.ts`
- [x] **Task 5:** API integration test suites (7 suites) — `api/webhooks/v2/__tests__/route.test.ts`, `api/workspaces/__tests__/route.test.ts` + entities, keys, notifications, achievements, search
- [x] **Task 6:** Next.js middleware (`middleware.ts`) — security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy), CORS configuration
- [x] **Task 7:** API middleware library (`lib/api-middleware.ts`) — request validation, error handling, rate limiting utilities
- [x] **Task 8:** Rate limiting (memory) (`lib/rate-limit-memory.ts`) — in-memory rate limiter for development/testing without Firestore dependency
- [x] **Task 9:** Health check endpoints — `/api/health` (liveness), `/api/health/ready` (readiness with Firestore check)
- [x] **Task 10:** System info API (`/api/system/info`) — version, environment, uptime, feature flags
- [x] **Task 11:** Health library (`lib/health.ts`) — health check utilities, component status aggregation
- [x] **Task 12:** Documentation hub (`/docs`) — comprehensive docs page with API reference, agent documentation, data model tabs
- [x] **Task 13:** Architecture diagram page (`/docs/architecture`) — interactive system architecture visualization
- [x] **Task 14:** Documentation data module (`lib/doc-data.ts`) — centralized documentation content, API endpoint catalog
- [x] **Task 15:** Firestore rules updated for test collections
- [x] **Task 16:** Navbar updated with Docs link
- [x] **Task 17:** Sitemap updated with 2 new routes

**Agent count: 32** (no new agents)

---

## Phase 25: UX Polish, RBAC Enhancements, Multi-Persona Delivery (COMPLETE)

- [x] **Task 1:** Breadcrumbs integration — breadcrumb trails added to explore, leaderboard, discover, docs pages
- [x] **Task 2:** Loading skeletons — skeleton states added to leaderboard, search, status, pipeline pages
- [x] **Task 3:** Entity hover cards — integrated across similar-entities and entity-relations components for preview on hover
- [x] **Task 4:** Sparkline charts — added to analytics dashboard, entity cards, and comparison views
- [x] **Task 5:** Anomaly alert banners — critical anomaly alerts surfaced on analytics, dashboard, and pipeline pages
- [x] **Task 6:** Anomaly feed — anomaly timeline integrated into analytics and status pages
- [x] **Task 7:** Podcast subscribe widget — RSS/Apple/Spotify/Google subscribe buttons added to listen page
- [x] **Task 8:** Discovery suggestions — contextual entity recommendations on discover and explore pages
- [x] **Task 9:** Collaborative recommendations — "visitors also explored" section on entity pages
- [x] **Task 10:** Recently viewed — last-visited entities shown on me/dashboard and explore pages
- [x] **Task 11:** Performance monitor — dev overlay added to root layout for render/cache monitoring
- [x] **Task 12:** Print button — print view integrated on entity headers for clean page printing
- [x] **Task 13:** Permission gates — role-based UI gating on workspace detail, admin, and settings pages
- [x] **Task 14:** Role badges and selectors — visual role indicators on workspace member lists
- [x] **Task 15:** Workspace theme editor — live theme customization in workspace detail pages
- [x] **Task 16:** Achievement integration — achievement progress and unlock tracking wired into achievements page
- [x] **Task 17:** Multi-persona delivery (platform) — 6 persona-specific pitch pages (Overview, Founders, Investors, Business Owners, Individual Users, Partners) with dedicated audio narration
- [x] **Task 18:** Delivery page audio — per-persona MP3 narrations generated and integrated (`apps/platform/public/audio/aaas-pitch-*.mp3`)

**Agent count: 32** (no new agents — polish phase)

---

## Architecture Summary (Phases 1-25)

### Totals

| Metric | Count |
|--------|-------|
| Self-healing agents | 32 (+ runner + logger) |
| Pages & API routes | 183 |
| React components | 85 |
| Library modules | 52 |
| i18n locales | 8 (en, es, fr, de, ja, ko, pt, zh) |
| Built-in themes | 6 (basalt, light, ocean, forest, sunset, midnight) |
| Integrations | 6 (Slack, Discord, GitHub, Zapier, Sheets, Notion) |
| Test suites | 16 (9 unit + 7 integration) |
| Achievements | 20+ across 5 categories |

### Agent Roster (32 agents)

| # | Agent | Schedule | Added |
|---|-------|----------|-------|
| 1 | schema-auditor | daily-core | Phase 4 |
| 2 | schema-healer | daily-core | Phase 4 |
| 3 | link-validator | daily-core | Phase 4 |
| 4 | freshness-agent | daily-core | Phase 4 |
| 5 | ranking-agent | daily-core | Phase 4 |
| 6 | media-agent | daily-core | Phase 4 |
| 7 | ingestion-agent | daily-core | Phase 4 |
| 8 | enrichment-agent | daily-core | Phase 6 |
| 9 | categorization-agent | daily-core | Phase 6 |
| 10 | changelog-agent | daily-core | Phase 6 |
| 11 | webhook-agent | daily-core | Phase 6 |
| 12 | digest-email-agent | weekly | Phase 6 |
| 13 | auto-review-agent | daily-core | Phase 7 |
| 14 | views-agent | daily-core | Phase 7 |
| 15 | trending-agent | daily-core | Phase 8 |
| 16 | similarity-agent | daily-core | Phase 9 |
| 17 | metadata-agent | weekly-supplemental | Phase 13 |
| 18 | summary-agent | daily-core | Phase 14 |
| 19 | digest-agent | daily-core | Phase 15 |
| 20 | comparison-agent | daily-core | Phase 15 |
| 21 | search-analytics-agent | daily-core | Phase 16 |
| 22 | audio-agent | weekly-supplemental | Phase 17 |
| 23 | video-agent | weekly-supplemental | Phase 17 |
| 24 | subscription-agent | weekly-supplemental | Phase 18 |
| 25 | health-agent | daily-core | Phase 18 |
| 26 | alerting-agent | daily-core | Phase 18 |
| 27 | embedding-agent | daily-core | Phase 19 |
| 28 | clustering-agent | weekly | Phase 19 |
| 29 | discovery-agent | weekly | Phase 19 |
| 30 | anomaly-agent | daily-core | Phase 20 |
| 31 | reporting-agent | weekly | Phase 20 |

### Architecture Tree

```
apps/blog/
├── src/
│   ├── app/                          # 183 pages + API routes
│   │   ├── page.tsx                  # Homepage (trending, channels, latest, personalized feed)
│   │   ├── explore/                  # Search + advanced filters (client-side)
│   │   ├── compare/                  # Side-by-side entity comparison
│   │   ├── graph/                    # Force-directed relationship graph
│   │   ├── discover/                 # AI-powered entity discovery with clusters + learning paths
│   │   ├── ask/                      # Conversational AI entity queries
│   │   ├── search/                   # Enhanced search with hybrid semantic + keyword
│   │   ├── analytics/               # Advanced analytics dashboard
│   │   ├── experiments/             # A/B testing management
│   │   ├── pipeline/                # Agent pipeline monitoring
│   │   ├── admin/                   # Admin dashboard + entity management + review queue
│   │   ├── leaderboard/             # Category tabs, score breakdowns
│   │   ├── listen/                  # Audio hub with global player + queue
│   │   ├── media/                   # Media production dashboard
│   │   ├── submit/                  # Interactive form + API documentation
│   │   ├── subscribe/               # Email subscription form
│   │   ├── me/                      # Persona dashboard
│   │   ├── dashboard/               # System health dashboard
│   │   ├── settings/                # User preferences
│   │   ├── profile/                 # User contribution profiles
│   │   ├── following/               # Entity/channel following feed
│   │   ├── watchlist/               # Entity watchlist
│   │   ├── bookmarks/               # Personal entity bookmarks
│   │   ├── collections/             # Curated entity collections
│   │   ├── workspaces/              # Multi-tenant workspaces
│   │   ├── integrations/            # Integration marketplace
│   │   ├── achievements/            # Gamification achievement grid
│   │   ├── notifications/           # Full notification center
│   │   ├── events/                  # Real-time event stream
│   │   ├── webhooks/                # Webhook management UI
│   │   ├── vault/                   # Subscription plans
│   │   ├── digest/                  # Weekly digests
│   │   ├── comparisons/             # Auto-generated comparisons
│   │   ├── changelog/               # Changelog rollups
│   │   ├── status/                  # Platform health status
│   │   ├── stats/                   # System analytics
│   │   ├── activity/                # Unified activity feed
│   │   ├── developer/               # Developer hub + playground + SDKs
│   │   ├── api-docs/                # Interactive API documentation
│   │   ├── docs/                    # Documentation hub + architecture diagram
│   │   ├── embed/                   # Embeddable widget generator
│   │   ├── og/                      # Dynamic OG images (edge)
│   │   ├── {tool,model,agent,skill,script,benchmark}/[slug]/  # Entity pages
│   │   ├── channel/[topic]/         # 10 channel pages
│   │   ├── author/[id]/             # Agent profiles
│   │   ├── api/                     # 60+ API routes
│   │   │   ├── ai/                  # AI query + suggest
│   │   │   ├── analytics/           # Timeseries, anomalies, snapshots
│   │   │   ├── admin/               # Entities, agents, config, submissions, suggestions
│   │   │   ├── discover/            # Clusters, topics, paths, suggestions
│   │   │   ├── entity/[type]/[slug]/ # Entity + changelog + history + similar + audio + comments + feed + relations + versions
│   │   │   ├── events/              # Events + SSE stream
│   │   │   ├── experiments/         # CRUD + assignment
│   │   │   ├── export/              # Entities, leaderboard, changelog
│   │   │   ├── health/              # Liveness, readiness, history
│   │   │   ├── pipeline/            # Health, freshness, agent detail
│   │   │   ├── podcast/             # Feed (iTunes RSS), episodes
│   │   │   ├── recommendations/     # Personalized + similar users
│   │   │   ├── sdk/                 # TypeScript + Python generated clients
│   │   │   ├── search/              # Text, semantic, hybrid
│   │   │   ├── subscriptions/       # Plans + alerts
│   │   │   ├── system/              # Info endpoint
│   │   │   ├── video/               # Queue + detail
│   │   │   ├── webhooks/            # v1 CRUD + v2 CRUD + deliveries
│   │   │   └── ...                  # keys, track, feed, openapi, stats, etc.
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   ├── manifest.ts              # PWA manifest
│   │   ├── not-found.tsx
│   │   └── error.tsx
│   ├── components/                   # 85 components
│   ├── lib/                          # 52 modules
│   ├── agents/                       # 32 agent scripts + runner + logger
│   ├── i18n/                         # 8 locale JSON files
│   ├── test/                         # Test setup + helpers
│   └── seed/                         # Seed data + runner
├── vitest.config.ts                  # Test configuration
├── middleware.ts                     # Security headers + CORS
├── .eslintrc.json
├── tsconfig.json
├── next.config.mjs
└── apphosting.yaml

.github/workflows/
├── agents.yml                        # Scheduled agent runs (daily-core/weekly/weekly-supplemental)
├── deploy-blog.yml                   # Auto-deploy on push
└── ci.yml                            # Lint, typecheck, test, build

firestore.rules                       # Security rules (40+ collections)
firestore.indexes.json                # 50+ composite indexes
```

### Key Capabilities Added in Phases 15-25

| Capability | Phase |
|------------|-------|
| Content pipeline (digests, auto-comparisons) | 15 |
| User identity (Firebase Auth, personas) | 16 |
| Audio/video production pipeline | 17 |
| Enterprise admin + vault subscriptions | 18 |
| Semantic search (Pinecone) + AI queries | 19 |
| Anomaly detection + A/B testing | 20 |
| Multi-tenancy + RBAC + theming | 21 |
| i18n (8 locales) + WCAG accessibility | 22 |
| Plugin marketplace + gamification | 23 |
| Testing infrastructure (Vitest, 16 suites) | 24 |
| UX polish + multi-persona delivery | 25 |

### Required GitHub Secrets

- `FIREBASE_SERVICE_ACCOUNT` — Service account key JSON for agent scripts
- `FIREBASE_SERVICE_ACCOUNT_JSON` — Service account key JSON for deploy workflow
- `PINECONE_API_KEY` — Pinecone vector database API key (Phase 19+)
- `PINECONE_ENVIRONMENT` — Pinecone environment identifier
