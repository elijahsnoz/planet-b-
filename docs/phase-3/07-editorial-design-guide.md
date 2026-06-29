# 07 · Editorial Design Guide

> **Status: DESIGN — awaiting approval.** Nothing here ships until the founder
> approves. DESIGN ONLY: this defines the editorial layer (type, color
> discipline, voice, typesetting); it proposes no code. The record/artwork is
> the hero; chrome stays quiet.

## Purpose

The **editorial layer** of Planet B: the full type scale and its usage rules
(display Fraunces, text Inter, mono JetBrains), measure/leading/hierarchy, the
**color discipline** that keeps chrome quiet so artworks supply the color, the
**voice** of captions / credits / citations, the **typesetting** of numerals,
dates, registry-IDs and certificate-IDs (mono), editorial spacing, the "museum
label" pattern, and a note resolving the token duplication between
[tokens/tokens.css](../../tokens/tokens.css) and
[app/globals.css](../../app/globals.css). It is the typographic constitution
that [05-visual-storytelling-system.md](05-visual-storytelling-system.md) leans
on.

## Extends

- **EXTENDS** [docs/05-design-system.md](../05-design-system.md) — Phase 1 named
  the palette, the three typefaces, the 8px scale, the imagery rules. Phase 3
  turns those into an enforceable type scale, color discipline, and
  typesetting/voice rules.
- **Single source of truth** is the token layer:
  [tokens/tokens.json](../../tokens/tokens.json) →
  [tokens/tokens.css](../../tokens/tokens.css) →
  [app/globals.css](../../app/globals.css) →
  [tailwind.config.ts](../../tailwind.config.ts). This guide cites
  `var(--pb-*)` / Tailwind tokens by name; it never introduces raw values.
- **Pairs with** [05-visual-storytelling-system.md](05-visual-storytelling-system.md)
  (captions/figure numbering, museum label placement) and the components
  [Plate.tsx](../../components/Plate.tsx),
  [ExhibitLayout.tsx](../../components/ExhibitLayout.tsx),
  [RegistryGrid.tsx](../../components/RegistryGrid.tsx).

---

## 1 · The three voices

From the canon ([00-README](00-README.md), [05](../05-design-system.md)):

- **Display — Fraunces** (`--pb-font-display`; Canela aspirational, Fraunces
  ships via next/font). High-contrast editorial serif. The *museum authority*:
  titles, headings, pull-quotes.
- **Text — Inter** (`--pb-font-text`; Söhne aspirational). Neutral grotesque.
  Body, UI, metadata, captions.
- **Mono — JetBrains Mono** (`--pb-font-mono`). IDs, certificate codes,
  dimensions, dates-as-data, provenance hashes. The *machine record* voice.

The pairing tells the institution's story: a serif that remembers and a
grotesque that explains, with mono for what must be exact.

---

## 2 · Type scale + usage

The scale exists as tokens (`--pb-fs-*`, `--pb-lh-*`, `--pb-measure` in
[tokens/tokens.css](../../tokens/tokens.css)). Sizes are fluid `clamp()` so
they hold from phone to wide.

| Role        | Token (`--pb-fs-…`) | Value                       | Face     | Leading            | Measure   | Use                                  |
|-------------|---------------------|-----------------------------|----------|--------------------|-----------|--------------------------------------|
| Display 1   | `display-1`         | `clamp(2.75rem,6vw,7rem)`   | Fraunces | `--pb-lh-display` 1.1 | —       | Story / page hero title, the Threshold |
| Display 2   | `display-2`         | `clamp(2rem,4vw,3rem)`      | Fraunces | 1.1                | ≤ measure | Pull-quote, section opener           |
| H1          | `h1`                | `clamp(1.6rem,2.5vw,2rem)`  | Fraunces | 1.15               | —         | Record title (`ExhibitLayout` h1)    |
| H2          | `h2`                | `1.5rem`                    | Fraunces | 1.2                | —         | Story act break (`heading` section)  |
| H3          | `h3`                | `1.25rem`                   | Fraunces | 1.25               | —         | Card title (`RegistryGrid` h3)       |
| Body        | `body`              | `1.125rem`                  | Inter    | `--pb-lh-body` 1.5 | `--pb-measure` 66ch | Reading prose            |
| Small       | `small`             | `0.9rem`                    | Inter    | 1.5                | —         | Meta, secondary UI, attribution      |
| Caption     | `caption`           | `0.8rem`                    | Inter    | 1.4                | —         | Plate captions, credits              |
| Eyebrow     | (uses `caption`)    | `0.8rem`, `tracking-widest`, uppercase | Inter/Mono | 1.3 | —    | Kicker labels (`kind`, `eyebrow`)    |
| ID / data   | (uses `small`/`caption`) | per context           | **Mono** | 1.4                | —         | Registry-ID, cert-ID, dims, dates    |

> Note: the current
> [stories/[slug]/page.tsx](<../../app/(public)/stories/[slug]/page.tsx>) uses
> raw Tailwind sizes (`text-5xl`, `text-3xl`, `text-2xl`, `text-lg`) rather
> than scale tokens. The editorial guide is the rule; aligning that page to
> `--pb-fs-*` is a flagged cleanup (Open question 1).

### Hierarchy rules

- **One Display per view.** A page has a single Display-1 voice (its title);
  everything else steps down. Two Display-1s = no hierarchy.
- **Serif sings, sans explains.** Never set long body in Fraunces; never set a
  hero title in Inter. Mono is for *data*, never running prose.
- **Eyebrows are quiet, not loud.** Uppercase + `tracking-widest` + `--pb-fs-caption`
  in `--pb-text-muted` (the existing pattern across
  `RegistryGrid`/`ExhibitLayout`/story page). The eyebrow orients; the title
  speaks.
- **Measure is law.** Reading prose = `--pb-measure` (66ch), per
  [05](../05-design-system.md) (60–72ch). Headlines may exceed measure;
  paragraphs never should.
- **Leading widens as size shrinks:** display 1.1, body 1.5. Captions tighten
  to ~1.4.

```
Hierarchy on a record page (ExhibitLayout):
  ┌ EYEBROW          caption · caps · tracking-widest · muted     (orient)
  │ Title            Fraunces · h1 · text                          (speak)
  │ meta             small · muted                                 (situate)
  │ ─────────────
  │ body prose       body · 66ch · 1.5                             (explain)
  └ REG-2026-014     mono · small                                  (record)
```

---

## 3 · Color discipline

The whole point ([00](00-README.md), [05](../05-design-system.md)): **the
interface is the frame, not the painting.** Tokens:
[tokens/tokens.css](../../tokens/tokens.css).

- **Quiet chrome.** Surfaces are `--pb-paper`; text `--pb-ink`; muted text /
  captions / borders `--pb-stone` (`--pb-text-muted`) and `--pb-mist`
  (`--pb-border`). Near-monochrome by default.
- **Artworks supply the color.** Saturated color is a *chromatic event* — it
  comes from plates, never from chrome. No colored panels, no brand gradients.
- **Oxblood, used rarely** (`--pb-oxblood` → `--pb-accent`). Links, the mark,
  the focus ring (`--pb-focus-ring`), at most a single 2px rule on a
  pull-quote. If oxblood appears more than once or twice in a viewport, it has
  stopped being an accent. On `[data-theme="ink"]` it brightens to `#9b2b2b`
  for AA contrast (already in tokens).
- **Signal green is semantic-only** (`--pb-signal` → `--pb-verified`).
  **Only** "verified / impact" states (a verified certificate, a confirmed
  impact figure). **Never** decorative, never a gradient, never "eco" garnish
  ([05](../05-design-system.md): "never green as decoration").
- **Clay** (`--pb-clay`) is the secondary editorial/display tone (warm brown) —
  optional for a display header, used sparingly; not a body color.
- **Contrast.** WCAG 2.2 AA minimum, AAA for body (non-negotiable 3). The
  `.pb-admin` scope already tightens muted tones for table density
  ([globals.css](../../app/globals.css)); the public site keeps the quieter
  museum contrast but must still pass on text.

```
Allowed accent budget per viewport:
  oxblood:  ▮ (links + focus, ~1–2 marks)        ← rare
  signal:   ▮ only if a verified/impact state is present  ← semantic
  clay:     ▮ optional, ≤1 display header         ← sparing
  color:    ████████  from the artwork plates      ← unlimited, it's the hero
```

---

## 4 · Caption / credit / citation voice

Tone: **catalogue-precise, never chatty.** The label informs; it does not sell.

- **Caption (plate):** `Title, Artist · materials · H × W cm · year`. Title may
  be Fraunces italic; the rest Inter `--pb-fs-caption` in `--pb-text-muted`.
  Dimensions, year, IDs are **mono** (§6).
  - *Do:* `Òdàlè Dà'lẹ̀, Bright Ackwerh · bottle caps on board · 61 × 61 cm · 2026`
  - *Don't:* `A stunning piece you have to see!`
- **Credit:** `Photo: <name>` / `Courtesy of <org>`, `--pb-fs-caption`, muted.
  Always present where known; never invented (Principle VI / non-negotiable 7).
  Unknown → omit, or the existing "Image to be added" placeholder
  ([Plate.tsx](../../components/Plate.tsx)).
- **Citation / provenance:** registry-ID and certificate-ID in **mono**, linked
  to `/verify` where applicable. State facts, link the record, stop.
- **Attribution (quotes):** Inter `--pb-fs-small` muted, em-dash + name
  (matches the story page's `— {attribution}`). Real attributions only.
- **Voice rules:** no marketing adjectives, no exclamation, no first-person
  hype. Numerals as data are mono; numerals in prose are normal text (§6).

---

## 5 · The museum label pattern

The recurring object-label module ([05-visual-storytelling-system.md](05-visual-storytelling-system.md)
primitive 3/6). It is the institution's signature small-type composition.

```
┌───────────────────────────────────────┐
│ EYEBROW            ← caption · caps · tracking-widest · --pb-text-muted
│ Title              ← Fraunces · h3/h1 · --pb-text
│ Artist · year      ← small · --pb-text-muted
│ materials · 61×61 cm   ← mono · caption · muted   (data is mono)
│ ───────────────    ← hairline --pb-border (optional)
│ REG-2026-014 ✓     ← mono ID · signal ✓ only if verified
└───────────────────────────────────────┘
```

- Aligns left; ragged right; never justified (justification opens rivers at
  this measure).
- Vertical rhythm on the 8px scale (`--pb-space-1..3` between label lines,
  `--pb-space-4..5` to the plate).
- The verified check uses `--pb-verified` **only** when the record is truly
  verified — the one place signal green is welcome.
- This is exactly the composition already in
  [RegistryGrid.tsx](../../components/RegistryGrid.tsx) (eyebrow → Fraunces
  title → muted subtitle) and the right column of
  [ExhibitLayout.tsx](../../components/ExhibitLayout.tsx); the label pattern
  formalises it.

---

## 6 · Numerals, dates, IDs — typesetting

The discipline that makes Planet B read like a *registry*, not a website.

- **Mono for data.** Registry-IDs, certificate-IDs, provenance hashes,
  dimensions, and dates-as-data are `--pb-font-mono`. The catalogue/registry is
  a record; its identifiers must look exact.
  - Registry-ID: `REG-2026-014` (mono, often `--pb-fs-small`).
  - Certificate-ID: `CERT-…` (mono); link to `/verify`.
  - Dimensions: `61 × 61 cm` (mono; real multiplication sign `×`, thin spaces).
  - Hashes: mono, truncated with a middle ellipsis if long.
- **Dates.** Two registers:
  - *Editorial date* (in prose): `5 June 2026` — Inter, day-month-year, no
    leading zero, full month. (Canon example: "Opening · 5 June 2026,"
    [08](../experience/08-scroll-narrative.md).)
  - *Data date* (in a label / table / ID context): `2026-06-05` — mono, ISO.
- **Numerals in prose** are normal text (Inter): "three founders," "the 2026
  chapter." **Numerals as measurements/data** are mono.
- **Figures:** `Fig. 04` / `Plate 04` — mono, zero-padded within a story
  ([05-visual-storytelling-system.md](05-visual-storytelling-system.md)).
- **Typography niceties:** real `×`, en-dash for ranges (`2024–2026`), em-dash
  for attribution (`— name`), true curly quotes in prose (the story page uses
  curly `"` around quotes — keep). Mono strings stay straight-quoted.

---

## 7 · Editorial spacing

- **8px scale only** (`--pb-space-1..10`); no ad-hoc pixel margins.
- **Section rhythm:** large vertical sections, ≥ `--pb-space-9` (96px) between
  major ideas desktop ([05](../05-design-system.md): 80–120px). Story beats per
  [05-visual-storytelling-system.md](05-visual-storytelling-system.md).
- **Label internals:** `--pb-space-1..3` between label lines; `--pb-space-4..5`
  from label to plate.
- **Prose:** paragraph spacing `--pb-space-4..5`; measure `--pb-measure`.
- **Containers:** `--pb-container` (1200px) reading, `--pb-container-wide`
  (1440px) for image stages.
- **Hairlines:** `1px solid --pb-border` (mist) — the existing coda rule on the
  story page and card borders. Never a heavy divider.

---

## 8 · Do / Don't

```
DO                                          DON'T
─────────────────────────────────────────  ───────────────────────────────────────
Fraunces for the title, Inter for body      Long body set in the serif
Mono for REG-2026-014, 61 × 61 cm, ISO date Mono for paragraphs / decorative effect
Oxblood ~once: a link, the focus ring       Oxblood as a fill, banner, or 2nd accent
Signal green only on a verified ✓ / impact  Green gradient, "eco" leaf, decoration
Color comes from the artwork plate          Colored chrome panels behind the work
Captions: Title, Artist · materials · year  "An amazing must-see masterpiece!"
Prose at 66ch (--pb-measure), ragged right  Full-bleed justified body text
8px-scale spacing, generous air             Tight ad-hoc margins, cramped beats
Tokens via var(--pb-*) / Tailwind names     Hard-coded #6E1414 or 1.125rem in JSX
```

---

## 9 · Resolving the token duplication

The canon flags this as experience-infra debt
([00-README](00-README.md): "Tokens are duplicated in `tokens.css` +
`globals.css` (manual sync)"). Observed state:

- [tokens/tokens.css](../../tokens/tokens.css) is the documented contract and is
  **complete**: it defines the `--pb-fs-*` font-size scale, `--pb-lh-*`,
  `--pb-reveal-rise`, `--pb-stagger`, and static font stacks
  (`Canela, Fraunces, …`).
- [app/globals.css](../../app/globals.css) is what the app actually loads, and
  it has **drifted**: it wires fonts to next/font (`var(--font-display), Canela,
  …`) — correct and necessary — **but omits** the `--pb-fs-*` size tokens,
  `--pb-lh-*`, `--pb-reveal-rise`, and `--pb-stagger`. So the type scale this
  guide specifies exists in `tokens.css` but is **not available at runtime**;
  components fall back to raw Tailwind sizes (visible in
  [stories/[slug]/page.tsx](<../../app/(public)/stories/[slug]/page.tsx>)).

**Proposed resolution (design intent; needs approval before any code):**

1. Make **`globals.css` the single runtime sheet**, generated from
   `tokens.json` + `motion.json`, with the next/font wiring layered on
   top — eliminating hand-sync.
2. **Add the missing tokens** to `globals.css`: `--pb-fs-*`, `--pb-lh-*`,
   `--pb-reveal-rise`, `--pb-stagger`, so the type scale in §2 is real at
   runtime.
3. **Expose font sizes / line-heights in `tailwind.config.ts`** (it currently
   maps colors, fonts, maxWidth, shadow, easings — but not `fontSize`/
   `lineHeight`), so components use `text-body`, `text-display-1`, etc. instead
   of `text-5xl`. Then retire raw Tailwind sizes from editorial surfaces.
4. Keep `tokens.css`/`tokens.json` as the authored source; `globals.css` is a
   build output, not a parallel hand-edited file.

Until then: **`tokens.css` is canon for values; `globals.css` is what ships** —
when they disagree (currently the font-size scale), `tokens.css` defines intent
and `globals.css` must be brought into line.

---

## Open questions for approval

1. **Retrofit existing surfaces?** Align
   [stories/[slug]/page.tsx](<../../app/(public)/stories/[slug]/page.tsx>) (and
   peers) from raw Tailwind sizes (`text-5xl` …) to the `--pb-fs-*` scale, or
   leave them and apply the scale only to new editorial work?
2. **Token consolidation** — approve making `globals.css` a generated single
   runtime sheet and adding `fontSize`/`lineHeight` to
   [tailwind.config.ts](../../tailwind.config.ts)? (Reversible, build-green.)
3. **Date convention** — confirm editorial `5 June 2026` (prose) vs. mono ISO
   `2026-06-05` (data) split, and which one chapter/story dates use by default.
4. **Clay usage** — is `--pb-clay` permitted as an occasional display-header
   tone, or reserved entirely (kept in palette but unused in chrome)?
5. **Verified check styling** — confirm the only place `--pb-signal` may appear
   in chrome is a verified/impact mark in the museum label.
6. **Fraunces optical settings** — Fraunces is variable (opsz / SOFT / WONK);
   should display sizes lock specific optical-size / softness values, or use
   defaults?
