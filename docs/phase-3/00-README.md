# Phase 3 · The Experience — Design Package

> **Status: DESIGN — awaiting approval. No UI ships from this package until the founder approves.**
> This package *extends* the Phase 1 experience docs ([docs/experience/](../experience/)) and the design tokens ([tokens/](../../tokens/)). It never duplicates them; where one already covers something, Phase 3 references and amends it.

Read [docs/00-PRINCIPLES.md](../00-PRINCIPLES.md) first — the constitution overrides everything here. The institutional architecture (Phase 2: registry · certificate · verification · passport · chapter · story · artwork · artist, all on one knowledge graph) is **complete**. Phase 3 does not add backend domains. It makes the institution *felt*.

---

## The mandate

> "When someone closes Planet B, I don't want them to say 'that was an impressive website.' I want them to say 'I've never experienced a digital place quite like that.'"

We are designing **emotion**, not screens. Every interaction moves the visitor along one arc:

`Curiosity → Wonder → Reflection → Responsibility → Hope → Action`

The experience itself must communicate the philosophy. **Architecture first, experience second** — that order produced the foundation; it now governs how we reveal it.

---

## Ground truth (what actually exists today — cite these, don't invent)

**Tokens** ([tokens/tokens.css](../../tokens/tokens.css) and a *drifted partial copy* in [app/globals.css](../../app/globals.css) — see findings: `globals.css` is the sheet that actually loads and it omits the `--pb-fs-*` type scale, `--pb-space-*`, `--pb-reveal-rise`, `--pb-stagger`, and radius tokens):
- Palette: `ink #0B0B0C` · `paper #F6F3EC` · `oxblood #6E1414` (accent) · `clay #7A5C3E` · `stone #9B978E` · `mist #E7E2D7` · `signal #2FA36B` (verified/impact only). **Artworks supply the color; the chrome stays quiet.**
- Type: display = Canela→**Fraunces** (actual, via next/font), text = Söhne→**Inter**, mono = **JetBrains Mono**. (Canela/Söhne are aspirational licenses; Fraunces/Inter ship today.)
- Motion: durations `instant 120 · base 240 · slow 480 · cine 900 · breath 6000ms`; easings `standard cubic-bezier(.2,0,0,1)`, `exit`, `breath ease-in-out`; `reveal-rise 24px`, `stagger 50ms`. Full reduced-motion override already collapses every duration to ~0 ([tokens.css](../../tokens/tokens.css), [motion.json](../../tokens/motion.json)).
- `[data-theme="ink"]` is the dark "threshold" surface (brightens oxblood for contrast).

**The Eye** — `AliveEye` ([components/experience/AliveEye.tsx](../../components/experience/AliveEye.tsx)) breathes (1.0→1.03) and blinks; `PlanetBMark` ([components/PlanetBMark.tsx](../../components/PlanetBMark.tsx)) is the logo. Used on home + header + footer. **Not yet** a loading state, transition motif, verification seal, passport mark, or certificate watermark.

**Home** ([app/(public)/page.tsx](<../../app/(public)/page.tsx>)) already stages the arc in eight beats: `Threshold → WasteToArt (scroll) → Silence → Reflection (TickingWatch) → HopeShift (scroll) → Responsibility (AliveEye) → Founders → Invitation`. Components: `Threshold`, `WasteToArt`, `HopeShift`, `TickingWatch`, `AliveEye`, plus `Reveal`, `Plate`, `ExhibitLayout`, `RegistryGrid`, `SiteHeader`, `SiteFooter`.

**Reusable building blocks:** `Reveal` (rise+fade once, staggered) · `Plate` (museum matting, fit cover/contain) · `ExhibitLayout` (artist/artwork detail shell) · `RegistryGrid`.

**The gap (where it still reads as software, not a world):**
- The Phase-2 domain pages — **Stories** (`/stories`, `/stories/[slug]`), **Passport** (`/passport/[id]`), **Chapters** (`/chapters`, admin), **verify** — are clean but utilitarian: plain Tailwind, link-lists, no `Reveal`/`Plate`/motion, no cinematic layout. They do not yet feel like an exhibition, a documentary, or a life.
- **No page transitions** (default hard navigation); relationships are plain link lists, not "gently revealed connections."
- The **knowledge graph is invisible** to visitors — edges exist in data but surface as bulleted links.
- **No ambient-sound architecture**; **no loading experience** built around the Eye.
- Tokens are **duplicated** in `tokens.css` + `globals.css` (manual sync) — an experience-infra debt.
- Public artist/artwork pages now read **JSON (lib/data) for the hero but DB (domains) for sections** — a dual-source seam to resolve.

---

## Non-negotiables (every artifact assumes these)

1. **60fps or it doesn't ship.** Animate only `transform` + `opacity`. Every transition must *earn its existence* (carry meaning), never decorate.
2. **Reduced-motion is a first-class path**, never an afterthought — the emotional arc must still read as a quiet sequence with motion disabled.
3. **Accessibility is part of beauty.** WCAG 2.2 AA minimum on the public site; keyboard-complete; semantic landmarks; the museum's quiet contrast is intentional but must still pass on text.
4. **No autoplay sound, ever.** Sound is opt-in; silence is a design tool.
5. **The artwork/record is the hero.** Chrome recedes. The Eye unifies quietly.
6. **Performance is experience.** Hold a real budget (LCP, INP, CLS, JS weight) — Phase 3 adds atmosphere without bloat.
7. **No invented content.** Atmosphere and motion only; never fabricate facts, quotes, or media (Principle VI).

---

## Canonical vocabulary (use these exact names across artifacts)

- **The Threshold** — the arrival moment (home top); crossing *into* Planet B.
- **The Eye** — the unifying motif (`AliveEye`/`PlanetBMark`): navigation · loading · verification seal · passport mark · certificate watermark · transition motif · institutional symbol.
- **The Breath** — the 6s 1.0→1.03 loop; the heartbeat (`pb-breath`).
- **The emotional arc** — Curiosity→Wonder→Reflection→Responsibility→Hope→Action.
- **The four worlds** — the cinematic surfaces: **Home** (documentary), **Chapter** (documentary-of-a-place), **Passport** (a life / museum archive), **Artwork** (the gallery wall). Plus **Graph Discovery** (the connective tissue).
- **Living chrome** — subtle environmental systems (dust, light, atmosphere, day/night tone) that make it *alive, not animated* — meaningful, never decorative.
- **Quiet by default** — space, silence, slowness; the visitor decelerates.

---

## The 14 artifacts (this package)

| # | Artifact | File | Extends (Phase 1) |
|---|----------|------|-------------------|
| 1 | Experience Audit | [01-experience-audit.md](01-experience-audit.md) | experience/01, /02 |
| 2 | UX Strategy | [02-ux-strategy.md](02-ux-strategy.md) | experience/01 |
| 3 | Motion Language | [03-motion-language.md](03-motion-language.md) | experience/03; tokens/motion.json |
| 4 | Navigation Philosophy | [04-navigation-philosophy.md](04-navigation-philosophy.md) | experience/07 |
| 5 | Visual Storytelling System | [05-visual-storytelling-system.md](05-visual-storytelling-system.md) | experience/08 |
| 6 | Interaction Principles | [06-interaction-principles.md](06-interaction-principles.md) | experience/10 |
| 7 | Editorial Design Guide | [07-editorial-design-guide.md](07-editorial-design-guide.md) | 05 design-system; tokens |
| 8 | Accessibility Review | [08-accessibility-review.md](08-accessibility-review.md) | — |
| 9 | Performance Budget | [09-performance-budget.md](09-performance-budget.md) | — |
| 10 | Homepage Experience Blueprint | [10-homepage-blueprint.md](10-homepage-blueprint.md) | experience/04 |
| 11 | Chapter Experience Blueprint | [11-chapter-blueprint.md](11-chapter-blueprint.md) | — |
| 12 | Passport Experience Blueprint | [12-passport-blueprint.md](12-passport-blueprint.md) | phase-2/04 |
| 13 | Artwork Experience Blueprint | [13-artwork-blueprint.md](13-artwork-blueprint.md) | — |
| 14 | Knowledge Graph Discovery Experience | [14-graph-discovery.md](14-graph-discovery.md) | phase-2/03 |

The **Eye system** (loading/seal/watermark/transition) and **Sound architecture** (opt-in ambience) are specified within Motion Language (3), Interaction Principles (6), and the four blueprints (10–13) rather than as separate files.

---

## Cross-cutting findings the audit surfaced (incl. real bugs)

The design pass independently converged on these. The starred (★) items are genuine defects, not design opinions — small, reversible fixes worth doing as a **Wave 0** before any cinematic work. **No code has been changed; these await approval.**

1. ★ **Nested `<main id="main">` (accessibility, P0).** [app/(public)/layout.tsx](<../../app/(public)/layout.tsx>) already renders `<main id="main">`, yet [verify](<../../app/(public)/verify/page.tsx>), [stories](<../../app/(public)/stories/page.tsx>), [stories/[slug]](<../../app/(public)/stories/[slug]/page.tsx>), [passport/[id]](<../../app/(public)/passport/[id]/page.tsx>), and [chapters](<../../app/(public)/chapters/page.tsx>) each render their **own** `<main id="main">` → nested landmarks + duplicate DOM id (breaks the skip-link target). Fix: those pages return a fragment/`<div>`, not `<main>`.
2. ★ **Body/secondary text fails WCAG AA contrast (P0).** `--pb-text-muted = stone #9B978E` ≈ **2.63:1** on paper (needs 4.5:1) — used pervasively (Plate captions, SiteFooter, ExhibitLayout, home). `signal` green verified-text ≈ 2.88:1. Ink-surface accent `#9B2B2B` ≈ 2.6:1 for links. The "quiet chrome is intentional" rationale has leaked into a real failure. Fix: darken the muted/stone public token (the admin already did this under `.pb-admin`).
3. ★ **Token drift (P1).** [tokens/tokens.css](../../tokens/tokens.css) defines the `--pb-fs-*` type scale, `--pb-space-*`, `--pb-reveal-rise`, `--pb-stagger`, radii — but [app/globals.css](../../app/globals.css) (the sheet that loads) omits them, and [tailwind.config.ts](../../tailwind.config.ts) exposes no `fontSize`/`lineHeight` scale, so components fall back to raw Tailwind sizes. Fix: single source of truth (import tokens.css, or generate globals from it).
4. ★ **Stale public nav (P1).** [SiteHeader](../../components/SiteHeader.tsx) omits Stories, Verify, and Passport (shipped Phase-2 surfaces); the footer links `/certificates` and `/chapters` whose route status needs confirming. There is no dynamic `/chapters/[slug]` (only the hardcoded `abuja-2026`).
5. **`force-dynamic` on the hero pages (P1, perf).** artist/artwork detail pages are `force-dynamic`, removing route caching on exactly the surfaces that should paint fastest. Move to ISR + on-demand revalidation from admin mutations.
6. **JSON-vs-DB dual source (P2).** Artist/Artwork heroes read JSON (`lib/data`); their sections read the DB (`@domains/*`). Single-source from the domain (`artworkService.profile` already carries every hero field).
7. **`signal` green misused as decoration (P2).** `WasteToArt` shard palette includes `signal #2FA36B`; canon reserves it for verified/impact only. Recolor shards to neutrals.
8. **The Eye is not yet the seal/mark/loader/transition.** Specified across [03](03-motion-language.md), [12](12-passport-blueprint.md), [13](13-artwork-blueprint.md) — net-new experience work, not a bug.

## How to read this package

Audit (1) → Strategy (2) → the systems (3–9) → the four blueprints + graph (10–14). Every artifact opens with a one-paragraph **Purpose**, a **Extends** line, references **real components/tokens by path**, ends with **Open questions for approval**, and proposes changes as **reversible, build-green, reduced-motion-safe** increments. Diagrams are ASCII so they outlive tooling. Nothing here is implemented until approved.
