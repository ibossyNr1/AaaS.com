# AaaS Framework — Full Website Redesign Plan

**Date:** 2026-03-10
**Status:** Approved — Executing

## Approach: Design System Layer + Progressive Enhancement (Option C)

### Phase 1: Foundation Layer
- Design tokens update (accent-red #F43F6C, light mode, animations)
- Font migration (Geist → Inter + JetBrains Mono)
- Global visual layer (NoiseOverlay, CircuitBackground upgrade, ClickFlash, KineticBar)
- UI component upgrades (glassmorphism cards, button variants, mouse spotlight)
- Dark/light theme system

### Phase 2: Page Transformations
- Home: Orbital hero, bedrock section, live deploy feed, use case grid
- Platform: Metaball hero, capability grid, lock-on mechanism, model badges
- Pricing: Aura hero, tectonic plates, modular grid, enhanced FAQ
- Projects: Aura hero, bedrock featured project, bento grid
- Vault: Metaball hero, bento grid, self-optimizing repository section
- Collaborate: Aura hero, bedrock two-column, equity stepper, ambassador program
- Auth: Split-screen with circuit branding
- Legal: Bedrock monospace aesthetic

### Phase 3: Interactions & Animation Library
- Reusable hooks: useMouseSpotlight, useParallaxTilt, useScrollTheme, useCountUp
- Reusable components: OrbitalOrb, MetaballField, AuraBlobs, DeployFeed, TerminalFeed, DataTape, AgentRoster

### Phase 4: Polish
- Responsive, light mode, animation QA

## Key Decisions
- Templates (playground HTML files) remain untouched
- All playground modules translated to React + Tailwind
- accent-red: #F43F6C (dark) / #c9335a (light)
- Fonts: Inter (display/body) + JetBrains Mono (code/labels)
- "Carved Logic" renamed to "AaaS Framework" throughout
