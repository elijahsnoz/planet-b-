# 05 · Visual Storytelling System

> **Status: DESIGN — awaiting approval.** Nothing here ships until the founder
> approves. DESIGN ONLY: this artifact defines layout primitives and rules; it
> proposes no code. The record/artwork is the hero; chrome stays quiet.

## Purpose

The system for turning a Planet B record into **cinematic narrative** — the way
a premium museum catalogue, a long-form visual essay, or a documentary turns
objects into a felt sequence. It defines reusable **narrative layout
primitives** (full-bleed moment, single-object "let it land" beat, two-column
exhibit, pull-quote, scrollytelling sequence, caption/credit system, plate
matting + figure numbering) and the **art-direction rules** (aspect ratios,
focal points, formats, whitespace rhythm) that make Story sections read as
exhibition modules rather than a blog. Inspired by — never imitating — NYT
visual stories, Google Arts & Culture, National Geographic, and museum
catalogues: the reference is the *restraint and pacing*, not the brand.

## Extends

- **EXTENDS** [docs/experience/08-scroll-narrative.md](../experience/08-scroll-narrative.md)
  — Phase 1 set the *grammar* ("scroll = descent," beats not pages, pinning is
  precious, native-scroll-never-hijacked, reduced-motion = calm vertical read).
  Phase 3 turns that grammar into named, reusable record-level primitives.
- **Builds on** [docs/05-design-system.md](../05-design-system.md) (imagery
  rules: matting, crop ratios, no stock/clipart) and the canon palette/type/
  motion tokens in [tokens/tokens.css](../../tokens/tokens.css) /
  [app/globals.css](../../app/globals.css).
- **Reuses existing components**: [components/Plate.tsx](../../components/Plate.tsx),
  [components/ExhibitLayout.tsx](../../components/ExhibitLayout.tsx),
  [components/RegistryGrid.tsx](../../components/RegistryGrid.tsx),
  [components/Reveal.tsx](../../components/Reveal.tsx).
- **Targets** the current utilitarian story renderer
  [app/(public)/stories/[slug]/page.tsx](<../../app/(public)/stories/[slug]/page.tsx>),
  whose section kinds (`heading | prose | quote | record`) are fixed by
  [src/domains/story/story.types.ts](../../src/domains/story/story.types.ts).
  No new section kinds are invented; this maps the four that exist onto
  exhibition modules.

---

## The seven narrative primitives

Each primitive is a *beat*: one feeling, generous air around it
([08](../experience/08-scroll-narrative.md): "beats, not pages"). All animate
only `transform` + `opacity` and resolve to a static layout under
`prefers-reduced-motion` (canon non-negotiables 1, 2). All build on `Reveal`
and `Plate` so motion + matting stay consistent.

### 1 · Full-bleed moment (`SILENCE` beat)

The work fills the viewport edge-to-edge; the page goes quiet around it.
Used for the single most important image in a story, and the `SILENCE` beat on
home ([08](../experience/08-scroll-narrative.md)).

```
┌──────────────────────────────────────────────┐ 100vw
│                                              │
│                                              │
│               [ the work ]                   │  ~90–100vh
│                                              │
│                                              │
│  Fig. 03 · Title, artist · 2026   (lower-L)  │  caption floats, --pb-stone
└──────────────────────────────────────────────┘
            ↓ long empty travel (--pb-space-10)
```

- Background steps to `--pb-bg-inverse` (ink) only when the image wants dark
  matting; otherwise stays `--pb-paper`. The image is the chromatic event;
  chrome supplies none ([05](../05-design-system.md)).
- Caption sits *over* the image only when contrast passes AA; otherwise drops
  below into the paper margin. Default: paper margin (the catalogue habit).
- No parallax beyond the Phase-1 guardrail (≤8%,
  [08](../experience/08-scroll-narrative.md)). Reduced-motion: static, full bleed,
  no transform.

### 2 · Single object — "let it land"

The signature beat. One record, deeply matted, alone on the page with vast
air — the museum gesture of giving an object its own wall. This is the default
rendering for a `record` section that is *the* subject of its paragraph.

```
                                                    (asymmetric: object left of center)
        ┌─────────────────────┐
        │      ░░░ mat ░░░     │   matting = --pb-space-7..8 of --pb-paper
        │   ┌─────────────┐    │   around the plate (echoes catalogue)
        │   │             │    │
        │   │  [ object ] │    │   Plate, shadow-museum-soft
        │   │             │    │
        │   └─────────────┘    │
        │      ░░░░░░░░░░░     │
        └─────────────────────┘
                                   ▸ Fig. 02
                                     Òdàlè Dà'lẹ̀ — bottle caps on board
                                     61 × 61 cm · 2026   (mono dims, see 07)
   ↑ --pb-space-9/10 of empty space above and below — the object "lands"
```

- Vertical breathing room above/below ≥ `--pb-space-9` (96px) desktop,
  `--pb-space-8` mobile. Whitespace *is* the reverence
  ([05](../05-design-system.md): "whitespace is storytelling").
- Crop ratio per record type (see Art direction). Plate `fit="contain"` for
  catalogue spreads (never crop a work that carries its own label),
  `fit="cover"` for portraits — matching the contract in
  [components/Plate.tsx](../../components/Plate.tsx).

### 3 · Two-column exhibit (object + label)

Object on one side, editorial/label on the other — the existing
`ExhibitLayout` grammar (`[1.1fr_1fr]`, image slightly dominant) generalised
to story bodies. Used when a record needs explanation beside it.

```
┌───────────────────────────┬──────────────────────┐
│                           │  EYEBROW (mono/caps)  │
│        [ Plate ]          │  Title (Fraunces)     │
│      image is 1.1fr       │  meta · materials     │
│                           │  ───────────────────  │
│                           │  prose, max 66ch      │
└───────────────────────────┴──────────────────────┘
        image leads (left)        label reads (right)
   collapses to single column < lg: image, then label
```

- Reuse the exact ratio + stagger from
  [components/ExhibitLayout.tsx](../../components/ExhibitLayout.tsx)
  (`Reveal` then `Reveal delay={0.08}`). Do not introduce a new grid.
- Label column is the "museum label" pattern (typeset rules in
  [07](07-editorial-design-guide.md)).
- Mirror variant (label left / object right) allowed for rhythm; alternate at
  most every other exhibit so the page doesn't zig-zag.

### 4 · Pull-quote

A held line of voice between bodies of prose — the `quote` section kind.
Today rendered as a left-bordered blockquote
([stories/[slug]/page.tsx](<../../app/(public)/stories/[slug]/page.tsx>)).
The narrative version gives it air and scale.

```
        ┌─ (no box — the words are the object) ─┐

           "We did not inherit a clean
            planet; we are the cleaning."

                        — Bright Ackwerh, founder

        └───────────────────────────────────────┘
   Fraunces, --pb-fs-display-2, --pb-lh-display; attribution = Inter --pb-fs-small, --pb-stone
   indented to ~the editorial measure, never full-bleed text
```

- Oxblood appears here **only** as a single 2px left rule *or* nothing —
  never as quote-mark glyphs in color. One accent, used rarely
  ([05](../05-design-system.md)). The current `border-l-2 border-accent` is the
  acceptable maximum; prefer no rule on hero pull-quotes.
- Attribution uses `attribution` from the section model (Inter, muted).

### 5 · Scrollytelling sequence (scroll-linked)

A short sequence where scroll *position* drives an image transformation —
strictly within Phase-1 guardrails: native scroll, never hijacked, **≤3 pinned
scenes site-wide**, scenes pause off-viewport
([08](../experience/08-scroll-narrative.md), canon non-negotiable 1).

```
 sticky stage (pinned ~120–150vh):        step text (scrolls past, right):
 ┌────────────────────┐                   ── step 1: "fragments arrive"
 │                    │                    ── step 2: "they find each other"
 │   [ image state    │                    ── step 3: "a face appears"
 │     driven by       │                   (each step = one prose/quote section,
 │     scroll progress]│                    enters via Reveal)
 │                    │
 └────────────────────┘  release at 100%
```

- Implementation note (design intent, not code): `useScroll`/`useTransform`
  throttled to rAF, IntersectionObserver to pause — exactly as
  [08](../experience/08-scroll-narrative.md) specifies for `WasteToArt` /
  `HopeShift`. Transforms limited to `transform`/`opacity`.
- **Reduced-motion / no-JS fallback (first-class):** the pin dissolves into a
  vertical stack of `Reveal` cross-fades — the same steps, on foot. The
  transformation still *reads*; it just doesn't play under the cursor.
- A persistent, subtle **"skip to the record"** affordance lets researchers
  leave the cinematic sequence immediately
  ([08](../experience/08-scroll-narrative.md): "never trap the reader").
- Budget discipline: a story gets **at most one** scrollytelling sequence; the
  site-wide cap of 3 includes home's two pinned beats.

### 6 · Caption / credit system

Captions are typeset, not afterthoughts — they carry the catalogue authority.
Voice + numerals live in [07](07-editorial-design-guide.md); this is the
*placement* contract.

```
Fig. 04 · <Title>, <Artist>            ← figure no. mono; title Fraunces italic optional
<materials> · <H × W cm> · <year>      ← mono for dimensions/year (07)
Photo / source credit                   ← --pb-fs-caption, --pb-stone, Inter
```

- Position: directly under the plate in the paper margin (default), or
  lower-left over a full-bleed image when AA contrast allows.
- Color: `--pb-stone` (`--pb-text-muted`). Never oxblood, never signal.
- Every plate carries alt text *and* a visible caption (title, artist,
  materials, dimensions, year) — canon imagery rule
  ([05](../05-design-system.md)), already required by
  [components/Plate.tsx](../../components/Plate.tsx)'s mandatory `alt`.
- Missing image: the existing "Image to be added" placeholder in
  [Plate.tsx](../../components/Plate.tsx) stands; never fabricate media
  (Principle VI / non-negotiable 7).

### 7 · Image matting + figure/plate numbering (the Plate system)

`Plate` is the single matting primitive. Narrative extends it with **figure
numbering** as an editorial layer, not a new component prop unless approved.

- **Matting:** paper-colored margin around each plate echoing the catalogue,
  `shadow-museum-soft` (never heavy) — already the
  [Plate.tsx](../../components/Plate.tsx) default
  (`bg-mist shadow-museum-soft rounded-sm`).
- **Numbering:** `Fig. NN` / `Plate NN` in mono (`--pb-font-mono`), monotonic
  per story, rendered in the caption block — not on the image. Numbering is a
  *citation*, so it is mono like every other ID in the system (07).
- **Fit:** `contain` for works/spreads (nothing cropped), `cover` for
  portraits — the documented Plate contract.

---

## How Story sections render as exhibition modules

The story model has exactly four section kinds
([src/domains/story/story.types.ts](../../src/domains/story/story.types.ts):
`heading | prose | quote | record`). We **do not add kinds**; we re-render the
existing four as modules. This is a presentation upgrade to
[stories/[slug]/page.tsx](<../../app/(public)/stories/[slug]/page.tsx>), not a
data change.

| Section kind | Today (utilitarian)                          | Exhibition module (proposed)                                  |
|--------------|----------------------------------------------|--------------------------------------------------------------|
| `heading`    | `h2` Fraunces 3xl                            | **Act break** — Fraunces, generous `--pb-space-9` lead-in, optional figure-number reset |
| `prose`      | `p` 1.125rem leading-relaxed                 | **Editorial column** — centered at `--pb-measure` (66ch), `--pb-lh-body`, wrapped in `Reveal` |
| `quote`      | left-border blockquote 2xl                   | **Pull-quote** (primitive 4) — held, scaled, air around it     |
| `record`     | bordered `RecordCard` link                   | **Object beat** — *single-object "let it land"* (2) or *two-column exhibit* (3), with caption system (6) |

Module selection for `record` is editorial, defaulting by `refType`
([story.types.ts](../../src/domains/story/story.types.ts) `StoryRefType`):
`artwork` → single-object beat; `person`/`organization` → two-column exhibit;
`certificate` → museum-label-only (mono ID prominent, see 07); `chapter`/
`timeline` → exhibit with link rail. The `caption` and `attribution` fields
already on the section drive the caption/credit block (6) — no new fields.

### Story page rhythm (top to bottom)

```
HEADER     kind eyebrow (mono caps) · Title (Fraunces display-1) · subtitle · dek
           "From the <Chapter>" link            ← existing, kept
   ↓ --pb-space-9
ACT        heading → editorial prose (66ch) → pull-quote → OBJECT BEAT (full-bleed or land)
   ↓ generous travel between every beat (--pb-space-8/9)
ACT        ...alternate exhibit mirror for rhythm...
   ↓
CODA       hairline rule (--pb-border) · "Explore more stories / chapters / verify"  ← existing
```

The current page caps content at `max-w-2xl`; the narrative system widens the
*stage* (objects can go full-bleed / `--pb-container-wide`) while keeping
*reading prose* at `--pb-measure`. Prose stays narrow; images breathe wide.

---

## Image art-direction

### Aspect ratios (per record type)

Echoing [05](../05-design-system.md) imagery rules and the
[Plate.tsx](../../components/Plate.tsx) defaults:

| Record type        | Ratio   | Fit       | Rationale                                  |
|--------------------|---------|-----------|--------------------------------------------|
| Artwork (catalogue)| ~1:1    | `contain` | works are 61×61 cm; never crop the label   |
| Portrait / person  | 4:5     | `cover`   | catalogue portrait crop                    |
| Plate default      | 4:3     | —         | `Plate`'s current `aspect-[4/3]` frame     |
| Exhibit hero       | 1:1     | `contain` | `ExhibitLayout`'s `aspect-square`          |
| Full-bleed moment  | viewport| `cover`*  | *only crop non-label documentary media     |

> Inconsistency to resolve: `Plate` defaults to `aspect-[4/3]`, but the canon
> imagery rule names portrait **4:5** and artwork **~1:1**. The narrative system
> assumes ratio is set per use (the components already accept a ratio via
> `className`, e.g. `aspect-square` in `ExhibitLayout`). Flagged below.

### Focal points

- A record carries a focal point (e.g. `object-position`) so `cover` crops
  never decapitate a face or sever a signature. Until a focal field exists in
  the data, **default to `contain` for anything carrying a label or face** —
  the safe, catalogue-correct choice.

### Formats & delivery

- AVIF first, WebP fallback, via `next/image` (already used in
  [Plate.tsx](../../components/Plate.tsx)).
- Responsive `sizes` set per primitive: full-bleed `100vw`; single-object
  `(max-width:768px) 100vw, 66vw`; two-column `(max-width:1024px) 100vw, 55vw`
  (matches `ExhibitLayout`); grid card the `Plate` default.
- Hero/LCP image of a story uses `priority` (as `ExhibitLayout` does); all
  others lazy. Respect the Phase-3 performance budget
  ([09-performance-budget.md](09-performance-budget.md)) — atmosphere without
  bloat (non-negotiable 6).

---

## Whitespace & rhythm rules

- **Beat spacing:** ≥ `--pb-space-9` (96px) between narrative beats desktop,
  `--pb-space-8` (64px) mobile. Air is the pacing
  ([05](../05-design-system.md), [08](../experience/08-scroll-narrative.md)).
- **Prose measure:** body always `--pb-measure` (66ch); never let reading text
  run full-bleed.
- **Image vs text:** images may use the full `--pb-container`/`-wide`; prose
  stays narrow. The contrast of wide-image / narrow-text *is* the cinematic
  feel.
- **Asymmetry:** the single-object beat sits off-center; pull-quotes indent.
  Confident, asymmetric negative space ([05](../05-design-system.md)).
- **One idea per screen** on key beats; the visitor decelerates ("quiet by
  default," [00-README](00-README.md)).
- **Vertical grid:** all spacing on the 8px scale (`--pb-space-*`); no ad-hoc
  margins.

---

## Open questions for approval

1. **Stage widening on the story page** — may we widen
   [stories/[slug]/page.tsx](<../../app/(public)/stories/[slug]/page.tsx>) from
   `max-w-2xl` to a wide *image* stage while keeping prose at `--pb-measure`,
   or must prose and images share one column?
2. **`record` module mapping by `refType`** — is the proposed default
   (artwork → single-object, person/org → two-column, certificate →
   museum-label) acceptable, or should the editor pick the module explicitly?
   (Latter needs a new section field — out of scope without approval.)
3. **Figure numbering** — add a `Fig./Plate NN` mono caption layer
   automatically per story, or only where an editor opts in?
4. **Plate aspect ratio** — confirm `Plate` should keep `4/3` as default and
   ratio is set per use, vs. encoding 4:5 (portrait) / 1:1 (artwork) presets.
5. **Scrollytelling budget** — confirm at most **one** scroll-linked sequence
   per story, counting against the **3** site-wide pinned-scene cap
   ([08](../experience/08-scroll-narrative.md)).
6. **Full-bleed dark matting** — may a full-bleed moment switch to
   `[data-theme="ink"]`, or should story surfaces stay paper-only?
