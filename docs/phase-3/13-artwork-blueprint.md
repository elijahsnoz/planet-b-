# 13 · Artwork Experience Blueprint

> **Status: DESIGN — awaiting approval. Nothing ships until the founder approves.**
> DESIGN ONLY. This blueprint describes the *felt* experience of `/artworks/[slug]`. It adds no backend domains. The artwork is the hero; chrome recedes.

**Purpose.** "Viewing an artwork should feel like standing in front of it in a gallery." This blueprint re-stages [`app/(public)/artworks/[slug]/page.tsx`](<../../app/(public)/artworks/[slug]/page.tsx>) — today an `ExhibitLayout` side-by-side with appended sections — into a slow, gallery-grade reading: **large imagery** (`Plate`), generous whitespace, the **artist's statement** given room to breathe, the **reclaimed-materials** detail as a wall-label honoring waste-to-art, the **provenance** timeline read as a *museum wall-label lineage* (creation → workshop → exhibition → …), the **certificate** as verifiable proof (the Eye seal), the **stories** it is featured in, and **related works** as gently-revealed graph connections. The arc here is **Wonder → Reflection**: the object first, its meaning and lineage second; the chrome disappears so the work can be *seen*. This blueprint also **resolves the JSON-hero vs DB-sections dual source** ([00-README §"The gap"]) in favor of a single domain-backed source.

**Extends.** [00-README](00-README.md) ground truth + non-negotiables (artworks supply the color; chrome stays quiet), [00-PRINCIPLES](../00-PRINCIPLES.md) (II permanence/accretion, VI accuracy / no invented content). Consumes [`ArtworkProfile`](../../src/domains/artwork/artwork.types.ts) via [`artworkService.profile()`](../../src/domains/artwork/index.ts). References [docs/phase-2/05 · Certificate Verification](../phase-2/05-certificate-verification-spec.md) (the `✓ VERIFIED` seal, the verify bridge) and the provenance model in [artwork.types.ts]. Reuses [`Plate`](../../components/Plate.tsx), [`ExhibitLayout`](../../components/ExhibitLayout.tsx) (as a starting point we partly outgrow — see §1), [`Reveal`](../../components/Reveal.tsx), [`AliveEye`](../../components/experience/AliveEye.tsx). Sibling: [12 · Passport Blueprint](12-passport-blueprint.md).

---

## 0. Data source — resolving the dual-source seam (READ FIRST)

**The problem ([00-README §"The gap"]).** Today the page reads **two sources**: the *hero* (title, medium, dimensions, year, statement, significance, materials, image) from JSON via `lib/data` (`getArtwork`, `getPerson`, `artworkImage`), and the *sections* (provenance, certificates, stories, artist link) from the DB via `artworkService.profile()`. This is a maintenance seam: two definitions of the same artwork can drift, and `force-dynamic` is set only because the DB half accretes.

**What's already true.** `ArtworkProfile` ([`artwork.types.ts`](../../src/domains/artwork/artwork.types.ts)) **already carries every field the hero needs** — `artwork.{title, titleVariant, medium, dimensions, year, statement, significance, materials, primaryMedia}` plus `artist` (with `slug` and `passportId`), `chapter`, `certificates[]`, `stories[]`, `provenance[]`. The only thing JSON uniquely provides is the *image path* via `artworkImage(slug)`; the domain's equivalent is `artwork.primaryMedia`.

**Recommendation (design decision for approval).** Make the page **single-sourced from `artworkService.profile(slug)`**:

```
 BEFORE (dual)                          AFTER (single domain source)
 ─────────────                          ────────────────────────────
 getArtwork(slug)      ─┐               artworkService.profile(slug) ─┐
 getPerson(art.artist) ─┼─ hero          → artwork (hero fields)      │
 artworkImage(slug)    ─┘                → artist (link + passportId)  ├─ one record
 artworkService.profile ── sections      → certificates / stories /    │
                                            provenance (sections)      ┘
   image = artworkImage(slug)  ──────▶   image = resolveArtworkImage(artwork.primaryMedia ?? slug)
```

- Render **everything** from `profile`. Keep one thin image resolver: prefer `artwork.primaryMedia`; fall back to the existing `artworkImage(slug)` mapping so no portrait/plate regresses while media migrates into the DB. This is the *single seam that remains*, and it is image-only, explicit, and removable once `primaryMedia` is fully populated.
- `notFound()` when `profile` is null (replacing the `getArtwork` null check).
- Keep `export const dynamic = "force-dynamic"` — provenance accretes and must always be current ([00-PRINCIPLES II], [05 §C]).
- **No invented content (Principle VI):** any null field (`titleVariant`, `statement`, `significance`, empty `materials`, null image) renders as quiet absence; never a placeholder fact.

This removes the drift risk, keeps `ExhibitLayout`'s look, and is a **reversible, build-green** change (swap the data wiring; markup largely unchanged). The fields below all cite `profile`.

| Surface | Field on `ArtworkProfile` |
|---|---|
| Title / variant | `artwork.title`, `artwork.titleVariant` |
| Eyebrow (medium) | `artwork.medium` |
| Meta | `artwork.dimensions`, `artwork.year`, `artist.{name,slug}` |
| Hero image | `artwork.primaryMedia` (→ resolver fallback `artworkImage(slug)`) |
| Statement | `artwork.statement` |
| Significance | `artwork.significance` |
| Materials | `artwork.materials[]` |
| Provenance | `provenance[]` (`ProvenanceEvent`: `kind`, `title`, `description`, `occurredOn`, `verified`, `source`) |
| Certificate | `certificates[]` (`publicId`, `roleAtIssue`, `status`) |
| Featured in | `stories[]` (`slug`, `title`, `dek`) |
| Artist passport link | `artist.passportId` → `/passport/{passportId}` |
| Related works | **not in the domain today** — see §8 + Open Question 3 |

---

## 1. The spatial model — the gallery wall

A gallery gives a major work a *wall* and silence around it. The page's top is **the work, large**, with the label beside it; everything else (statement, materials, lineage, proof, connections) descends below as a calm reading, the way you'd step back from the canvas and then read the placard, then the catalogue.

```
 ┌──────────────────────────────────────────────────────────────┐
 │  ← Artwork Registry                          (quiet back)     │
 │                                                              │
 │  ┌──────────────────────────┐    MEDIUM (eyebrow)            │
 │  │                          │    The Watchful Eye            │
 │  │      THE WORK, LARGE     │    ────────────────            │
 │  │      Plate fit=contain   │    by Nike Okundaye →          │
 │  │   (nothing cropped)      │    122 × 90 cm · 2026          │
 │  │                          │                                │
 │  └──────────────────────────┘                                │
 │  ── below the fold, one reading column ────────────────────  │
 │  B. STATEMENT (large, slow)                                  │
 │  C. RECLAIMED MATERIALS (wall label)                         │
 │  D. PROVENANCE (the lineage)                                 │
 │  E. CERTIFICATE (verifiable · Eye seal)                      │
 │  F. FEATURED IN (stories)                                    │
 │  G. RELATED WORKS (the graph, gently revealed)               │
 └──────────────────────────────────────────────────────────────┘
```

**Re: `ExhibitLayout`.** We *start* from `ExhibitLayout` (it already gives image+title+meta+`Reveal`). But it is a two-column `1.1fr/1fr` shell with a single `related` slot — too tight for the full reading. This blueprint keeps `ExhibitLayout`'s **hero** (top), and proposes the body (B–G) flow as a single measure-width reading column *below* the hero rather than crammed into the right column. Two paths (Open Question 1): (a) extend `ExhibitLayout` with an optional full-width body region, or (b) compose the hero from `ExhibitLayout` and render B–G as siblings. Either keeps the component reusable.

---

## 2. Region A — The work (hero)

**Emotion.** Standing in front of it. The image dominates; chrome (back-link, eyebrow) is whisper-quiet. The artwork supplies the color; the page stays paper-quiet around it ([00-README]).

**Real data.** `artwork.primaryMedia` (resolver, §0) → `Plate fit="contain"` (per [`Plate`] docs: contain shows the *whole* work — catalogue spreads/works are never cropped). Alt = `${artwork.title}${artist ? " by " + artist.name : ""}`. Eyebrow `artwork.medium`; title `artwork.title` (+ `titleVariant` as a quiet secondary line if present); meta `artwork.dimensions · artwork.year`, artist link `/artists/{artist.slug}`.

```
 ┌──────────────────────────┐
 │        Plate             │   THE WATCHFUL EYE
 │     fit="contain"        │   (titleVariant, if any, smaller below)
 │   museum matting,        │   by Nike Okundaye →   /artists/{slug}
 │   shadow-museum-soft     │   122 × 90 cm · 2026
 └──────────────────────────┘
```

**Motion.** Image arrives via `Reveal` (rise+fade, slow `cine` feel). Label arrives `delay 0.08` (existing `ExhibitLayout` stagger). On fine pointers, an *optional* very subtle parallax-free "lift" — the `Plate` shadow deepens slightly on the first scroll tick, as if lit — transform/opacity only; default off if it risks distraction.
**Reduced-motion.** No rise, no lift; the work is simply *there*, full size, immediately — which is, in fact, the most gallery-true presentation. `Reveal` renders in place.
**Perf.** Hero image = LCP: `Plate priority`, explicit `sizes="(max-width:1024px) 100vw, 55vw"` (as today), fixed aspect → CLS ~0. `fit="contain"` (object-contain) means letterboxing on `bg-mist` — intentional matting, no crop, no reflow.

---

## 3. Region B — The artist's statement

**Emotion.** The artist's voice, given air. This is where the visitor slows down — large type, wide margins, a single quiet column. Reading, not scanning.

**Real data.** `artwork.statement` (rendered as a quotation, as today: "…"), then `artwork.significance` as a calmer secondary paragraph in muted tone.

```
 ┌──────────────────────────────────────────────────────────────┐
 │   "I made this from what the city threw away — the eye that   │
 │    watches is the eye that remembers."                       │
 │                                                              │
 │    …significance: a quieter paragraph, text-muted, on why     │
 │    the work matters within the chapter / the movement.       │
 └──────────────────────────────────────────────────────────────┘
```

Display type (Fraunces), generous `max-w-measure`, large leading. If `statement` is null, the region collapses (no empty quotes); if only `significance` exists, it leads.

**Motion.** `Reveal` on scroll-in; nothing more — the stillness *is* the design. No typewriter, no per-word animation (would cheapen the voice).
**Reduced-motion.** Static; identical.
**Perf.** Text only. Nil.

---

## 4. Region C — Reclaimed materials (the wall label)

**Emotion.** The heart of Planet B's thesis made concrete: *this beauty was waste*. A small, dignified wall-label of materials — not tags to filter by, but a testament.

**Real data.** `artwork.materials[]` → chips (existing `bg-mist` pills). Region omitted entirely if empty.

```
 ┌──────────────────────────────────────────────────────────────┐
 │  RECLAIMED MATERIALS                                          │
 │  ┌───────────┐ ┌────────────┐ ┌──────────────┐               │
 │  │ bottle caps│ │ copper wire│ │ discarded loom│   …          │
 │  └───────────┘ └────────────┘ └──────────────┘               │
 │  "Made from what was discarded." (quiet caption)              │
 └──────────────────────────────────────────────────────────────┘
```

A single quiet caption ("Made from what was discarded.") frames the chips as *reclamation*, tying the object back to the home arc's `WasteToArt` beat ([00-README Home]).

**Motion.** Chips fade/rise in a brief stagger (`stagger 50ms`). No hover transforms — these are labels, not buttons.
**Reduced-motion.** Static chips.
**Perf.** Text chips; nil. WCAG: chip text (`ink` on `mist`) must clear AA.

---

## 5. Region D — Provenance (the lineage / museum wall label)

**Emotion.** The object has a *life*. Read as a museum lineage — the accumulating record that "outlasts the move to blockchain" ([artwork.service]). History accretes; nothing is overwritten (Principle II). This is the page's quiet spine of trust.

**Real data.** `provenance[]` (`ProvenanceEvent`): `kind` (mapped via the existing `PROVENANCE_LABEL`: creation→"Created", workshop→"Workshop", exhibition→"Exhibited", publication→"Published", research→"Researched", collection→"Collected", verification→"Verified", anchoring→"Anchored", restoration→"Restored", ownership→"Ownership"); `occurredOn`; `title`; `description?`; `verified`.

```
 ┌──────────────────────────────────────────────────────────────┐
 │  PROVENANCE                                                   │
 │  The recorded life of this object. Nothing is overwritten.    │
 │  ┌─ (hairline lineage rail, left) ───────────────────────────│
 │  │ CREATED · 2026-01-12                                       │
 │  ●  Made during the Abuja Genesis workshop                    │
 │  │     …description…                                          │
 │  │ EXHIBITED · 2026-03-14                          ✓ verified │
 │  ●  Genesis Chapter opening, Abuja                            │
 │  │ VERIFIED · 2026-03-20                           ✓ verified │
 │  ●  Off-chain hash recorded                                   │
 │  └───────────────────────────────────────────────────────────│
```

- **Wall-label lineage**, read top→bottom in *chronological* order (ascending — a life from creation forward; this is the museum convention and differs from the Passport's "as it stands today" reading, intentionally: an object's story is told from its making).
- Each node is a tiny static **Eye glyph** (the institutional mark, distilled) in `stone`, or `signal` (`#2FA36B`) when `verified === true` — the *verified-only* color rule ([00-README tokens]). `verified` events visibly carry the `✓` + the word "verified" (color is never the sole signal — WCAG).
- Kind label in `accent` eyebrow style (as today), title in body, description muted.

**Motion.** Nodes reveal in a down-the-rail stagger on scroll; the rail itself is static. Transform/opacity only.
**Reduced-motion.** Full static lineage in order — exactly a printed provenance record.
**Perf.** Text + inline SVG glyphs; no images. For long provenance, `content-visibility:auto` on off-screen entries (Open Question 4). INP-safe.

---

## 6. Region E — Certificate (verifiable · the Eye seal)

**Emotion.** Proof. The work is authenticated; here is the seal and the path to verify it yourself, free, no account ([05 Flow A]).

**Real data.** `certificates[]`: `publicId`, `roleAtIssue`, `status`; link `/verify?q={encodeURIComponent(publicId)}`. Status gates the seal copy per [05 §A.2] (`issued` → verifiable; `revoked`/`reserved`/`draft` → labelled, not presented as valid).

```
 ┌──────────────────────────────────────────────────────────────┐
 │  CERTIFICATE                                                  │
 │   ◉  PB-ABJ-2026-002 · Artist · Storyteller   (status: issued)│
 │      ─────────────────────────────────────────               │
 │      Verify this record ↗   →  /verify?q=PB-ABJ-2026-002      │
 └──────────────────────────────────────────────────────────────┘
   ◉ = the Eye, the certificate/passport seal (one identity system)
```

- The Eye seal (`AliveEye`, `watch={false}`, single open then breath) marks the certificate — visually the **same seal** that appears on the Passport ([12 §3]) and on `/verify` ([05 §A.4]), so artwork ↔ certificate ↔ passport read as one institution. Per [00-README] the Eye is *not yet* a verification seal — this + [12] + [05] specify it.
- The seal is the visual promise; "Verify this record ↗" is the *real* proof (live hash recompute on `/verify`). Color of the seal: `accent` (oxblood) for `issued`; muted `stone` and a "not issued / revoked" label for non-issued statuses (no false-trust green).

**Motion.** Seal performs one open on entry, then breath. On focus/hover of the verify link, the seal gives a single slow blink (transform). Reduced-motion: still open mark, no blink.
**Reduced-motion.** Static seal; link only.
**Perf.** One `AliveEye` client component (shared with the page's other Eye usages — ideally a single mounted instance pattern). Inline SVG; 60fps. No eager `/verify` fetch.

---

## 7. Region F — Featured in (stories)

**Emotion.** The work lives in the culture's storytelling — gently revealed connections, not a bare link list ([00-README §"The gap"]: relationships should be *revealed*, not bulleted).

**Real data.** `stories[]`: `title`, `dek?`, `slug` → `/stories/{slug}`. Region omitted if empty.

```
 ┌──────────────────────────────────────────────────────────────┐
 │  FEATURED IN                                                  │
 │   → The Eye That Remembers                                    │
 │     a short dek line, muted, drawing the reader onward        │
 │   → Waste, Witness, Worship                                   │
 └──────────────────────────────────────────────────────────────┘
```

Each entry shows `title` + the `dek` (when present) as an invitation, not just a link — a one-line trailer into the Story world.

**Motion.** Entries reveal in a short stagger; on hover/focus the title underlines and a small arrow advances (transform). Reduced-motion: static, underline-on-focus.
**Reduced-motion.** Static list.
**Perf.** Text only.

---

## 8. Region G — Related works (the graph, gently revealed)

**Emotion.** Discovery. Stepping from one work to its neighbors — by the same artist, the same chapter, shared materials — surfacing the knowledge graph the brief says is currently *invisible* ([00-README §"The gap"]). The connection should *unfold*, not list.

**Real data — gap to resolve.** `ArtworkProfile` **does not** expose related works today. Options (Open Question 3):
- **(a) Minimal, no new domain method:** "More by this artist" via the existing same-artist linkage (the Passport/artist already knows an artist's artworks); render a small `Plate` rail. This ships within current data.
- **(b) True graph:** add a domain method `relatedArtworks(id)` traversing `entity_links` (same chapter, shared materials, co-exhibited) per [phase-2/03 Knowledge Graph]. Richer, but a domain addition (out of strict Phase-3 scope).

Recommendation: ship **(a)** now as a `Plate` thumbnail rail labeled "More by {artist}"; design the surface so **(b)** can populate it later without layout change.

```
 ┌──────────────────────────────────────────────────────────────┐
 │  MORE BY NIKE OKUNDAYE        (later: + same chapter / graph)  │
 │   ┌──────┐ ┌──────┐ ┌──────┐                                  │
 │   │Plate │ │Plate │ │Plate │   title · year beneath           │
 │   └──────┘ └──────┘ └──────┘                                  │
 └──────────────────────────────────────────────────────────────┘
   the artwork stays the hero; this rail is quiet, lazy, below.
```

**Motion.** Thumbnails fade/rise in a stagger as the rail scrolls in; hover/focus lifts a `Plate` (transform + shadow). The "gentle reveal" of connections = the stagger itself. Reduced-motion: static.
**Reduced-motion.** Static rail.
**Perf.** `Plate loading="lazy"` (never `priority` — hero owns LCP), explicit small-rail `sizes`, fixed aspect (no CLS). First few eager, rest lazy. Same single image source as §0.

---

## 9. Accessibility & performance budget (this page)

- **Landmarks.** `<article>` (the record) with `<h1>` = title; regions B–G as `<section>` + `<h2>`; provenance = `<ol>` (ordered lineage); materials/stories/related = `<ul>`. Back-link first in DOM.
- **Contrast (AA).** Body `ink`/`paper`; muted `stone` secondary text verified at size; `signal` green only on verified provenance/cert glyphs, always paired with `✓` + the word "verified". The `contain` matting (`bg-mist`) behind the work is decorative.
- **Image semantics.** Hero alt always includes title + artist; decorative seal glyphs are `role="img"` with titles, not tab stops. Null image → `Plate` placeholder, not a broken `<img>`.
- **Keyboard.** Artist link, certificate verify link, story links, related-work links all reachable in DOM order with focus-visible rings.
- **Motion budget ([00-README non-neg 1,2]).** Three kinds total: `Reveal` (transform+opacity, once), the Eye open/breath (transform+opacity), `Plate` hover-lift (transform). No parallax/scroll-jacking; **no autoplay sound**.
- **Perf targets ([09]).** LCP = hero `Plate` (priority, sized, fixed aspect). CLS ~0. `force-dynamic` retained for live provenance — keep server work light (one `profile()` read); related-work thumbnails lazy. Page JS: `AliveEye` + `Reveal` only; rest RSC.
- **Single source (§0)** is itself a correctness/perf win: one record, one fetch, no JSON↔DB drift.

---

## Open questions for approval

1. **`ExhibitLayout` extension vs compose-around.** Extend `ExhibitLayout` with an optional full-width body region for B–G, or keep `ExhibitLayout` for the hero only and render B–G as siblings? (Affects reuse across Artist/Person records that also use `ExhibitLayout`.)
2. **Single-source migration (§0).** Approve moving the page to read **everything** from `artworkService.profile(slug)`, with a thin `primaryMedia ?? artworkImage(slug)` image resolver as the only remaining (image-only, removable) seam — retiring the `lib/data` hero reads. Reversible, build-green.
3. **Related works.** Ship **(a)** "More by this artist" within current data now, designed so a future **(b)** `relatedArtworks()` graph traversal ([phase-2/03]) can populate the same rail — or wait and ship the true graph version once the domain method exists?
4. **Provenance length / performance.** For artworks with long accreting provenance, approve `content-visibility:auto` + a "show full history" progressive reveal vs always rendering the full lineage.
5. **Provenance direction.** Confirm provenance reads **ascending** (creation → present, museum convention), even though the Passport timeline reads descending — the intentional asymmetry being "an object's life is told from its making; a person's record is read as it stands today."
6. **Eye-as-verification-seal.** Confirm the Eye becomes the shared seal across artwork certificate (§6), Passport ([12 §3]), and `/verify` ([05 §A.4]) — one identity system. Recommendation: yes.
7. **Title variant + multilingual.** How should `titleVariant` (and future translated titles) present beside the primary title — quiet secondary line, or only on hover/expand?
