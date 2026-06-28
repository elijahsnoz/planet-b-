# 12 · Component Library

Component-driven, React Server Components by default; client components only where interaction/motion demands. Small, composable, themed by [design tokens](05-design-system.md). Grouped by altitude.

## Primitives (tokens → atoms)
`Text` (serif/sans variants, scale), `Heading`, `Quote` (large editorial pull-quote), `Caption` (title·artist·materials·dims·year), `Button`/`Link` (oxblood, focus-visible ring), `Tag`/`Chip` (materials, role), `Divider` (hairline), `Seal` (the eye-mark), `Mark`/`Logo` (animated eye), `Icon` (minimal, custom — never clip-art), `VisuallyHidden`, `Skip-link`.

## Media
- **Plate** — framed artwork image w/ matting, zoom, mandatory caption + credit + alt.
- **Portrait** — 4:5 person image with consistent treatment.
- **VideoPlayer** — captions/transcript required, poster, no sound-autoplay, lazy + pause-offscreen.
- **AudioToggle** — global, opt-in ambient sound control.
- **Gallery** — responsive masonry/grid of Plates/Portraits.
- **MediaCredit** — renders credit/source/license consistently.

## Motion (client)
- **Breath** — the looping threshold breath.
- **Reveal** — enter-once rise+fade wrapper (reduced-motion aware).
- **ScrollScene** — scroll-linked transform stage (waste→art), with static fallback.
- **TickingWatch** — the urgency motif.
All read `prefers-reduced-motion` from one shared hook.

## Composite / domain
- **RegistryGrid** — the one filterable index used by Artists, Artworks, People (props: items, filters, cardType).
- **ExhibitLayout** — the one profile/record shell used by Artist, Artwork, Person (header + body + related rail).
- **PersonCard / ArtworkCard / PartnerCard** — registry cards.
- **TimelineImmersive** — sticky-scrubber Genesis timeline; nodes = `TimelineNode` (phase, media, people, artworks).
- **QuoteBlock** — artist's own words, attributed.
- **RelatedRail** — cross-links (artist↔artwork↔chapter↔certificate).
- **PartnerLockup** — co-branding (Planet B · Norway · Nike) per [brand hierarchy](07-brand-identity.md).
- **CertificateCard** + **VerifyBadge** — public certificate + ✓ verified / on-chain stub.
- **ImpactStat** — single metric tile (dashboard).
- **PressItem** — outlet, title, date, link.

## Layout & global
`Container`, `Section` (vertical rhythm), `Grid` (12/6/4), `EditorialMeasure` (66ch reading column), `Header`/`PrimaryNav` (fades in post-threshold), `Footer` (institutional index), `Breadcrumbs`, `LanguageSwitcher`, `Seo`/`Meta` (OG cards w/ mark).

## Conventions
- Server-first; `"use client"` only for Motion/AudioToggle/interactive filters.
- Every component takes data via typed props (mirrors schema types); no fetching inside leaf components.
- Each component ships with: types, a Storybook story, an a11y check, and reduced-motion behavior.
- Two templates (`RegistryGrid`, `ExhibitLayout`) cover ~80% of pages — resist bespoke layouts.
