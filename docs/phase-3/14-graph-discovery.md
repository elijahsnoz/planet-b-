# 14 - Knowledge Graph Discovery Experience (Phase 3)

**Purpose.** Make the knowledge graph *visible and rewarding*. Today the edges
exist in data but surface to visitors as bulleted link-lists
([00-README](00-README.md) "the knowledge graph is invisible"). This artifact
specifies the experience layer that lets every record gently reveal its
connections -- artwork -> artist, story, chapter, certificate, materials,
provenance, related works -- as the *connective tissue* of the institution and
the reward for curiosity. It defines: a reusable **Connections / related-rail**
pattern (how it reads `entity_links` + typed FKs), "related by material / chapter
/ theme" discovery, hover/focus affordances that *preview* a connected record, an
optional **constellation** graph visual with an accessible list fallback, and how
discovery threads the emotional arc. DESIGN ONLY. **No new backend domain --
this reads the existing graph.** Keyboard-complete and reduced-motion-safe.

**Extends.** [docs/phase-2/03 - Knowledge Graph Diagram](../phase-2/03-knowledge-graph.md)
(the node model, the controlled `relations` vocabulary, the `graph.*` query
patterns -- `graph.neighbors`, `graph.related`, the provenance recursive CTE) and
[db/schema.ts](../../db/schema.ts) (`entityLinks`: `fromType`/`fromId`/`relation`/
`toType`/`toId`/`weight`/`metadata`; the typed FKs `artworks.artistId`,
`artworks.chapterId`, `certificates.personId`, etc.; `provenanceEvents`,
`contributions`). Obeys [00-README](00-README.md) (the four worlds + Graph
Discovery as "the connective tissue", the emotional arc, the non-negotiables) and
[00-PRINCIPLES](../00-PRINCIPLES.md) I "nothing exists in isolation", IV "no one
invisible" (consent gates output), VI (accuracy -- `verified`/`weight` carry
confidence). Pairs with [04-navigation-philosophy.md](04-navigation-philosophy.md)
(discovery *is* navigation by relationship). Reuses
[ExhibitLayout](../../components/ExhibitLayout.tsx), [Plate](../../components/Plate.tsx),
[Reveal](../../components/Reveal.tsx).

---

## 1. What exists today (cite, don't invent)

Connections already surface on every record, but as plain typographic lists:

- **Artwork** ([artworks/[slug]/page.tsx](<../../app/(public)/artworks/[slug]/page.tsx>)):
  artist link in `meta`; reclaimed materials as `<li>` chips in `related`;
  Provenance as an `<ol>` (`profile.provenance`); Certificate links to `/verify`;
  "Featured in" stories as `<ul>`. No related-works, no chapter link, no preview.
- **Artist** ([artists/[slug]/page.tsx](<../../app/(public)/artists/[slug]/page.tsx>)):
  Works, Chapters, Stories, Materials, Fellow contributors (-> passports),
  Certificates -- all `<ul>`/`<li>` link-lists via `artistService.profile`.
- **Story** ([stories/[slug]/page.tsx](<../../app/(public)/stories/[slug]/page.tsx>)):
  inline `RecordCard`s for referenced records (chapter/person/artwork/...), a
  chapter link, and a hardcoded "Explore more" footer.
- **Passport** ([passport/[id]/page.tsx](<../../app/(public)/passport/[id]/page.tsx>)):
  Certificates, Artworks, Contribution timeline, Chapters -- `Section` lists from
  `passportService.publicArchive`.
- **Chapter** ([chapters/abuja-2026/page.tsx](<../../app/(public)/chapters/abuja-2026/page.tsx>)):
  founding artists grid, team, voices, partners, timeline -- rich, but no "related
  chapters" / cross-world rail.

**The graph itself.** `entity_links` is defined in
[db/schema.ts](../../db/schema.ts) and the read API + controlled vocabulary are
designed in [phase-2/03](../phase-2/03-knowledge-graph.md). The per-record
*service profiles* (`artistService.profile`, `artworkService.profile`,
`passportService.publicArchive`, `storyService.getView`) are what the pages
consume today; this artifact treats those services as the read surface and the
`graph.*` patterns as the source for *new* connection slices. **No edges are
written here; discovery only reads.**

---

## 2. The reusable "Connections" pattern (the related-rail)

One component, one contract, every surface. A **Connections** block renders a set
of *typed connection groups*; each group is one relation-class and contains
preview-able record cards. It is the visible form of "nothing exists in isolation."

```
  CONNECTIONS                                            (quiet eyebrow, muted)
  +------------------------------------------------------------------------+
  |  EXHIBITED IN          THE MAKER             RELATED WORKS              |
  |  +-----------+         +-----------+         +-----+ +-----+ +-----+    |
  |  | [chapter] |         | [portrait]|         |[plt]| |[plt]| |[plt]|    |
  |  | Genesis   |         | Ajayi E.S.|         | ... | | ... | | ... |    |
  |  | Abuja 2026|         | Artist    |         +-----+ +-----+ +-----+    |
  |  +-----------+         +-----------+         "same material: plastic"   |
  |                                                                        |
  |  FEATURED IN           CERTIFICATE          DOCUMENTED BY               |
  |  Voices of Genesis     PB-ABJ-2026-007 ->   3 media plates             |
  +------------------------------------------------------------------------+
```

**Data contract (read-only).** A connection group is:
```
  ConnectionGroup {
    relation:   string        // a verb from the `relations` vocabulary (phase-2/03 sec 2)
    label:      string        // human label, e.g. "Exhibited in", "The maker"
    direction:  "out" | "in"  // which side of the edge the current record is on
    items: ConnectionItem[]
  }
  ConnectionItem {
    nodeType:   "artwork"|"artist"|"chapter"|"story"|"certificate"|"media"|"organization"|...
    registryId: string        // PB-... (the node's permanent id)
    href:       string | null  // null when consent/visibility hides the target
    label:      string
    sub?:       string        // role / year / medium
    plate?:     string         // image path for Plate, when the node has one
    weight?:    number         // edge confidence -> ranking (phase-2/03 sec 2 notes)
    verified?:  boolean        // shows the signal/verified mark when true
  }
```

**How it reads the graph (two sources, one shape).**
1. **Typed FKs (integrity)** -- the strong, always-present edges. `created_by`
   from `artworks.artistId`; `exhibited_in` from `artworks.chapterId`; the
   certificate from `certificates.artworkId`/`personId`; `provenanceEvents` and
   `contributions` rows. These power the core groups and are already in the
   service profiles.
2. **`entity_links` (openness)** -- the long-tail/emergent groups
   (`features`/`featured_in`, `mentions`, `same_series`, `responds_to`,
   `documented_by`, `photographed_by`). Read via `graph.neighbors(registryId,
   {relations, depth:1, direction})` and `graph.related(registryId, type)`
   ([phase-2/03 sec 4](../phase-2/03-knowledge-graph.md)).

Both are normalized into `ConnectionGroup[]`, so the component never knows or
cares which mechanism produced an edge. **Consent/visibility (Principle IV):**
the service filters edges whose endpoint is archived or whose person consent is
not `granted` -- the edge is hidden in *output*, never deleted
([phase-2/03 sec 5.2](../phase-2/03-knowledge-graph.md)); a hidden item yields
`href: null` or is omitted.

**Ordering & restraint.** Groups follow a fixed semantic order (lineage first:
maker, chapter; then outward: stories, related works, certificate, media). Within
a group, order by `weight` desc then recency. Cap each group (e.g. 6 items) with
a quiet "see all N" that links to a filtered index (Section 4). The rail is
**revealed, not dumped** -- it uses [Reveal](../../components/Reveal.tsx) staggered
rise so connections *emerge* as the visitor reaches them.

**Where it mounts.** Replaces/augments the ad-hoc `related` and list sections in
the four record pages via the existing [ExhibitLayout](../../components/ExhibitLayout.tsx)
`related` slot (artwork, artist) and as a new section on story, passport, and
chapter pages.

---

## 3. What each surface exposes (the connection map per world)

Every record gently reveals *its own* neighborhood. Source column shows where the
edge comes from (FK = typed foreign key; LINK = `entity_links`).

| Surface | Connection group (relation) | Source | Reward (where it leads) |
|---|---|---|---|
| **Artwork** `/artworks/[slug]` | The maker (`created_by`) | FK `artistId` | the artist's life |
| | Exhibited in (`exhibited_in`) | FK `chapterId` | the chapter world |
| | Reclaimed materials | `artworks.materials` | "related by material" (Sec 4) |
| | Provenance (life-history) | `provenanceEvents` | trust / depth |
| | Certificate (`awarded`) | FK `certificates.artworkId` | `/verify` |
| | Featured in (`featured_in`) | LINK `features` | stories |
| | Related works (same series / material / chapter) | LINK + derived | other walls (Sec 4) |
| | Documented by (`documented_by`) | LINK | media plates |
| **Artist** `/artists/[slug]` | Works (`created`) | FK | the walls |
| | Chapters (`featured_in`/`belongs_to`) | FK + LINK | worlds |
| | Stories (`featured_in`) | LINK | documentaries |
| | Fellow contributors (`mentored`/co-chapter) | LINK + derived | other lives / passports |
| | Materials (shared vocabulary) | derived | "related by material" |
| | Certificates / Passport | FK | `/verify`, `/passport/[id]` |
| **Story** `/stories/[slug]` | Referenced records (`features`/`mentions`) | LINK | every cited node |
| | From the chapter (`belongs_to`) | FK `chapterId` | the chapter world |
| | Read next (2-hop shared nodes) | LINK (CTE sec 4.4) | related stories |
| **Passport** `/passport/[id]` | Certificates / Artworks / Chapters | FK + projection | the life's artifacts |
| | Contribution timeline | `contributions` | the arc of a life |
| **Chapter** `/chapters/[slug]` | The cast (artists, works, stories, partners) | FK + LINK (sec 4.3) | the whole world |
| | Lineage (`descends_from`/`gave_rise_to`) | LINK | sibling/child chapters |
| | Impact (`measures`) | FK `impactMetrics` | responsibility beat |

---

## 4. "Related by material / chapter / theme" discovery

The most *rewarding* connections are the ones the visitor did not ask for: works
that share reclaimed plastic, lives that crossed in the same chapter, stories that
respond to one another.

```
  RELATED WORKS
  +-----+ +-----+ +-----+        filter chips (URL-encoded, shareable):
  |[plt]| |[plt]| |[plt]|        [ same material: plastic ]  [ Genesis chapter ]
  +-----+ +-----+ +-----+        -> /artworks?material=plastic   (back/forward safe)
  "also made from discarded plastic"
```

- **By material:** `artworks.materials` (a JSON string array,
  [db/schema.ts](../../db/schema.ts)) -- works sharing a material token. No edge
  needed; derived on read. Links to a filtered registry view
  `/artworks?material=...` whose state lives in the URL query
  ([04 sec 7](04-navigation-philosophy.md), so back/forward restores it).
- **By chapter:** the chapter's full cast via the typed-slice query
  ([phase-2/03 sec 4.3](../phase-2/03-knowledge-graph.md)) -- everyone/everything
  that `belongs_to`/`exhibited_in`/`features` a chapter.
- **By theme / series:** `same_series` (symmetric edge) and `responds_to` from
  `entity_links`; theme via shared story/chapter `theme` text. Ranked by edge
  `weight` ([phase-2/03 sec 2 notes](../phase-2/03-knowledge-graph.md)).
- **By person (read next):** the 2-hop "stories that touch the same nodes"
  recursive pattern ([phase-2/03 sec 4.4](../phase-2/03-knowledge-graph.md)).

All of these are **reads of the existing graph** -- no new relation verbs, no new
tables. The bounded-depth / visited-set / `LIMIT` safety rails from
[phase-2/03 sec 5.4](../phase-2/03-knowledge-graph.md) apply unchanged.

---

## 5. Hover / focus affordances -- preview a connected record

Connections should *whisper what's behind the door* before the visitor commits --
the reward begins before the click. **Hover and focus are equal citizens.**

```
  on hover OR keyboard focus of a connection card:

  +-----------+        +--------------------------------+
  | [plate]   | -----> |  [plate]   The Watchful Eye    |
  | The Watch.|        |            Ajayi Elijah Snoz   |
  +-----------+        |            Discarded assemblage|
                       |            Genesis - 2026  (v)    |
                       +--------------------------------+
                          quiet preview popover / inline expand
```

- **Trigger parity:** the preview appears on `:hover` **and** `:focus-visible`
  (so keyboard users get the identical reward). Dismiss on blur / mouse-leave /
  ESC.
- **Content:** plate (via [Plate](../../components/Plate.tsx)), label, node type,
  one line of `sub`, and the verified mark when `verified` -- the same fields the
  card already carries; no extra fetch if the data is in the group payload.
  Optional lazy "peek" of a richer snippet for the current node only.
- **Restraint & performance:** animate `opacity`+`transform` only, `instant`/
  `base` duration ([00-README](00-README.md) tokens). One preview at a time. The
  card is a real link underneath -- the preview is enhancement, never required to
  navigate.
- **Reduced motion:** preview appears instantly with no scale/translate; or, if
  the visitor prefers, the connection simply remains a plain card (the popover is
  purely additive). Honors the global reduced-motion override
  ([tokens.css](../../tokens/tokens.css)).
- **Touch:** no hover; first tap may reveal the inline preview, second tap (or the
  explicit "Explore ->") navigates -- or simply navigate on tap, since the card is
  a link. (Open question GD-3.)
- **A11y:** card is a focusable `<a>`; the preview is `aria-hidden` decoration
  (the link's accessible name already conveys destination), or, if it adds info,
  it is associated via `aria-describedby`. Visible oxblood focus ring.

---

## 6. The constellation -- an optional graph visual with a list fallback

A single, opt-in **constellation** view that shows a record's neighborhood as a
gentle star-map -- wonder made literal -- *always* backed by the same accessible
list. The list is primary; the constellation is the enhancement.

```
  [ List ]  [ Constellation ]      <- a toggle; List is the default & the fallback

  Constellation (1-2 hops, centered on the current node):

                 (story)
                    \
        (chapter)----( O )----(artist)        ( O ) = the current record (the Eye motif)
                    /     \                    edges labeled by relation on focus
              (cert)       (work)              node size ~ edge weight
                              \
                            (work, same series)
```

- **Data:** `graph.neighbors(registryId, {depth: 1..2})` from
  [phase-2/03 sec 4](../phase-2/03-knowledge-graph.md), bounded + visited-set +
  `LIMIT` (sec 5.4). The current node is rendered with the **Eye** motif
  ([00-README](00-README.md) vocabulary -- the Eye as institutional symbol).
- **Rendering:** SVG, layout precomputed (no physics jitter); animate only
  `transform`/`opacity` for the reveal; respects `breath` for a faint living
  pulse, disabled under reduced motion. Lazy-loaded -- the constellation chunk
  loads only when the visitor opens the toggle (performance budget,
  [00-README](00-README.md) #6).
- **Accessible fallback (non-negotiable, #3):** the **List** view is the same
  `ConnectionGroup[]` from Section 2, fully keyboard-operable, and is what
  renders with JS off, on small screens, and under reduced-motion-by-default.
  The constellation is *never* the only way to reach a connection.
- **Keyboard in the constellation:** nodes are a focusable list in DOM order;
  arrow/Tab moves focus, focus shows the edge label + preview (Section 5), Enter
  navigates. The SVG carries `role="img"` with a text summary; interactive nodes
  are real `<a>`/`<button>` elements, not bare SVG shapes.

---

## 7. How discovery threads the emotional arc

Discovery is not a feature bolted on -- it is how the institution *rewards
curiosity* and carries the visitor along the arc
(`Curiosity -> Wonder -> Reflection -> Responsibility -> Hope -> Action`,
[00-README](00-README.md)).

```
  CURIOSITY      a connection appears as you read (Reveal) -- "there's more here"
  WONDER         the constellation: this work is part of a constellation of lives
  REFLECTION     provenance + lineage: this object has a history; people made it
  RESPONSIBILITY the chapter's impact + the partners who made it possible
  HOPE           "this gave rise to" -- chapters that descend from Genesis
  ACTION         the trust spine: verify, then "become part of the story"
```

- The rail **earns its existence** by always pointing *forward on the arc*, never
  sideways into a menu ([04 sec 3](04-navigation-philosophy.md): "the reward of
  moving is another connected record").
- **Density follows depth:** indexes show few connections (orientation); records
  show the full neighborhood (immersion); the constellation is the deepest,
  opt-in wonder.
- **Quiet by default** ([00-README](00-README.md) vocabulary): connections are
  muted until approached; they do not shout. Silence and space are the frame.

---

## 8. Accessibility & robustness (non-negotiable)

- **List-first.** Every connection -- rail, related-by, constellation -- is
  reachable as a plain, keyboard-operable list that renders with JS off and under
  reduced motion. Visual graph and previews are strictly additive.
- **Semantic markup.** Each `ConnectionGroup` is a `<section>` with a heading;
  items are `<ul>`/`<li>` of real `<a>` links carrying their registry id in the
  accessible name where useful. The constellation toggle is a labeled `<button>`
  with `aria-pressed`.
- **Reduced motion** ([tokens.css](../../tokens/tokens.css)): Reveal, preview, and
  constellation pulse all collapse to instant; the arc still reads as a quiet
  sequence ([00-README](00-README.md) #2).
- **Performance** (#1, #6): animate `transform`+`opacity` only; cap items per
  group; lazy-load the constellation; bounded graph reads (sec 5.4). No CLS from
  previews (they overlay, they don't reflow).
- **Truth & consent** (Principles IV, VI): hidden/archived/non-consented
  endpoints are filtered from output (`href: null` or omitted), never deleted;
  `verified`/`weight` drive the verified mark and ranking, never fabricated
  ([00-README](00-README.md) #7 "no invented content").

---

## Open questions for approval

1. **GD-1 -- shared `Connections` component vs. per-service shaping.** Approve a
   single reusable `Connections` component fed by a normalized
   `ConnectionGroup[]`, with each domain service
   (`artistService`/`artworkService`/`storyService`/`passportService`) responsible
   for producing that shape from FKs + `graph.*`? (No new backend domain; this is
   a read-shaping + presentation contract.)
2. **GD-2 -- group inventory & order per surface.** Approve the Section 3 table as
   the canonical set of connection groups and their fixed semantic order
   (lineage-first), including the caps and the "see all N" filtered-index links?
3. **GD-3 -- preview & touch behavior.** Approve hover/focus previews (Section 5)
   and the touch behavior (tap-to-navigate, since the card is a link), vs. a
   two-tap reveal-then-navigate?
4. **GD-4 -- constellation scope.** Ship the constellation now (opt-in, 1-2 hops,
   list-backed) or defer it and ship only the related-rail + previews first?
   Confirm the default hop depth (proposed: 1 hop, expandable to 2).
5. **GD-5 -- "related by material/theme" ranking.** Confirm ranking uses edge
   `weight` then recency, and that derived (non-edge) relations like shared
   `materials` are computed on read rather than materialized as new
   `entity_links` (which would be a backend change requiring vocabulary sign-off,
   [phase-2/03 OQ-3](../phase-2/03-knowledge-graph.md)).
6. **GD-6 -- filtered registry routes.** "See all" and material/chapter chips
   assume query-addressable index views (`/artworks?material=...`). Approve adding
   that filter/URL-state layer to the registries (depends on
   [04 NAV-1](04-navigation-philosophy.md) routing decisions)?
