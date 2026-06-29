# 02 - UX Strategy

**Purpose.** Turn the audit's findings into a single, sequenced plan for making
Planet B *felt* - a north star, the emotional arc as the structural spine, the
journeys of the four audiences, the "four worlds + graph" model that organizes
every surface, the waves in which we elevate them (each build-green and
reduced-motion-safe), and the principles that decide trade-offs. Every move below
cites the audit finding it resolves. This is strategy, not implementation: it
sets direction and order; the blueprints (10-14) and systems (03-09) specify the
craft.

**Extends.** [docs/experience/01-experience-map.md](../experience/01-experience-map.md)
(world-as-passages) and [docs/experience/02-emotional-journey.md](../experience/02-emotional-journey.md)
(the arc). Acts on [docs/phase-3/01-experience-audit.md](01-experience-audit.md).
Governed by [docs/phase-3/00-README.md](00-README.md) and
[docs/00-PRINCIPLES.md](../00-PRINCIPLES.md).

---

## North star

> "When someone closes Planet B, I don't want them to say 'that was an impressive
> website.' I want them to say 'I've never experienced a digital place quite like
> that.'"

The audit found exactly one surface that already earns that sentence - the home
arc ([app/(public)/page.tsx](<../../app/(public)/page.tsx>)) - and a foundation
(tokens, the Eye, `Reveal`/`Plate`/`ExhibitLayout`, the reduced-motion system)
strong enough to raise every other surface to it. **The strategy is not to build
new things. It is to make the institution that already exists feel like a place.**
The record is the hero; the chrome recedes; the Eye unifies quietly; nothing
ships that breaks 60fps or reduced-motion.

---

## The spine: the emotional arc, everywhere

The arc - `Curiosity -> Wonder -> Reflection -> Responsibility -> Hope -> Action`
([experience/02](../experience/02-emotional-journey.md)) - is currently honored
on the home page and abandoned at the door of every inner page (audit #2, #3, #7).
The strategic correction: **the arc is not a home-page feature, it is the law of
every surface.** Each inner surface gets its own small arc that is a faithful
fractal of the whole:

- A **Story** descends from a held opening line into prose, lifts at its records,
  and ends on an invitation onward - not a `switch` over section kinds (audit #3).
- A **Passport** opens on a person (arrival), moves through a life
  (reflection/legacy), and ends pointing outward to the chapters they shaped
  (action) - not four CRUD lists (audit #2).
- **Verify** is a one-beat arc: question -> held pause -> the Eye settles into a
  seal (responsibility/trust), not a search box returning a card (audit #8).

This is the single idea that resolves the largest cluster of P1/P2 findings.
"Earn the turn" and "one feeling per beat" from
[experience/02](../experience/02-emotional-journey.md) become the per-page test.

---

## The audiences: one world, many depths

Per [experience/01](../experience/01-experience-map.md), there are no separate
portals - one Threshold, and the world rewards however far each visitor goes.
The strategy assigns each audience a *depth*, not a door, and ties each to the
findings that currently block them.

| Audience | Enters wanting | Their depth | Blocked today by |
|---|---|---|---|
| Public / curious | a feeling | the home arc -> one chapter -> one work | nothing on home; the drop-off into utilitarian inner pages (audit #7, #11) |
| Artist / contributor | to see their life honoured | the Passport as "a life" | Passport-as-CRUD (audit #2); no Eye-as-passport-mark |
| Researcher | citable, connected records | the graph made navigable | invisible graph (audit #4); dual-source seam (audit #9); no facets (audit #10) |
| Partner / institution | proof and gravity | Chapter-as-place + Verify-as-ceremony | flat Chapter (audit #11); ceremonyless Verify (audit #8) |

The design consequence: **the same surface must serve wonder and citation at
once.** A Passport must move an artist and satisfy a researcher; the way to do
both is to lead with the life (emotional) and let the records resolve as the
reader descends (citable). "Reveal gradually" (below) is what makes one surface
serve two depths.

---

## The model: four worlds + the graph

The canon names four cinematic surfaces plus the connective tissue
([00-README.md](00-README.md) vocabulary). The strategy maps every audited
surface onto exactly one world, so each gets a coherent treatment rather than
ad-hoc fixes:

```
            THE THRESHOLD  (home top - the only shared entrance)
                   |
   +---------------+----------------+-----------------+
   v               v                v                 v
 HOME           CHAPTER          PASSPORT          ARTWORK
 documentary    documentary-     a life /          the gallery
 (the arc)      of-a-place       museum archive    wall
   |               |                |                 |
   +-------- GRAPH DISCOVERY: the connective tissue --+
     (relationships revealed as you read - not a list, not a separate page)
```

- **Home** (documentary) - the benchmark; protect it (audit "what to protect").
- **Chapter** (documentary-of-a-place) - `/chapters/[slug]` becomes an arrival in
  a place, not a stack of sections (audit #11). The Chapters index is its quiet
  foyer (audit #7).
- **Passport** (a life) - the marquee transformation (audit #2). Certificates and
  Verify are this world's seal and proof.
- **Artwork** (the gallery wall) - the record where the object is reverently the
  hero (non-negotiable 5); provenance is its spine (already strong). The Artworks
  index is the gallery; it gains facets (audit #10).
- **Graph Discovery** - *not* a new page. The edges that today are bulleted link
  lists (audit #4) become connections revealed in place as the reader moves
  through a Story, a Passport, an Artwork. The researcher gets navigability; the
  curious visitor gets "gently revealed connections."

---

## Sequencing: four waves

Each wave is independently shippable, build-green, and reduced-motion-safe. Order
is chosen so the highest mandate-impact and the correctness debt come first, and
so each wave reuses what the previous one built.

### Wave 0 - Correctness and foundation (no visible design)
Clears the debts that would otherwise corrupt every later wave.

- Fix the duplicate / nested `<main id="main">` on Stories, Story, Chapters
  index, Passport, Verify (audit #1). One-line correctness per page.
- Collapse token duplication: one source of truth, generated, no manual sync
  (audit #12). Resolves the already-visible drift between
  [tokens/tokens.css](../../tokens/tokens.css) and
  [app/globals.css](../../app/globals.css).
- Resolve the JSON-vs-DB dual source on artist/artwork heroes (audit #9), and add
  a Phase-3 loading state built on the Eye for the `force-dynamic` pages
  (audit #5). The Eye-as-loader is reused by every later wave.

*Why first:* #1 is a non-negotiable a11y break; #12/#9/#5 are the substrate every
other wave stands on. Nothing here changes the look, so it is pure de-risking.

### Wave 1 - The connective motion (transitions + graph-in-place)
The cheapest change with the widest reach.

- Introduce page transitions that *carry meaning* - the Eye/threshold motif as
  the transition, not a generic fade (audit #6). Reduced-motion: instant cut, arc
  intact.
- Turn the bulleted edge-lists into "revealed connections" in place on Artist,
  Artwork, Passport, and Story records (audit #4) - the Graph Discovery model,
  no new page.

*Why second:* it reuses Wave 0's Eye-loader and single token source, and it is
the one move that makes the whole site start to feel like one connected world
rather than a set of pages.

### Wave 2 - The marquee worlds (Passport + Story)
The two surfaces where "a life" and "a documentary" are promised and not
delivered.

- **Passport** -> "a life" (audit #2): portrait + arc + Eye-as-passport-mark;
  the four CRUD lists become a descended life.
- **Story** -> documentary (audit #3): `Reveal`/`Plate`/imagery and a small arc
  replace the CMS `switch`; records resolve in place (reuses Wave 1).

*Why third:* highest emotional payoff, and it depends on Wave 1's revealed-
connections pattern to render records well.

### Wave 3 - The places and the ceremonies (Chapter, Verify, indexes)
Raise the remaining worlds to the benchmark.

- **Chapter / Genesis** -> documentary-of-a-place (audit #11): the timeline
  becomes a descent; the hero an arrival.
- **Verify** -> trust ceremony with the Eye as the verification seal (audit #8);
  Certificates rows gain links to verify and to the person (audit #13).
- **Indexes** (Chapters, Stories, Certificates) gain `Reveal`/`Plate`/imagery
  (audit #7); Artworks gains material/medium facets (audit #10).

*Why last:* it is the broadest in surface count but the lowest risk, and it
reuses every pattern built in Waves 0-2.

A standing constraint across all waves: hold the performance budget (09) -
`WasteToArt`'s 240vh scene already needs on-device measurement (audit #14), so no
wave adds a second uncapped scroll-scene without a budget sign-off.

---

## Principles that decide trade-offs

When two good options conflict, these decide - in this order.

1. **Quiet by default.** Space, silence, slowness win over density and feature.
   When unsure whether to add something, don't. (Resolves the instinct that turned
   inner pages into link-lists in audit #2, #3, #7 - the answer is not "more
   widgets," it is "more air and one arc.")
2. **The record is the hero; chrome recedes.** Any treatment that competes with
   the artwork, the life, or the work loses (non-negotiable 5). (Governs Artwork
   and Passport in Wave 2.)
3. **Earn every motion.** A transition or animation ships only if it carries
   meaning; decoration is cut (non-negotiable 1). (Governs Wave 1's transitions -
   the Eye motif, not a generic fade - and gates audit #6, #14.)
4. **Reveal gradually.** Serve wonder and citation from one surface by leading
   with feeling and letting records/connections resolve as the reader descends.
   (This is how one Passport serves both the artist and the researcher; it is the
   mechanism behind the Graph Discovery model and resolves audit #4.)
5. **Reduced-motion and accessibility are the design, not a fallback.** Every wave
   reads as a quiet, well-typed sequence with motion off, and passes AA. (Carries
   non-negotiables 2 and 3; gates the quiet-contrast risk in audit #15.)
6. **Build-green and reversible.** Every wave is independently shippable and can
   be backed out; correctness debt (Wave 0) precedes atmosphere.

Trade-off resolution example: *Passport - show all records, or curate?* Principle
1 + 4 -> lead with the life, reveal records as the reader descends; do not dump
four lists. *Verify - animate the seal, or stay instant?* Principle 3 -> the Eye
settling into a seal carries the trust beat (it earns its motion); a decorative
spinner would not.

---

## How we will know it worked

The qualitative test from [experience/02](../experience/02-emotional-journey.md)
applied per surface: does it make you stop scrolling, would a museum be proud,
would a child remember it, would a historian trust it to preserve? A surface that
cannot earn all four is reworked. The target is not a metric but a sentence -
*"I've never experienced anything like that"* - now true of more than the home
page.

---

## Open questions for approval

1. **Wave order.** Is Wave 0 (invisible correctness) acceptable as the first
   shippable increment, or does the founder want a visible win (Wave 1 or the
   Passport) first even at the cost of building on unresolved debt?
2. **Marquee choice.** The strategy makes the **Passport** the headline of
   Phase 3 (audit #2). Confirm that over the alternative headline (the Artwork
   gallery wall, audit #11/#10).
3. **Graph = in-place, not a page.** Principle 4 commits to revealing connections
   inside existing surfaces rather than building a standalone graph view.
   Confirm - this is the single biggest scope decision in the package.
4. **Dual-source direction.** Wave 0 needs the answer from audit open-question 3:
   heroes move fully to the DB, or JSON stays as the fast hero. The fix differs.
5. **Stub scope.** Are `origin`, `partners`, `research`, `press` part of any wave,
   or explicitly out of Phase 3 until they have content?
6. **Sound.** The canon names opt-in ambient sound but assigns it to other
   artifacts (03/06/10-13). This strategy deliberately omits it from the waves to
   keep them lean - confirm sound is sequenced later, not in Phase 3's first run.
