# 16 · Development Roadmap

Phased so that **the Genesis Chapter is preserved and shareable early**, and the institution grows around it. Each phase ships something real.

## Phase 0 — Foundation & approval (this document set)
- Inspect the archive ✓ · produce the 16 founding documents ✓ · **await approval** ◻
- On approval: lock brand direction (logo concept), confirm Sanity-vs-admin decision, set up the repo, CI, Supabase project, Sanity project, design tokens.
**Exit:** approved strategy + empty-but-wired Next.js app with the design system.

## Phase 1 — The Archive Core (preserve Abuja)
- Ingest masters (catalogue, videos, plates) into `media` with checksums + metadata.
- Model + seed the Genesis Chapter: chapter, 15 artists + team + partners + panelists + performers, artworks, materials, timeline events, press.
- Build the two templates: **RegistryGrid** + **ExhibitLayout**.
- Ship: Home (static hero first), Genesis Chapter + timeline, Artist Registry & profiles, Artwork Registry & records, People, Partners.
- Accessibility + SEO baseline; reduced-motion paths.
**Exit:** a partner/embassy can proudly share a complete, beautiful Abuja archive.

## Phase 2 — The Experience (make them feel it)
- The cinematic threshold: breathing eye, ambient opt-in sound, the emotional scroll (waste→art ScrollScene) with static fallbacks.
- Logo/eye-mark animated; motion system fully applied at 60fps.
- Documentary Library + Video Archive (transcoded, captioned).
- Performance & Panel pages.
**Exit:** "I've never experienced anything like this."

## Phase 3 — Identity & Trust (certificates)
- Certificate system: IDs, permalinks, QR, PDF generation, `/verify` off-chain hash verification.
- Batch-issue founder certificates (consent-gated).
- Research page (citable records, catalogue download, methodology) + Press room (kit, fact sheet).
**Exit:** every founder has a permanent, verifiable Planet B identity; researchers can cite.

## Phase 4 — Knowledge & Reach
- Blog/Journal · Learning Hub (upcycling as practice, for educators) · Impact Dashboard (real metrics) · internationalization (en + Norwegian + Nigerian languages) · oral-history/interview capture pass.
**Exit:** the archive teaches and the impact is legible.

## Phase 5 — The Network & the Chain
- Chapter Network map + onboarding flow for new chapters (the model becomes replicable).
- Blockchain Phase 2→3: Merkle-anchor certificate hashes; later mint Soulbound certificates; `/verify` resolves on-chain.
- Full archival export pipeline + fixity automation (doc 15).
**Exit:** Planet B is a multi-chapter institution with independently verifiable provenance.

## Cross-cutting (every phase)
Performance budgets (fast on a mid-range phone in Abuja) · WCAG 2.2 AA · privacy/consent gating · backups & checksums · stable URLs · Storybook + a11y tests.

## Open decisions to confirm at Phase 0
1. Logo concept (A recommended). 2. Sanity-primary vs Postgres-primary+admin. 3. Hosting (Vercel suggested for Next.js) + media storage/CDN. 4. The 15th founding artist's name/work (verify from full catalogue plates). 5. Which roles receive certificates. 6. Domain & whether to pursue DOIs for citability.
