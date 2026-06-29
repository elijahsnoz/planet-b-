# 04 - Navigation Philosophy (Phase 3)

**Purpose.** Specify how a visitor *moves* through Planet B so that wayfinding
feels like walking an exhibition, not jumping between pages. Navigation should
recede while reading and orient without clutter: a quiet global chrome anchored
by the Eye, context-preserving transitions between surfaces, breadcrumbs-as-
lineage (chapter -> artist -> artwork), a persistent "you are here in the
institution" sense, back/forward that restores scroll + state, deep links that
render standalone, and a command/search affordance for researchers. DESIGN
ONLY -- nothing ships until approved. Keyboard-complete and reduced-motion-safe
are non-negotiable.

**Extends.** [docs/experience/07 - Navigation Philosophy](../experience/07-navigation-philosophy.md)
(Phase 1: withhold-then-offer, the Eye is home, orientation over options,
reveal-on-intent, depth gauge not breadcrumbs, the "map of the world" menu) and
amends it where Phase 2 added surfaces (stories, passport, certificates, verify).
Obeys [docs/phase-3/00-README.md](00-README.md) (the mandate, the emotional arc,
the four worlds + Graph Discovery, non-negotiables) and
[docs/00-PRINCIPLES.md](../00-PRINCIPLES.md). Implements over the current chrome
in [components/SiteHeader.tsx](../../components/SiteHeader.tsx),
[components/SiteFooter.tsx](../../components/SiteFooter.tsx), and
[app/(public)/layout.tsx](<../../app/(public)/layout.tsx>). Cross-references
[14-graph-discovery.md](14-graph-discovery.md) for relationship-based movement
(the discovery layer is the *other half* of navigation).

---

## 1. What exists today (cite, don't invent)

- **Header** ([SiteHeader.tsx](../../components/SiteHeader.tsx)): a client
  component that reveals on scroll. On `/` the nav is withheld until
  `scrollY > 60vh`; on inner pages it is `sticky top-0`. Primary links today are
  hardcoded: `Origin`, `Genesis Chapter` (`/chapters/abuja-2026`), `Artists`,
  `Artworks`, `Partners`. The Eye + wordmark (left) link home. There is **no**
  menu overlay ("map of the world"), **no** search/command affordance, and **no**
  sound glyph yet -- all three are specified-but-unbuilt in experience/07.
- **Footer** ([SiteFooter.tsx](../../components/SiteFooter.tsx)): two link
  sections -- *Archive* (Genesis Chapter, Artist Registry, Artwork Registry,
  Partners) and *Institution* (Origin, Research, Certificates, Press).
- **Layout** ([layout.tsx](<../../app/(public)/layout.tsx>)): a skip-link
  (`#main`), `<SiteHeader/>`, `<main id="main">`, `<SiteFooter/>`. No transition
  wrapper; navigation is default Next.js hard/soft navigation.
- **Deep records** carry a hand-rolled "back" affordance via
  [ExhibitLayout](../../components/ExhibitLayout.tsx) (`backHref`/`backLabel`,
  e.g. "Artwork Registry") -- a single up-link, not a lineage trail.
- **Gaps** ([00-README](00-README.md) "The gap"): no page transitions;
  relationships are plain link-lists; the menu-as-map and command palette are
  unbuilt. Phase 2 surfaces (`/stories`, `/passport`, `/verify`) are not yet in
  the global nav at all.

This artifact specifies the additive layer; every increment is reversible and
degrades to the current behavior with JS disabled.

---

## 2. The route map (the institution's floor plan)

```
                         ( O )  THE EYE  -> always returns to /  (the Threshold)
                            |
        +-------------------+------------------------------------------------+
        |                   |                  |                |            |
     /  (Home)         /chapters           /stories         /artists     /artworks
   the Threshold       the chapters        the narratives   the people   the works
   documentary world   (index)             (index)          (registry)   (registry)
        |                   |                  |                |            |
        |             /chapters/[slug]   /stories/[slug]  /artists/[slug] /artworks/[slug]
        |             a place/world      a documentary    a life-record   the gallery wall
        |                                                      |
        |                                                 /passport/[id]
        |                                                 the lifelong archive
        |
   institutional / trust spine (quiet, footer-weighted):
        /verify  ----(certificate found)---->  /certificates  (the collection view)
        /origin   /research   /press   /partners
```

Canonical routes (the eleven the brief names), with their current code status:

| Route                | World / role                       | Status in repo |
|----------------------|------------------------------------|----------------|
| `/`                  | Home / the Threshold (documentary) | built ([page.tsx](<../../app/(public)/page.tsx>)) |
| `/chapters`          | Chapters index                     | **not yet** a route; only `/chapters/abuja-2026` exists |
| `/chapters/[slug]`   | A chapter (documentary-of-a-place) | exists as hardcoded `/chapters/abuja-2026/` ([page.tsx](<../../app/(public)/chapters/abuja-2026/page.tsx>)) |
| `/stories`           | Stories index                      | built |
| `/stories/[slug]`    | A story (documentary)              | built ([page.tsx](<../../app/(public)/stories/[slug]/page.tsx>)) |
| `/artists`           | Artist Registry                    | built |
| `/artists/[slug]`    | A life-record                      | built ([page.tsx](<../../app/(public)/artists/[slug]/page.tsx>)) |
| `/artworks`          | Artwork Registry                   | built |
| `/artworks/[slug]`   | The gallery wall                   | built ([page.tsx](<../../app/(public)/artworks/[slug]/page.tsx>)) |
| `/passport/[id]`     | The lifelong archive (a life)      | built ([page.tsx](<../../app/(public)/passport/[id]/page.tsx>)) |
| `/verify`            | The verification desk              | built |
| `/certificates`      | The certificate collection         | linked in footer; route status TBD |

> Open question NAV-1 (below) covers the `/chapters` index + dynamic
> `/chapters/[slug]` reconciliation -- a routing change, design-flagged here.

---

## 3. How visitors flow between surfaces (the movement, not the sitemap)

The emotional arc (`Curiosity -> Wonder -> Reflection -> Responsibility -> Hope
-> Action`, [00-README](00-README.md)) is the *spine* of every flow. Navigation
exists to keep a visitor on that arc, not to expose a menu.

```
  THRESHOLD (/)  --descend-->  the eight home beats  --offer-->  a single door:
        "Enter the Genesis Chapter"  ->  /chapters/abuja-2026

  CHAPTER (/chapters/[slug])  is the hub of a world. From it the cast radiates:
        founding artist  ----->  /artists/[slug]
        a work on the wall ---->  /artworks/[slug]
        a story / dispatch ---->  /stories/[slug]
        a partner --------->  /partners (or org record)
        made-possible-by ----->  the trust spine

  ARTWORK (/artworks/[slug])  the gallery wall. Lineage up + connections out:
        up:    chapter it was exhibited in, artist who created it
        out:   certificate (-> /verify), stories it features in, related works
               (graph: same material / same chapter / same series) -> [14]

  ARTIST (/artists/[slug])  a life. Up to the chapter; out to works, stories,
        fellow contributors; *deeper* into the lifelong record:
        "the full record" ----->  /passport/[id]

  PASSPORT (/passport/[id])  the lifelong archive. Out to every artifact of a
        life: certificates (-> /verify), artworks, chapters.

  TRUST SPINE  /verify <-> /certificates: a researcher arrives with a code,
        verifies, and is offered the surrounding record (artwork, person,
        chapter) -- verification is a *doorway into the world*, not a dead end.
```

The reward of moving is always *another connected record*, never a menu. The
menu is the escape hatch; the graph (Section in [14](14-graph-discovery.md)) is
the journey.

---

## 4. The global nav model -- quiet, recedes on scroll, the Eye as anchor

Extends experience/07 ("Persistent chrome (when present)") with concrete states.

**Chrome contents (and nothing else).**
- Left: **the Eye + wordmark** -- the one constant; selecting it returns to `/`.
  The Eye is the institutional anchor (`AliveEye`/`PlanetBMark`, breathing per
  the Breath token). It is "you are *inside* Planet B."
- Right: a single **menu affordance** (opens the map-of-the-world overlay), a
  **search/command affordance** (Section 8), and the **sound glyph** (opt-in,
  silent by default -- [00-README](00-README.md) non-negotiable #4).

**Recede / return behavior (amends current SiteHeader logic).**
```
  state          when                                  appearance
  ------------   -----------------------------------   ---------------------------
  WITHHELD       on / above 60vh (the Threshold)       absent; movement dominates
  OFFERED        on / past 60vh, or any inner page     translucent, blur, present
  RECEDING       scrolling DOWN while reading          fades/lifts out of the way
  RETURNED       scrolling UP (intent to navigate)     fades back in
  PINNED         menu or search open                   solid; world dimmed behind
```
- Animate only `transform` (translateY) + `opacity` -- 60fps, per
  [00-README](00-README.md) #1. Current header already animates
  `translate-y`/`opacity` over `duration-500`; Phase 3 adds the *recede-on-
  scroll-down / return-on-scroll-up* refinement, not a heavier bar.
- Reduced motion: states still apply, transitions collapse to ~0ms via the
  existing reduced-motion override ([tokens.css](../../tokens/tokens.css)); the
  header simply appears/disappears with no slide.

**The menu as a "map of the world"** (experience/07, now reconciled with Phase 2
surfaces). Opening it dims the world and presents *places*, not links:
```
  ( O )  PLANET B

  THE THRESHOLD     return to arrival                         /
  THE CHAPTERS      worlds, beginning with Genesis (Abuja)    /chapters
  THE WORKS         the artworks on the walls                 /artworks
  THE PEOPLE        artists, founders, contributors           /artists
  THE STORIES       documentaries & dispatches                /stories

  -- the institution (quiet) ----------------------------------------------
  VERIFY            confirm a certificate                      /verify
  CERTIFICATES      the collection                             /certificates
  ORIGIN  -  RESEARCH  -  PARTNERS  -  PRESS
```
Calm typography, generous space, each line a place with a one-line sense-of-what.
No dropdowns, no mega-menu density. The Passport is reached *through a person*
(it is a life, not a top-level door), so it is intentionally absent from the menu.

---

## 5. Context-preserving transitions between surfaces

"Moving through an exhibition" means the next room *grows from* the one you left,
not a white flash and a reload.

**Principle: the shared element carries you.** When a visitor selects a record
from a grid or rail, the record's plate/portrait is the *continuity object* --
it persists across the transition while the surrounding chrome cross-fades. This
is the View Transitions pattern (a shared-element morph), gated as progressive
enhancement.

```
  Registry grid card            Record detail (ExhibitLayout)
  +-----------+                 +-----------------------------+
  |  [plate]  |  --select-->    |  [plate grows to hero]      |
  |  title    |   the plate     |  eyebrow / title / meta     |
  +-----------+   is the same   |  body, provenance, rail     |
                  element       +-----------------------------+
```

- **Mechanism:** the browser View Transitions API where supported, falling back
  to Next.js soft navigation (no transition) where not. No layout shift (CLS
  budget, [00-README](00-README.md) #6). Animate `transform`+`opacity` only.
- **Meaning over decoration** (#1): transitions are reserved for *into/out of a
  record* (the act of approaching a work) and *threshold crossings* (entering a
  chapter world). Index-to-index navigation does **not** animate -- it would be
  decoration.
- **The Eye as transition motif** ([00-README](00-README.md) vocabulary): a
  brief Eye-blink/iris can mask longer loads (e.g. a dynamic record fetch),
  doubling as the loading state. Optional, single, never on every click.
- **Reduced motion:** all of the above collapse to an instant swap; the record
  simply appears. The arc still reads as a quiet sequence (#2).
- **No-JS / assistive tech:** standard navigation; every link is a real `href`,
  every transition is enhancement only.

---

## 6. Breadcrumbs as lineage (chapter -> artist -> artwork), without clutter

Experience/07 says "depth gauge, not breadcrumbs." Phase 3 keeps that spirit:
this is a **lineage trail**, not a filesystem path. It tells you *which world you
are standing in*, expressed as relationships, and it is quiet.

```
  on an artwork:   Genesis Chapter  /  Ajayi Elijah Snoz  /  The Watchful Eye
                   (chapter world)     (the maker)            (you are here)

  on a passport:   Ajayi Elijah Snoz  /  Lifelong record
  on a story:      Genesis Chapter  /  Voices of Genesis
```

Rules that keep it uncluttered:
- **Max three rungs.** The last rung (current record) is plain text, not a link.
- **Derived from the graph / FKs**, not the URL path -- the trail expresses
  *meaning* (exhibited-in, created-by), not directory nesting. The data already
  exists: artwork knows its chapter + artist; story knows its chapter; passport
  knows its person. (Source: the typed FKs and `entity_links`; see
  [14](14-graph-discovery.md) for the read pattern.)
- **One line, muted, small caps or `text-muted`** -- it sits *above* the title
  and never competes with the record (#5, the record is the hero).
- It **replaces** the single `backHref` "Artwork Registry" up-link in
  [ExhibitLayout](../../components/ExhibitLayout.tsx) with a lineage whose final
  separator implies "back" -- the registry remains reachable as the trail's
  root or via the menu.
- **Accessible markup:** `<nav aria-label="Lineage"><ol>` with the current rung
  marked `aria-current="page"`. Keyboard-reachable; visible oxblood focus ring.

---

## 7. "You are here in the institution" + back/forward + deep linking

**You-are-here.** At any depth the visitor senses the world they are in
(experience/07 "orientation over options"). Three quiet signals, never a map widget:
1. the **lineage trail** (Section 6) -- the relational position;
2. the **chapter/world tone** -- e.g. the Genesis Chapter hero uses
   `data-theme="ink"` (the dark "threshold" surface,
   [00-README](00-README.md)); being inside a world *feels* tonally distinct;
3. the menu's current place is marked (`aria-current`) when opened.

**Back / forward preserves scroll + state.**
- Next.js App Router already restores scroll on browser back/forward for normal
  navigations. Phase 3's contract: **do not break it.** Any client transition
  (Section 5) must not hijack history or scroll restoration.
- Index pages that carry **filter/sort state** (registries; "related by
  material/chapter/theme" in [14](14-graph-discovery.md)) encode that state in
  the **URL query** so back/forward returns the visitor to the exact view they
  left (e.g. `/artworks?material=plastic`). State lives in the URL, not in
  component memory that a back-navigation would lose.
- The command palette and menu **do not** create history entries (closing them
  is not a "back").

**Deep linking (researchers arrive mid-world).** Every route in Section 2 has a
stable URL and renders standalone with orientation intact (experience/07 a11y
clause). A person landing cold on `/artworks/[slug]` gets: lineage trail (which
chapter/artist), the full record, and the connections rail -- no prior context
required. Query-addressable sub-state (filters, an open connection preview,
`?q=` on `/verify`) is shareable and reproduces the same view.

---

## 8. The command / search affordance (for researchers)

A single, calm **command palette** -- the researcher's fast path, layered over
(never replacing) the slow exhibition walk.

```
  invoke:  Cmd/Ctrl+K   -   "/" when not in a field   -   the search glyph (chrome)

  +-------------------------------------------------------------+
  |  Search the archive                                         |
  |  > watch____________________________________               |
  |                                                             |
  |  WORKS      The Watchful Eye          PB-ARTWORK-000002     |
  |  PEOPLE     Ajayi Elijah Snoz         PB-ARTIST-000002      |
  |  CHAPTERS   Genesis Chapter (Abuja)   PB-CHAPTER-000001     |
  |  STORIES    Voices of Genesis         PB-STORY-000007       |
  |  VERIFY     "PB-..." -> go verify a certificate             |
  +-------------------------------------------------------------+
```

- **Searches across node types** (works, people, chapters, stories,
  certificates) -- the same vocabulary as the knowledge graph node types
  ([phase-2/03](../phase-2/03-knowledge-graph.md) Section 1). A `PB-*` registry
  id pasted in routes straight to the record or to `/verify`.
- **Quiet, museum-toned**: no flashy autocomplete; results are records with their
  registry id, reinforcing the institution.
- **Accessibility (non-negotiable, experience/07):** a `role="dialog"` with
  focus trap, labeled combobox (`role="combobox"` + `aria-controls` listbox),
  arrow-key navigation, Enter to go, ESC to close, visible oxblood focus ring;
  it does **not** add a history entry. Reduced motion: appears instantly, no
  scale-in.
- **Progressive enhancement:** with JS off, the search glyph is a link to a
  plain `/search?q=` results page (a real route), so the affordance never
  becomes a barrier.
- **Deep-linkable:** `/search?q=...` is a shareable URL; the palette and the
  page render the same results.

---

## 9. Accessibility & robustness (non-negotiable -- restates experience/07)

- **Reveal-late nav is enhancement only.** A standard, keyboard-reachable
  `<nav aria-label="Primary">` + the existing skip-link
  ([layout.tsx](<../../app/(public)/layout.tsx>)) exist from first paint for
  assistive tech and no-JS. The cinematic withholding/receding is layered on
  top, never a barrier.
- **Overlays** (menu, command palette): focus trap, ESC to close, restore focus
  to the invoking control, visible oxblood focus ring, `aria-modal`, world
  marked inert behind. Reduced motion = instant open/close.
- **Lineage** is a real `<nav><ol>` with `aria-current="page"`; the command
  palette is a labeled combobox/listbox.
- **Deep links work for everyone**: every passage and record has a stable URL
  and renders standalone with orientation intact.
- **Contrast**: chrome is quiet but text must pass WCAG 2.2 AA
  ([00-README](00-README.md) #3); the muted lineage/trail color is verified
  against `paper`/`ink`, not assumed.

---

## Open questions for approval

1. **NAV-1 -- `/chapters` index + dynamic `/chapters/[slug]`.** Today only the
   hardcoded `/chapters/abuja-2026` route exists
   ([page.tsx](<../../app/(public)/chapters/abuja-2026/page.tsx>)), yet the
   footer/menu and this map assume `/chapters` and `/chapters/[slug]`. Approve
   introducing a chapters index and migrating Genesis to a dynamic slug route
   (Genesis remains sacred + never archived, Principle II)? Routing change,
   design-flagged here.
2. **Global nav inventory.** The current header lists Origin / Genesis Chapter /
   Artists / Artworks / Partners and omits Stories, Verify, Passport. Approve the
   Section 4 menu inventory (Threshold, Chapters, Works, People, Stories +
   institutional spine), with Passport reachable only *through a person*?
3. **Transition technology.** Approve View Transitions API (shared-element morph)
   as the primary mechanism with soft-navigation fallback, scoped to
   into/out-of-record and chapter-threshold crossings only -- not index-to-index?
4. **Breadcrumbs vs depth gauge.** Experience/07 preferred a "depth gauge, not
   breadcrumbs." This artifact proposes a *lineage trail* (graph-derived, max 3
   rungs) as the reconciliation. Approve replacing the single `backHref` up-link
   in ExhibitLayout with the lineage trail?
5. **Command palette scope + shortcut.** Approve `Cmd/Ctrl+K` (+ "/" and a chrome
   glyph) and a no-JS `/search?q=` fallback route; confirm which node types are
   searchable at Genesis scale vs. deferred.
6. **Sound glyph placement.** Experience/07 lists a sound glyph in the chrome,
   but no sound architecture is built ([00-README](00-README.md)). Reserve its
   slot in the header now (inert), or defer until the opt-in ambience ships?
