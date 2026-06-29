# 01 - Experience Audit

**Purpose.** A rigorous, honest, page-by-page reading of every public surface of
Planet B as it stands today, scored against the canon's 14 experience lenses, so
that Phase 3 spends its effort where the gap between "an impressive website" and
"a digital place unlike any other" is widest. This audit is observation only - it
proposes nothing and implements nothing; the UX Strategy (02) acts on it.

**Extends.** [docs/experience/01-experience-map.md](../experience/01-experience-map.md)
(the world-as-passages) and [docs/experience/02-emotional-journey.md](../experience/02-emotional-journey.md)
(the arc as spine). Governed by [docs/phase-3/00-README.md](00-README.md) (ground
truth, vocabulary, non-negotiables) and the tokens in
[tokens/tokens.css](../../tokens/tokens.css) / [tokens/motion.json](../../tokens/motion.json).

---

## Method

Each surface is scored on the canon's 14 lenses with a 3-band scale:

- **strong** - earns its place in a museum; reads as a world.
- **ok** - functional and clean, but reads as software, not a world.
- **weak** - actively undercuts the arc, the institution, or accessibility.

The 14 lenses: first impression, emotional impact, narrative clarity, motion
quality, performance, accessibility, typography, editorial quality, visual
hierarchy, navigation, discoverability, mobile, loading, transitions.

Two lenses score the same almost everywhere and are stated once here rather than
repeated per row:

- **Loading - weak, site-wide.** There is no `app/**/loading.tsx` and no
  `template.tsx` anywhere under `app/`. The Eye (`AliveEye`) is never a loading
  state. The `force-dynamic` artist/artwork pages
  ([app/(public)/artists/[slug]/page.tsx:9](<../../app/(public)/artists/[slug]/page.tsx>),
  [app/(public)/artworks/[slug]/page.tsx:10](<../../app/(public)/artworks/[slug]/page.tsx>))
  render server-side with no skeleton or Eye while the DB query resolves.
- **Transitions - weak, site-wide.** No route uses Next's `template.tsx` or any
  transition wrapper; [app/(public)/layout.tsx](<../../app/(public)/layout.tsx>)
  renders `children` directly. Every navigation is a hard cut. The canon's
  "gently revealed connections" do not exist between pages.

---

## Page-by-page

### Home - `app/(public)/page.tsx`

The strength of the whole site. The eight-beat arc
(Threshold -> WasteToArt -> Silence -> Reflection -> HopeShift -> Responsibility
-> Founders -> Invitation) maps almost exactly onto
[docs/experience/02](../experience/02-emotional-journey.md). The Threshold
([components/experience/Threshold.tsx](../../components/experience/Threshold.tsx))
withholds chrome and lets `AliveEye size={140}` dominate; `SiteHeader` correctly
stays hidden until the visitor descends past 0.6vh
([components/SiteHeader.tsx:31](../../components/SiteHeader.tsx)). `WasteToArt`
([components/experience/WasteToArt.tsx](../../components/experience/WasteToArt.tsx))
is the one genuinely cinematic, meaning-carrying scroll scene on the site, with a
real reduced-motion fallback (lines 41-52). `HopeShift` warms `#0b0b0c -> paper`
as a literal tonal turn (lines 15-16).

| Lens | Score | Note |
|---|---|---|
| First impression | strong | Darkness + breathing Eye + one line; no nav. |
| Emotional impact | strong | The arc lands beat by beat. |
| Narrative clarity | strong | Beats are labelled in code and felt in sequence. |
| Motion quality | strong | Scroll-linked transform/opacity only; reduced-motion paths exist. |
| Performance | ok | `WasteToArt` is `h-[240vh]` sticky scroll + 12 animated shards; needs a real INP/LCP budget (09). |
| Accessibility | ok | Good landmarks/skip link, but the quiet `text-muted` (stone) on paper is borderline for AA on small text. |
| Typography | strong | Fraunces display at `text-6xl` carries the monumental beats. |
| Editorial quality | strong | Copy is restrained and institutional. |
| Visual hierarchy | strong | One feeling per screen; whitespace separates beats. |
| Navigation | ok | Withheld-then-revealed header is right; but the only exits are the two Invitation links. |
| Discoverability | ok | Arc is linear by design; the four worlds are not signposted from here. |
| Mobile | ok | `min-h-[100svh]` beats stack; the 240vh scene needs device verification. |

The home is the benchmark. Everything below is measured against the question:
does it feel like it belongs to the same place as this page?

### Chapters index - `app/(public)/chapters/page.tsx`

A plain Tailwind link-list of bordered cards
([app/(public)/chapters/page.tsx:24-47](<../../app/(public)/chapters/page.tsx>)).
No `Reveal`, no `Plate`, no image, no motion. The copy ("a federation... built to
hold a hundred chapters over a hundred years") is excellent and institutional,
but the page renders it as a settings screen. **Bug:** it emits its own
`<main id="main">` (line 15) while [layout.tsx:14](<../../app/(public)/layout.tsx>)
already wraps `children` in `<main id="main">` - a nested landmark and a
duplicate `id`.

| Lens | Score | Note |
|---|---|---|
| First impression | weak | Reads as a list view, not a federation. |
| Emotional impact | weak | No descent, no place. |
| Narrative clarity | ok | Copy carries it; layout does not. |
| Motion quality | weak | None. |
| Accessibility | weak | Duplicate `<main id="main">`. |
| Typography | ok | `text-5xl` title; body is plain. |
| Editorial quality | strong | The prose is genuinely good. |
| Visual hierarchy | ok | Genesis card gets `border-accent/40` - the one nice touch. |
| Discoverability | ok | Counts (artists/artworks/certificates) hint at the graph but as plain text. |
| Mobile | ok | Single column, fine. |

### Chapter / Genesis - `app/(public)/chapters/abuja-2026/page.tsx`

The strongest of the Phase-2-era pages, because it actually uses the building
blocks: `Reveal`, `Plate`, `VideoPlayer`, a hero with a dimmed cover image
(line 41), proverbs, an immersive-ish timeline with a ruled left border
(lines 97-107), and portraits. This is the model for what an inner page can be.
But it is a long vertical document of stacked sections, not the canon's
"documentary-of-a-place" (the four-worlds model names Chapter as a documentary
surface). The timeline is a styled `<ol>`, not a descent; the hero does not feel
like arriving somewhere. No section transitions, no living chrome.

| Lens | Score | Note |
|---|---|---|
| First impression | ok | `data-theme="ink"` hero is atmospheric but static. |
| Emotional impact | ok | The proverbs and films carry weight; the frame is flat. |
| Narrative clarity | strong | Clear: theme -> voices -> timeline -> team -> films -> artists -> partners. |
| Motion quality | ok | `Reveal` on entry only; no scene like `WasteToArt`. |
| Performance | ok | Full-bleed cover `Image` + lazy `VideoPlayer` (preload=none) is responsible. |
| Accessibility | strong | Correct heading order, `VideoPlayer` no-autoplay, captioned figures. |
| Typography | strong | Best editorial type on an inner page. |
| Editorial quality | strong | Reads like a catalogue essay. |
| Visual hierarchy | ok | Even rhythm of `py-16` sections flattens emphasis. |
| Navigation | ok | Links out to registries; no within-chapter wayfinding. |
| Discoverability | ok | Rich, but relationships are link lists. |
| Mobile | ok | Grids collapse cleanly. |

### Stories index - `app/(public)/stories/page.tsx`

Pure utilitarian list. Bordered cards in a `max-w-3xl` column, no image, no
`Reveal`, no motion ([lines 26-43](<../../app/(public)/stories/page.tsx>)). The
dek calls these "narratives... meant to be explored, not browsed" - and then
presents them as a browse list, contradicting its own promise. **Bug:** own
`<main id="main">` (line 15), duplicating the layout's.

| Lens | Score | Note |
|---|---|---|
| First impression | weak | Blog index. |
| Emotional impact | weak | None. |
| Narrative clarity | ok | "kind" + dek + record count is informative. |
| Motion quality | weak | None. |
| Accessibility | weak | Duplicate `<main>`. |
| Discoverability | ok | `recordCount` teases the graph as text. |
| Editorial quality | ok | Copy good; presentation undercuts it. |

### Story - `app/(public)/stories/[slug]/page.tsx`

The most important missed opportunity on the site. A Story is the institution's
native long-form documentary, and the renderer is a `switch` over section kinds
(heading/prose/quote/record) in a `max-w-2xl` column
([lines 64-84](<../../app/(public)/stories/[slug]/page.tsx>)). The `record`
section - the literal place where the knowledge graph surfaces inside a narrative
- renders as a bordered card with an "Explore" arrow
([RecordCard, lines 25-42](<../../app/(public)/stories/[slug]/page.tsx>)). No
`Reveal`, no `Plate`, no imagery, no scroll choreography. **Bug:** own
`<main id="main">` (line 49).

| Lens | Score | Note |
|---|---|---|
| First impression | weak | Reads as a CMS article template. |
| Emotional impact | weak | A documentary rendered as a doc. |
| Narrative clarity | strong | Section model is sound and well-typed. |
| Motion quality | weak | None. |
| Accessibility | weak | Duplicate `<main>`; otherwise semantic. |
| Typography | strong | `quote` with `border-l-2 border-accent` is the one editorial moment. |
| Editorial quality | ok | The structure deserves a cinematic frame. |
| Discoverability | strong-on-data/weak-on-feel | Inline records ARE the graph - but invisible as graph. |

### Artists index - `app/(public)/artists/page.tsx`

In good shape relative to its siblings: it uses `Reveal` and the `RegistryGrid`
component with images via `Plate`
([lines 24-46](<../../app/(public)/artists/page.tsx>)), and the "fifteenth
founding artist" note (lines 37-43) is a quietly powerful editorial choice
(accuracy over completeness made visible). It is a clean gallery grid - "ok"
because it is a grid, not yet "a gallery that breathes" per
[experience/01](../experience/01-experience-map.md).

| Lens | Score | Note |
|---|---|---|
| First impression | ok | Dignified registry. |
| Emotional impact | ok | Faces help; grid is static. |
| Motion quality | ok | `Reveal` on entry only. |
| Accessibility | ok | No duplicate-main bug here (renders a `<div>`). |
| Typography | strong | `text-5xl` title, museum captions. |
| Editorial quality | strong | The fifteenth-artist note. |
| Visual hierarchy | ok | Uniform grid; no featured/lead. |
| Discoverability | ok | Goes only to detail pages. |

### Artist - `app/(public)/artists/[slug]/page.tsx`

Uses `ExhibitLayout`, the one real record template - the right call. But it is
the clearest site of the **dual-source seam** the canon flags: the hero pulls
from JSON via `lib/data` (`getPerson`, `getArtwork`, `personImage`, lines 27-31)
while every relationship section pulls from the DB via
`artistService.profile()` (line 33). Works/chapters/stories/collaborators/
certificates all render as `Section` -> bulleted `<Link>` lists
([lines 78-166](<../../app/(public)/artists/[slug]/page.tsx>)). This page holds
the richest graph on the site - and shows it as five plain lists. `force-dynamic`
(line 9) means no loading state covers the DB round-trip.

| Lens | Score | Note |
|---|---|---|
| First impression | strong | `ExhibitLayout` hero is genuinely museum-grade. |
| Emotional impact | ok | The person is honoured; the connections feel like a sitemap. |
| Narrative clarity | ok | Sections are clear but undifferentiated. |
| Motion quality | ok | `Reveal` in `ExhibitLayout` only. |
| Performance | weak | `force-dynamic` + dual fetch + no loading state. |
| Accessibility | ok | `Section` uses `h3`; check single `h1` per page. |
| Typography | strong | Inherits `ExhibitLayout`. |
| Editorial quality | ok | Body is good; the link-lists read as software. |
| Discoverability | ok | Everything is reachable; nothing is revealed. |
| Loading | weak | See site-wide. |

### Artworks index - `app/(public)/artworks/page.tsx`

Structurally identical to the artists index (`Reveal` + `RegistryGrid` + `Plate`,
[lines 24-38](<../../app/(public)/artworks/page.tsx>)). Same "ok": a clean
catalogue grid, not yet the breathing gallery wall the four-worlds model names
(Artwork = the gallery wall). No filtering by material/medium despite the data
supporting it.

| Lens | Score | Note |
|---|---|---|
| First impression | ok | Catalogue grid. |
| Motion quality | ok | Entry `Reveal` only. |
| Typography | strong | Consistent with artists index. |
| Discoverability | weak | No facets (material, medium) though the data has them. |
| Visual hierarchy | ok | Uniform; no hero work. |

### Artwork - `app/(public)/artworks/[slug]/page.tsx`

The best-conceived record on the site. `ExhibitLayout` hero plus a **Provenance**
timeline ("History accumulates; nothing is overwritten",
[lines 82-102](<../../app/(public)/artworks/[slug]/page.tsx>)) - this is the
institution's idea made visible and is genuinely distinctive. But it is the same
dual-source seam (JSON `getArtwork` hero, DB `artworkService.profile` sections)
and the same `force-dynamic` no-loading issue. Provenance, certificates, and
stories are again `<ol>`/`<ul>` link lists; the artwork - "the hero" per
non-negotiable 5 - sits in a square `Plate` and never gets a true gallery-wall
moment (no zoom, no detail crops, no breath).

| Lens | Score | Note |
|---|---|---|
| First impression | strong | `ExhibitLayout` + provenance concept. |
| Emotional impact | ok | The object deserves more reverence/scale. |
| Narrative clarity | strong | Statement -> significance -> provenance is a clear life. |
| Motion quality | ok | Entry `Reveal` only. |
| Performance | weak | `force-dynamic`, dual fetch, no loading. |
| Typography | strong | Inherited. |
| Editorial quality | strong | Provenance copy is excellent. |
| Discoverability | ok | Materials/certs/stories present as lists. |
| Loading | weak | See site-wide. |

### Passport - `app/(public)/passport/[id]/page.tsx`

Conceptually the richest surface - "a life / museum archive" in the four-worlds
model - and visually the most utilitarian. A `max-w-3xl` column of `Section`
blocks (certificates, artworks, contribution timeline, chapters), every one a
bordered/divided list ([Section, lines 15-25; body 59-137](<../../app/(public)/passport/[id]/page.tsx>)).
No portrait, no `Plate`, no `Reveal`, no Eye-as-passport-mark (the canon names
the Eye as the passport mark, and it is absent here). The "Genesis Contributor"
pill (lines 39-43) is the only ceremony. **Bug:** own `<main id="main">`
(line 32). The counts sentence (lines 53-57) renders the entire graph of a life
as one run-on line of numbers.

| Lens | Score | Note |
|---|---|---|
| First impression | weak | An account page, not a life. |
| Emotional impact | weak | A life rendered as a CRUD detail view. |
| Narrative clarity | ok | Sections are labelled and ordered. |
| Motion quality | weak | None. |
| Accessibility | weak | Duplicate `<main>`. |
| Typography | ok | `text-5xl` name; body is dense. |
| Editorial quality | ok | "record of contribution, not a social profile" copy is good. |
| Visual hierarchy | weak | Four near-identical list blocks. |
| Discoverability | strong-on-data | Certs -> verify, works -> artwork, chapters -> chapter: the graph is all here, as lists. |
| Loading | weak | See site-wide. |

### Verify - `app/(public)/verify/page.tsx`

Clean, correct, and honest (the six `VerifyStatus` states with distinct
tones/blurbs are well done, [lines 12-46](<../../app/(public)/verify/page.tsx>);
the off-chain/on-chain "planned (Solana)" line is admirably candid, line 92).
But verification is a trust ceremony and this is a search box and a results card.
The Eye - named in the canon as the verification seal - is absent; the verified
state has no moment of weight. **Bug:** own `<main id="main">` (line 107).

| Lens | Score | Note |
|---|---|---|
| First impression | ok | Trustworthy, plain. |
| Emotional impact | weak | No ceremony in the verified state. |
| Narrative clarity | strong | Status taxonomy is clear and complete. |
| Motion quality | weak | None. |
| Accessibility | ok | Labelled input; but duplicate `<main>`. |
| Typography | ok | Mono IDs read well. |
| Editorial quality | strong | Honest blockchain framing. |
| Visual hierarchy | ok | Result card is scannable. |

### Certificates - `app/(public)/certificates/page.tsx`

A divided list of rows, each with a small `PlanetBMark` (lines 23-42). Uses
`Reveal` on the header only. The "reserved" seat for the fifteenth artist
(lines 43-46) is again a fine editorial detail. It is a registry table; for a
surface the experience-map calls "Legacy / identity" it has no gravity, no
ceremony, no link from a certificate row to the verify flow or the person.

| Lens | Score | Note |
|---|---|---|
| First impression | weak | A table. |
| Emotional impact | weak | Identity rendered as rows. |
| Motion quality | weak | Header `Reveal` only. |
| Typography | ok | Mono IDs; display names. |
| Editorial quality | strong | The reserved-seat note. |
| Discoverability | weak | Rows do not link to verify or to the person. |
| Visual hierarchy | ok | Status right-aligned, scannable. |

---

## Cross-cutting findings (the canon's named gaps, confirmed in code)

1. **The home arc already works** - and is the only place that does. It is the
   strength to protect and the bar to raise the rest to.
   ([app/(public)/page.tsx](<../../app/(public)/page.tsx>)).
2. **Phase-2 pages are utilitarian.** Stories, Stories/[slug], Chapters index,
   Passport, Verify, Certificates are plain-Tailwind link-lists with no `Reveal`,
   no `Plate`, no motion, no cinematic frame.
3. **No page transitions.** No `template.tsx` exists; navigation is a hard cut.
4. **The knowledge graph is invisible.** Every edge - works, chapters, stories,
   collaborators, certificates, provenance - renders as a bulleted `<Link>` list
   (see Artist/Artwork/Passport sections; Story's `RecordCard`).
5. **No loading / Eye state.** No `loading.tsx`; the Eye is never a loader,
   verification seal, passport mark, or certificate watermark, though the canon
   names all of these.
6. **Token duplication, and drift.** [tokens/tokens.css](../../tokens/tokens.css)
   and [app/globals.css](../../app/globals.css) both declare the palette + motion
   `:root`. They have already diverged: `tokens.css` defines `--pb-radius-*`, the
   full `--pb-fs-*` type scale, `--pb-space-*`, `--pb-reveal-rise`,
   `--pb-stagger`, and font order `Canela, Fraunces, ...`; `globals.css` omits
   those tokens and uses `var(--font-display), Canela, ...`. Manual sync is
   already failing.
7. **JSON-vs-DB dual source.** Artist and Artwork detail pages read the hero from
   JSON (`lib/data`) and the sections from the DB (`@domains/*`) in the same
   render - a seam to resolve.
8. **Duplicate `<main id="main">` (new, concrete a11y bug).** The public layout
   wraps `children` in `<main id="main">`, yet Stories, Stories/[slug], Chapters
   index, Passport, and Verify each render their own `<main id="main">`. Result:
   nested `main` landmarks and a repeated DOM `id` (invalid; breaks the skip-link
   target's uniqueness).

---

## Prioritized findings table

Severity: **P1** undercuts the mandate or breaks a non-negotiable - **P2**
reads as software, not a world - **P3** polish.

| # | Sev | Surface | Issue | Primary lens |
|---|---|---|---|---|
| 1 | P1 | Stories, Story, Chapters idx, Passport, Verify | Duplicate / nested `<main id="main">` (a11y + invalid id) | Accessibility |
| 2 | P1 | Passport | "A life" rendered as four CRUD list blocks; no portrait, no Eye-mark | Emotional impact |
| 3 | P1 | Story | Native documentary rendered as a CMS `switch`; records are flat cards | Editorial quality |
| 4 | P1 | Site-wide | Knowledge graph invisible - all edges are bulleted link lists | Discoverability |
| 5 | P1 | Artist, Artwork | `force-dynamic` + dual fetch with no loading/Eye state | Performance / Loading |
| 6 | P2 | Site-wide | No page transitions; every nav is a hard cut | Transitions |
| 7 | P2 | Chapters index, Stories index, Certificates | Plain link-lists; no `Reveal`/`Plate`/image/motion | First impression |
| 8 | P2 | Verify | Trust ceremony rendered as search box; no Eye-as-seal moment | Emotional impact |
| 9 | P2 | Artist, Artwork | JSON-hero vs DB-sections dual source seam | Narrative clarity |
| 10 | P2 | Artworks index | No material/medium facets though data supports them | Discoverability |
| 11 | P2 | Chapter / Genesis | Long stacked-section document, not a documentary-of-a-place | First impression |
| 12 | P3 | Tokens | `tokens.css` / `globals.css` duplicated and already drifting | (infra) |
| 13 | P3 | Certificates | Rows do not link to verify or to the person | Navigation |
| 14 | P3 | Home | `WasteToArt` 240vh scene needs a measured INP/LCP budget on device | Performance |
| 15 | P3 | Site-wide | Quiet stone-on-paper muted text borderline for AA at small sizes | Accessibility |

---

## What to protect (do not "improve")

- The Threshold's withholding of chrome and the scroll-revealed `SiteHeader`.
- `WasteToArt` and `HopeShift` as the two meaning-carrying scenes - and their
  reduced-motion fallbacks.
- The reduced-motion architecture in [tokens/tokens.css](../../tokens/tokens.css)
  (collapses every duration) - it is the model for everything Phase 3 adds.
- The editorial copy throughout (federation, fifteenth artist, provenance,
  reserved seat, honest blockchain framing). The words are already museum-grade;
  it is the frames around them that read as software.

---

## Open questions for approval

1. **Severity ranking.** Is "the Passport feels like a life" (#2) genuinely P1
   alongside the accessibility bug (#1), or is it the marquee P1 of Phase 3 and
   everything else supports it?
2. **The duplicate-`<main>` fix** is a one-line correctness change, not design.
   May we treat it as a pre-Phase-3 hotfix rather than waiting for the package?
3. **Dual source.** Should artist/artwork heroes move fully to the DB
   (`@domains/*`) so JSON is build-time-only, or is JSON the intentional fast
   hero with DB as the living tail? This decides whether #5 and #9 are one fix.
4. **Graph visibility.** Is the goal a literal visual graph somewhere, or
   "relationships revealed as you read" woven into existing surfaces (no new
   graph page)? The strategy (02) assumes the latter unless told otherwise.
5. **Scope confirmation.** Are `origin`, `partners`, `research`, `press` (stubs
   present, not audited here) in scope for Phase 3, or out until they have
   content?
