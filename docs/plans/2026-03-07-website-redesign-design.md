# AaaS Website Redesign — Design Document

**Date:** 2026-03-07
**Status:** Approved
**Author:** Claude (brainstorming session)

---

## 1. Overview

Full redesign of the AaaS web presence across two domains:

- **agents-as-a-service.com** — Platform marketing site (6 pages)
- **aaas.blog** — Agent-driven blog (separate deployment, shared design system)

### Design Direction: "Living Ecosystem"

The site feels alive — subtle particle animations, glowing agent nodes, and micro-interactions throughout. Each page uses a multi-color palette to signal different agent domains. The visual language says "this platform is always working, always evolving."

### Primary Conversion Goal

All roads lead to **"Book a Call"** via Google Calendar link. Secondary CTAs direct to platform exploration and vault browsing.

### Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS 3.4
- Framer Motion (animations)
- shadcn/ui (component primitives)
- TypeScript
- Firebase App Hosting (deployment)
- Geist + Geist Mono (typography)

---

## 2. Brand Design System

### 2.1 Color Palette

| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| `--base` | `#060d1f` | 223 84% 5% | Page backgrounds |
| `--surface` | `#0f1729` | 223 40% 8% | Cards, elevated surfaces |
| `--surface-bright` | `#162037` | 223 35% 15% | Hover states, active cards |
| `--border` | `#1e2a45` | 223 30% 20% | Subtle borders |
| `--text` | `#f0f2f5` | 220 20% 95% | Primary text |
| `--text-muted` | `#8892a8` | 220 15% 60% | Secondary text |
| `--blue` | `#55b8ff` | 205 100% 67% | Primary CTAs, navigation, links |
| `--purple` | `#939aff` | 236 100% 80% | AI/agent elements, highlights |
| `--green` | `#69d4a6` | 155 55% 62% | Success, metrics, growth |
| `--pink` | `#ef97b1` | 345 75% 77% | Alerts, engagement, warmth |
| `--gold` | `#f8d974` | 45 90% 72% | Premium, featured, highlights |

Each accent has auto-generated variants:
- `--{color}-glow`: 15% opacity, for radial background effects
- `--{color}-subtle`: 8% opacity, for surface tints

### 2.2 Typography

| Role | Font | Weight | Size (desktop) |
|------|------|--------|----------------|
| Display (hero) | Geist | 700 | 64–80px |
| Heading | Geist | 600 | 36–48px |
| Subheading | Geist | 500 | 20–24px |
| Body | Geist | 400 | 16–18px |
| Caption/Label | Geist Mono | 400 | 12–14px |
| Code/Data | Geist Mono | 400 | 14px |

### 2.3 Component Primitives

- **Cards**: `--surface` bg, 1px `--border`, border-radius 16px, backdrop-blur on hover with accent glow
- **Buttons Primary**: `--blue` bg, white text, 48px height, border-radius 12px, subtle glow shadow
- **Buttons Secondary**: transparent bg, 1px `--border`, `--text` color, same dimensions
- **Badges/Pills**: accent color at 15% opacity bg, accent text, border-radius 999px
- **Section dividers**: gradient fade from `--border` to transparent, never hard lines

### 2.4 Motion Language

| Element | Animation | Duration |
|---------|-----------|----------|
| Agent nodes (hero) | Floating drift + pulse | 3–6s loop |
| Data flow lines | Traveling dot animation | 2s |
| Cards on scroll | Fade up + slight scale | 0.5s, staggered |
| Page transitions | Fade | 0.3s |
| Hover states | Scale 1.02 + glow appear | 0.2s |
| Numbers/metrics | Count-up on viewport enter | 1s |

### 2.5 Logo

Retain existing AaaS logo (PNG hosted on Firebase Storage). No modifications.

---

## 3. Site Architecture

### 3.1 Domain Split

```
agents-as-a-service.com/
├── /              (homepage)
├── /pricing       (three propositions)
├── /platform      (agentic offering deep-dive)
├── /projects      (Enora.ai + others)
├── /vault         (agentic database browser)
└── /collaborate   (invest / co-innovate)

aaas.blog/
├── /              (blog home)
├── /[channel]     (agent channel pages)
└── /[slug]        (individual posts)
```

### 3.2 Global Navigation

Fixed top bar, `--base` with backdrop-blur, 1px `--border` bottom.

**Desktop:**
```
[Logo] AaaS    Platform  Pricing  Projects  Vault  Collaborate    [Book a Call]
```

**Mobile:** Hamburger → full-screen overlay menu with staggered fade-in.

"Book a Call" is always visible as the primary CTA button in `--blue`.

### 3.3 Global Footer

```
[Logo] AaaS

Platform       Pricing         Projects     Vault       Collaborate
How it works   Retainer        Enora.ai     Browse      Invest
               Pay-per-task                 Search      Co-innovate
               Build w/AaaS

Blog (aaas.blog)    LinkedIn    GitHub

© 2026 Agent-as-a-Service · Privacy · Terms
```

---

## 4. Page Designs

### 4.1 Homepage (`/`)

**Purpose:** Explain what AaaS is, show it's alive, convert to "Book a Call."

**Sections (top to bottom):**

1. **Hero**
   - Left: Display heading "Your Autonomous Digital Workforce", subheadline explaining context-engineered AI agents, two CTAs (Book a Call + Explore Platform), optional social proof strip
   - Right: Canvas-rendered agent network animation — 8–12 nodes in accent colors, connected by animated lines with traveling dots, nodes pulse and show labels on hover
   - Background: Radial gradients `--blue-glow` top-right, `--purple-glow` bottom-left

2. **Value Proposition Strip**
   - Three keyword pills: "Context Engineering" (blue), "Tool Connectivity" (purple), "Agentic Work" (green)
   - One concise paragraph explaining the core value
   - Full-width, centered, `--surface` background

3. **Three Pillars**
   - Three equal cards: Context Engineering (blue), Connect Any Tool (purple), Execute Autonomously (green)
   - Each: accent icon, heading, short paragraph, "Learn more →" text link
   - Cards on `--surface`, accent glow on hover, fade-up on scroll

4. **How It Works — 4-Step Process**
   - Horizontal stepper: 01 Define → 02 Structure → 03 Create → 04 Iterate
   - Clicking a step reveals content panel with illustration/animation
   - Active step glows `--blue`, connected lines animate on progression
   - Step content:
     - Define: vision, mission, strategic fundamentals
     - Structure: qualitative → machine-readable conversion
     - Create: generate materials using contextualized agents
     - Iterate: continuous improvement via agent insights

5. **Who It's For — Use Case Tabs**
   - Horizontal pill selector: Startups, SMBs, Consultants, Corporate Innovation, University Programs
   - Each tab expands to show tailored value proposition + CTA
   - Active pill in `--gold`

6. **Social Proof / Metrics Strip**
   - Count-up numbers: "12+ Active Agents · 142k+ Skill Calls · 4 Live Projects"
   - Geist Mono for numbers, full-width `--surface` strip

7. **Final CTA Block**
   - "Ready to build your autonomous workforce?"
   - Two CTAs: Book a Call + Explore the Vault
   - Gradient background with `--blue-glow` + `--purple-glow`

---

### 4.2 Pricing Page (`/pricing`)

**Purpose:** Present three propositions, convert to "Book a Call."

**Sections:**

1. **Hero**
   - Centered heading: "Choose How You Work With Us"
   - Subtitle: "Three models designed around how your business operates."

2. **Three Pricing Cards**

   **A. Retainer + Tokens** (`--blue` accent)
   - Monthly fee + transparent token usage
   - Full platform access, all agents, context engineering, priority support
   - Best for: Ongoing operations
   - CTA: Book a Call

   **B. Pay-per-Task** (`--gold` accent, "Most Popular" badge)
   - Email-driven: send a task, get it done
   - Pay per agent execution, no commitment, transparent per-task cost
   - Best for: Testing AaaS or occasional needs
   - CTA: Book a Call
   - Card slightly elevated (scale 1.02), gold top border

   **C. Build with AaaS** (`--purple` accent)
   - Project-based proposal, then monthly retainer once live
   - Custom scope, equity option available, full build-out, ongoing maintenance
   - Best for: Startups needing a technical co-founder
   - CTA: Book a Call

3. **Comparison Table**
   - Features vs. plans matrix (Context Eng., Agent Access, Vault Access, Custom Agents, Priority Support, Equity Model, Billing)
   - Alternating row backgrounds, checkmarks in `--green`

4. **FAQ Accordion**
   - 4–6 questions: token billing, plan switching, equity model, onboarding timeline, what's included, support

---

### 4.3 Platform Page (`/platform`)

**Purpose:** Deep-dive into the ever-evolving agentic offering.

**Sections:**

1. **Hero**
   - "An Agentic System That Never Stops Evolving"
   - Subtitle about continuous scouting of GitHub, YouTube, Reddit
   - CTAs: Book a Call + See the Vault

2. **Evolution Loop Visual**
   - Animated circular flow: Scout → Evaluate → Integrate → Optimize → (repeat)
   - Each stage lights up sequentially in accent colors (blue → purple → green → gold)
   - Click/hover to expand detail for each stage
   - Scout: Crawl 50+ sources daily
   - Evaluate: Sandbox testing before production
   - Integrate: Deploy into user workflows
   - Optimize: Continuous performance improvement

3. **Capability Grid**
   - 6 cards in 3×2 grid, each with accent-colored icon:
     - Research (blue): market research, competitor analysis, trend scouting
     - Marketing (pink): content, social, email campaigns, LinkedIn viral loops
     - Analytics (green): KPI tracking, reporting, business intelligence
     - Sales (gold): outreach, CRM, lead scoring, pipeline management
     - Operations (purple): workflow automation, compliance, document management
     - Development (blue): code generation, testing, CI/CD, deployment
   - Cards flip or expand on click to show specific agent names and example tasks

4. **Adaptability Timeline**
   - Three-stage timeline: Week 1 → Month 1 → Month 3
   - Shows agent maturity progression: Basic agents deployed → Custom trained to context → Fully adapted digital workforce
   - Accent progression: blue → purple → green

5. **CTA Block**
   - "Your agents start learning from day one."
   - Book a Call

---

### 4.4 Projects Page (`/projects`)

**Purpose:** Showcase active AaaS-powered projects, invite collaboration.

**Sections:**

1. **Hero**
   - "What We're Building"
   - "Active projects powered by the AaaS platform."

2. **Featured Project: Enora.ai**
   - Large hero card with `--blue` accent border and glow
   - Title, description (manufacturing compliance & supply chain risk, ISO 9001)
   - Status badge: "Active" in `--green`
   - Domain tag, stack description
   - Link to Enora.ai site

3. **Other Projects Grid**
   - Standard-size cards for additional projects
   - Last card always: "Your Project?" CTA linking to `/collaborate`
   - Each card: project name, one-line description, status badge, domain tag

---

### 4.5 Vault Page (`/vault`)

**Purpose:** Browse the agentic database — the most comprehensive collection of agentic intelligence.

**Sections:**

1. **Hero**
   - "The Agentic Vault"
   - Subtitle about comprehensive collection of repos, tools, skills, frameworks, APIs, MCPs
   - Large centered search input with `--purple` focus glow

2. **Category Filters**
   - Horizontal pill bar: All, Repos, Tools, Skills, Frameworks, APIs, MCPs
   - Active filter in `--purple`

3. **Results Grid**
   - Cards showing: type badge (color-coded), name, key metric (stars, calls), category tag
   - Cards on `--surface` with accent-colored type badge
   - Real-time search filtering
   - Pagination: "Showing 24 of 4,200+ entries" + Load More button

4. **Vault Stats Strip**
   - "4,200+ Entries · 6 Categories · Updated Daily · Open Access"
   - Count-up animation, Geist Mono numbers

---

### 4.6 Collaborate Page (`/collaborate`)

**Purpose:** Attract investors and co-innovator founders.

**Sections:**

1. **Hero**
   - "Build the Future With Us"
   - Subtitle about investing, co-innovating, or using AaaS as technical co-founder

2. **Two Tracks — Side-by-Side Cards**

   **Invest** (`--gold` accent)
   - Back active projects, we handle tech, you provide capital + strategic guidance
   - Bullet points: Enora.ai (20% equity), new projects pipeline, transparent reporting
   - CTA: Book an Investor Call

   **Co-Innovate** (`--green` accent)
   - You bring idea + domain expertise, we bring agentic infrastructure
   - AaaS acts as technical co-founder
   - Bullet points: equity-for-service model, full platform access, continuous agent support
   - CTA: Apply as Co-Innovator

3. **How the Equity Model Works**
   - 3-step timeline: You bring the vision → We build with agents → Shared ownership, shared growth
   - Accent progression with connecting line animation

4. **CTA Block**
   - "Let's build something together."
   - Book a Call

---

### 4.7 Blog (`aaas.blog`)

**Purpose:** Agent-driven content hub. Each agent publishes to its niche channel.

Separate Next.js deployment sharing the same design system.

**Blog Home:**

1. **Navigation**
   - [Logo] AaaS.blog — [Channels dropdown] — [Search]
   - Cross-link to agents-as-a-service.com

2. **Featured Post**
   - Full-width hero card with large title, agent author badge (accent-colored), date, read time

3. **Agent Channels**
   - Horizontal scroll of channel cards: Research Agent, Marketing Agent, DevOps Agent, Strategy Agent, etc.
   - Each shows channel name, agent icon in accent color, post count

4. **Latest Posts Grid**
   - 3-column card grid
   - Each card: title, excerpt, agent author badge, date, read time, category tag

**Post Layout:**
- Max-width 720px content column
- Agent author card at top with accent color and description
- Table of contents sidebar on desktop
- Related posts from same agent channel at bottom
- Cross-link CTA to agents-as-a-service.com in footer area

---

## 5. Responsive Strategy

| Breakpoint | Layout |
|-----------|--------|
| Desktop (1280px+) | Full layouts as designed above |
| Tablet (768–1279px) | 2-column grids → stacked, hero side-by-side → stacked |
| Mobile (< 768px) | Single column, hamburger nav, full-screen menu overlay, touch-optimized cards (min 44px tap targets) |

- Agent network animation: simplified on mobile (fewer nodes, no hover interaction)
- Pricing cards: horizontal scroll on mobile
- Vault grid: 1 column on mobile, 2 on tablet
- All CTAs: full-width on mobile

---

## 6. Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Performance | 90+ |
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| Bundle size (JS) | < 200kb gzipped |

- Canvas animation lazy-loaded, fallback to static image
- All images via Next.js Image with WebP/AVIF
- Font subsetting for Geist
- ISR (Incremental Static Regeneration) for vault and blog pages

---

## 7. Deployment Architecture

```
agents-as-a-service.com
└── Firebase App Hosting (Next.js SSR)
    └── Firebase project: TBD (new or existing)

aaas.blog
└── Firebase App Hosting (Next.js SSR)
    └── Firebase project: studio-1743338608-800f1 (existing)
```

Both share:
- Same Git repository (monorepo with `/apps/platform` and `/apps/blog`)
- Shared design system package (`/packages/ui`)
- Shared Tailwind config and CSS variables
- Shared TypeScript types

---

## 8. Content Requirements

| Page | Content Needed |
|------|---------------|
| Homepage | Final hero copy, social proof data, use case descriptions |
| Pricing | Feature lists per plan, FAQ answers |
| Platform | Capability descriptions, agent names, source counts |
| Projects | Enora.ai description, other project details |
| Vault | Data source for vault entries (from vault_ls.txt), category taxonomy |
| Collaborate | Equity model details, application process |
| Blog | Initial posts from agents, channel definitions |

---

## 9. Key Decisions Made

1. **Visual direction**: Living Ecosystem — vibrant multi-color on dark base
2. **Domain split**: Platform on agents-as-a-service.com, blog on aaas.blog
3. **Hero concept**: Animated agent network constellation
4. **Tech stack**: Next.js 14 + Tailwind + Framer Motion + shadcn/ui + Firebase App Hosting
5. **Conversion goal**: Book a Call (Google Calendar) as primary CTA everywhere
6. **Logo**: Retained as-is
7. **Color palette**: Refined existing 5-accent palette with systematic tokens
