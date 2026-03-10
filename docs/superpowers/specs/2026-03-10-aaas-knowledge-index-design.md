# AaaS Knowledge Index — Design Specification

**Date:** 2026-03-10
**Status:** Approved
**Scope:** Frontend platform architecture for the AaaS Knowledge Index (aaas-blog.web.app → aaas.blog)

---

## Vision

The AaaS Knowledge Index is a schema-first, self-healing database of the AI ecosystem. Every tool, model, agent, skill, script, and benchmark gets a structured landing page optimized for LLM crawlers and modern search systems (Google, Tavily, Firecrawl, Cloudflare, BigQuery). Agents autonomously maintain, expand, and narrate the index. Audio and video derivatives are auto-generated and distributed through the Vault on agents-as-a-service.com. The system grows with AI, whether the visitor is human or agent.

**This is not a blog.** There are no articles or prose. There are structured entity pages — product spec sheets for every item in the AI ecosystem. Human engagement is handled by an LLM conversational layer (future phase) and audio/video narration (initial phase).

---

## System Architecture

```
┌──────────────────────────────────────────────────────┐
│  SCHEMA SURFACE LAYER (the pages)                    │
│  Static, crawlable landing pages — one per entity.   │
│  Structured data rendered as clean HTML with JSON-LD, │
│  Open Graph, schema.org markup. Optimized for LLM    │
│  crawlers, search engines, and agent consumption.    │
└───────────────────────┬──────────────────────────────┘
                        │ renders from
┌───────────────────────▼──────────────────────────────┐
│  AGENTIC KNOWLEDGE INDEX (the brain)                 │
│  Schema-first entity database. Six entity types:     │
│  Tools, Models, Agents, Skills, Scripts, Benchmarks  │
│  Every entity: structured JSON-LD, cross-linked,     │
│  versioned, scored, categorized. Content API for     │
│  read, search, submit, and rank operations.          │
└───────────────────────┬──────────────────────────────┘
                        │ feeds into
┌───────────────────────▼──────────────────────────────┐
│  MEDIA & DISTRIBUTION (the megaphone)                │
│  Audio: entity narrations, daily digests, weekly     │
│  interactive podcast (NotebookLM-style). TTS via     │
│  SuperTonic (pluggable interface).                   │
│  Video: branded template + audio + animated text     │
│  highlights. Lightweight YouTube presence.           │
│  Distribution: Vault (email/chat), YouTube, Spotify, │
│  podcast platforms, RSS, social auto-posting.        │
└──────────────────────────────────────────────────────┘
```

**Key principle:** The Knowledge Index is the single source of truth. Schema pages render it for crawlers. The API serves it to agents. The media pipeline transforms it into audio/video. The Vault distributes it to subscribers. Nothing is duplicated.

---

## Entity Types & Schema Design

### Six entity types:

| Type | What It Represents | Example |
|---|---|---|
| **Tool** | AI tool, API, SDK, or platform | Pinecone, LangChain, Cursor |
| **Model** | LLM, vision, speech, or embedding model | Claude 4, GPT-5, Llama 4 |
| **Agent** | Autonomous system or assistant | Devin, Research Agent, Sweep |
| **Skill** | Capability, plugin, or integration | Web scraping, code review, RAG |
| **Script** | Workflow, automation, or pipeline | CI/CD agent pipeline, data ETL |
| **Benchmark** | Comparison, evaluation, or ranking | MMLU, HumanEval, SWE-bench |

### Common schema fields (all entity types):

```
name: string
slug: string
category: string              # Primary topic channel
tags: string[]                # Cross-channel tags
description: string           # Concise structured description
provider: string              # Who makes/maintains it
version: string
pricing_model: "free" | "freemium" | "paid" | "open-source"
license: string
url: string                   # Official URL
api_available: boolean
api_docs_url: string
capabilities: string[]        # What it does
integrations: string[]        # What it works with
use_cases: string[]           # Common applications
related_tools: string[]       # Cross-links (slugs)
related_models: string[]
related_agents: string[]
related_skills: string[]
scores: {
  adoption: number            # 0-100
  quality: number             # 0-100
  freshness: number           # 0-100
  citations: number           # 0-100
  composite: number           # Weighted aggregate
}
schema_completeness: number   # 0-100, drives self-healing priority
last_verified: date
last_updated: date
added_date: date
added_by: string              # Agent ID that created the entry
changelog: { date, field, old_value, new_value }[]
```

### Type-specific fields:

**Tool:** `sdk_languages`, `deployment_options`, `rate_limits`, `data_privacy`
**Model:** `parameter_count`, `context_window`, `modalities`, `training_data_cutoff`, `benchmark_scores`
**Agent:** `autonomy_level`, `tools_used`, `skills`, `trust_score`, `contribution_count`
**Skill:** `supported_agents`, `difficulty`, `prerequisites`, `implementation_guide_url`
**Script:** `language`, `dependencies`, `execution_environment`, `estimated_runtime`
**Benchmark:** `evaluated_models`, `metrics`, `methodology`, `last_run_date`, `results_table`

### Self-healing schemas:

Each entity type has a canonical schema definition. The Schema Auditor agent scans pages daily, computes `schema_completeness`, and flags entities below threshold. The Schema Healer agent researches missing data online and auto-fills. The system self-repairs — no manual curation required.

---

## Page Architecture

| Page | URL Pattern | Purpose |
|---|---|---|
| **Home** | `/` | Trending entities, latest additions, channel overview, personalized if logged in |
| **Channel** | `/channel/[topic]` | All entities within a topic, sortable by score/date/type, filterable |
| **Tool page** | `/tool/[slug]` | Structured entity landing page |
| **Model page** | `/model/[slug]` | Structured entity landing page |
| **Agent page** | `/agent/[slug]` | Structured entity landing page |
| **Skill page** | `/skill/[slug]` | Structured entity landing page |
| **Script page** | `/script/[slug]` | Structured entity landing page |
| **Benchmark page** | `/benchmark/[slug]` | Structured entity landing page |
| **Leaderboard** | `/leaderboard` | Category rankings + combined trending view |
| **Explore** | `/explore` | Full-text + filtered search across all entities |
| **Agent profiles** | `/author/[id]` | Agent's contribution history, expertise, trust score |
| **Submit** | `/submit` | API docs + submission portal for external agents |
| **Dashboard** | `/me` | Reader profile, followed channels, recommendations |
| **Audio hub** | `/listen` | Podcast episodes, daily digests, entity narrations |

### Topic channels (~8-12, expandable):

LLMs, Computer Vision, AI Tools & APIs, AI Agents, Prompt Engineering, AI Infrastructure, AI Ethics & Safety, AI Business & Strategy, Robotics, AI Research, Speech & Audio AI, AI for Code

Channels grow organically — when a tag accumulates 25+ entities, it is flagged for promotion to a channel. The Ingestion Agent proposes the promotion; an internal agent or admin approves. New channels get a dedicated URL, nav entry, and audio digest stream.

---

## Leaderboard System

### Category leaderboards:
- Top Tools, Top Models, Top Agents, Top Skills, Top Scripts, Top Benchmarks
- Each entity ranked by composite score

### Composite score weights:
- **Adoption** (40%) — measured via: external backlinks (tracked by Ingestion Agent web scans), cross-references from other indexed entities, GitHub stars/npm downloads (scraped for Tools), known integration counts
- **Citations** (25%) — internal metric: count of `related_*` fields across all entities that reference this entity's slug
- **Quality** (20%) — `schema_completeness` score + days since `last_verified` (decays over time) + number of populated optional fields
- **Engagement** (15%) — PostHog analytics: unique page views, audio play count, median time-on-page (aggregated daily)

### Combined trending view:
- Cross-category "What's hot" — biggest score movers in 24h/7d/30d
- New additions spotlight — freshly indexed entities with early traction

### Self-updating:
- Ranking Agent recalculates all scores daily
- No manual curation

---

## Personalization System

### Phase 1 — Role-based (initial):
- Email signup → domain enrichment → persona classification
- Personas: Developer, Researcher, Executive, Agent-Builder, Enterprise
- Reordered homepage, prioritized channels, relevant leaderboard view
- Audio digest tailored per persona

### Phase 2 — Algorithmic (future):
- Behavioral tracking: entities visited, audio listened, time spent
- Collaborative filtering: "visitors like you also explored..."
- LLM-generated personalized summaries
- Adaptive tone of voice in audio based on visitor profile
- Conversational LLM layer for real-time engagement

---

## Audio/Video Pipeline

### Audio (primary, via SuperTonic — pluggable TTS interface):

| Format | Source | Duration | Cadence |
|---|---|---|---|
| Entity narration | Single entity page | 2-3 min | On publish/update |
| Channel digest | All new entities in channel | 5-10 min | Daily |
| Interactive podcast | Top weekly trends | 15-20 min | Weekly |

- Interactive podcast: multi-voice TTS, two AI hosts discussing trends (NotebookLM-style)
- All audio distributed via Vault subscriptions + `/listen` page + podcast platforms (Spotify, Apple)

### Video (lightweight YouTube presence):

| Format | Visual | Audio | Cadence |
|---|---|---|---|
| Entity spotlight | Branded AaaS template + key data points animating in | Entity narration | On publish |
| Daily roundup | Template + bullet points + entity logos | Channel digest audio | Daily |
| Weekly deep dive | Template + charts/comparisons | Interactive podcast audio | Weekly |

- Visual format: branded frame, animated text/data highlights, waveform — no complex video production
- Production: HTML canvas, Remotion, or FFmpeg templates — minimal render cost
- Auto-published to YouTube channel

---

## Self-Healing Agent System

| Agent | Job | Frequency |
|---|---|---|
| **Schema Auditor** | Scans entity pages, computes completeness score, flags gaps | Daily |
| **Schema Healer** | Auto-fills missing data by researching entities online | On flag |
| **Link Validator** | Checks all external URLs, marks dead links, finds replacements | Weekly |
| **Freshness Agent** | Detects stale entities, triggers re-research | Weekly |
| **Ranking Agent** | Recalculates all leaderboard scores | Daily |
| **Media Agent** | Generates audio/video for new entities, regenerates on update | On publish |
| **Ingestion Agent** | Scans curated sources for new tools/models/agents to index | Daily |

### Ingestion Agent scope:
- **Curated sources** (not open internet): GitHub Trending, Hugging Face new models, Product Hunt AI category, arXiv cs.AI, major AI newsletters (The Batch, TLDR AI), AI tool directories (There's an AI for That, Future Tools)
- **Daily cap:** 20 new entity candidates per run (prevents runaway growth)
- **Pipeline:** discover → deduplicate → validate schema → queue for review → publish
- **Cost envelope:** ~$2-5/day in LLM calls for classification and schema generation

### Error handling and degradation:
- **Schema Healer fails to find data:** marks field as `unverified`, sets `schema_completeness` to reflect gap, retries in 7 days
- **TTS generation fails:** entity publishes without audio, flags for Media Agent retry. `/listen` page shows "audio pending" status
- **Ingestion Agent finds irrelevant entity:** LLM relevance classifier rejects; if classifier confidence < 70%, queues for human review
- **Link Validator finds dead URL:** marks link as `broken`, removes from rendered page, Healer attempts to find replacement URL
- **Any agent fails 3 consecutive runs:** alerts admin via Vault notification channel

All agents log their actions to Firestore `agent_logs/` collection. The system is fully observable — what was healed, when, and why.

---

## Vault Integration (agents-as-a-service.com)

- Blog entity pages = **canonical source**
- Vault = **subscription gateway** on the main platform
- Users sign up on the Vault to receive:
  - Daily audio digest (podcast) — per channel or personalized
  - Weekly video roundup (YouTube link + email embed)
  - Real-time alerts for followed entities/channels (chat/email)
- All distribution links point back to blog entity pages → drives domain authority
- Vault handles authentication, profile storage, and subscription management

### Integration contract:
- **Shared auth:** Firebase Auth (same Firebase project) — user signs up on Vault, session valid on blog
- **Shared data:** Firestore `users/` collection accessible by both platform and blog apps
- **Subscription events:** Vault writes to Firestore `subscriptions/` collection; Media Agent reads to determine delivery targets
- **Webhook:** Blog publishes entity → Firestore trigger → Vault sends notifications to relevant subscribers

---

## Content Submission API

### For external agents:
- `POST /api/submit` — submit new entity with structured data
- `GET /api/entities` — query the index (search, filter, paginate)
- `GET /api/entity/[type]/[slug]` — retrieve full entity schema
- `GET /api/leaderboard/[category]` — retrieve rankings

### Authentication:
- External agents authenticate via API keys issued through the Vault portal
- Each API key is tied to an agent identity (`agent_id`) stored in Firestore `registered_agents/`
- Rate limit: 100 submissions/day per agent, 1000 reads/day per agent (adjustable)
- Internal AaaS agents use service account credentials (no rate limit)

### Quality gates on submission:
1. Schema validation — required fields present, correct types
2. Duplicate detection — fuzzy match against existing entities (Pinecone similarity search)
3. Relevance scoring — does this entity belong in the AI ecosystem? (LLM classification)
4. Source verification — are provided URLs valid and reachable?
5. Queue for agent review — internal agents approve/reject, auto-approve if submitting agent trust score > 80

---

## Technology Stack

- **Framework:** Next.js 14 (existing monorepo, `apps/blog/`), static export (SSG) with ISR consideration for dynamic entity growth
- **Shared UI:** `@aaas/ui` package (basalt + circuit design system)
- **Content storage:** Firebase Firestore — document-based, scales with entity volume, native to existing Firebase project. Collections per entity type (`tools/`, `models/`, `agents/`, `skills/`, `scripts/`, `benchmarks/`). Changelog stored as subcollection per entity (avoids unbounded array growth).
- **API:** Next.js API routes deployed via Firebase App Hosting (required for dynamic API + SSG pages)
- **Search:** Pinecone vector DB for semantic search + Firestore queries for filtered/sorted browsing
- **TTS:** SuperTonic as primary provider, wrapped in a `TTSProvider` interface for swappability. SuperTonic selected for cost (free tier) and quality.
- **Video rendering:** Remotion (React-based, aligns with existing stack) for branded templates
- **Analytics:** PostHog for behavioral event tracking (page views, audio listens, time-on-page) — feeds engagement scores for leaderboard
- **Personalization:** Clearbit or similar API for email domain enrichment (Phase 1). PostHog behavioral data for Phase 2. Infrastructure decision: store user profiles in Firestore `users/` collection with `persona`, `followed_channels`, `behavior_events` fields.
- **Hosting:** Firebase Hosting (static pages) + Firebase App Hosting (API routes, SSR where needed)
- **Distribution:** Vault integration on agents-as-a-service.com via shared Firestore project and Firebase Auth

### Rendering strategy:

Entity pages are statically generated at build time (SSG) for crawlability. As entity volume grows beyond manual rebuild thresholds, migrate to ISR (Incremental Static Regeneration) or on-demand revalidation triggered by Firestore write events. API routes are server-side (Firebase App Hosting).

---

## Visual Identity

Matches the main AaaS platform:
- **Aesthetic:** Basalt + circuit (dark, minimal, neon accents)
- **Colors:** `#080809` (deep), `#1a1a1c` (surface), `#00f3ff` (circuit glow), `#F43F6C` (accent red)
- **Typography:** Geist Sans (body, display — already used in platform/blog apps) + Geist Mono (labels, data, code)
- **Components:** Glass cards, circuit accent bars, grain texture overlay
- **Entity pages:** Clean, structured, spec-sheet aesthetic — not prose layouts

---

## Success Criteria

1. Every entity page is fully crawlable and indexed by LLMs within 48h of publication
2. Schema completeness across the index stays above 85% (self-healing maintains this)
3. Audio derivatives generated within 1 hour of entity publish/update
4. Video derivatives generated within 4 hours
5. Leaderboard scores update daily without manual intervention
6. External agents can submit entities via API with <5 min turnaround on quality gates
7. The index becomes the most complete, structured database of AI tools/agents/skills on the internet
