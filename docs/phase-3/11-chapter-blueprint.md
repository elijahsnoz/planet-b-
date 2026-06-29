# 11 · Chapter Experience Blueprint

> **Status: DESIGN — awaiting approval. Nothing ships until the founder approves.**
> Reversible · build-green · reduced-motion-safe increments only.

## Purpose

Entering a Chapter should feel like **entering a documentary about a place** — not opening a
record page. A visitor should arrive *somewhere* (a place, a date, a host), then be carried
along a timeline that explains *why this chapter mattered*: the people who made it, the
partners who enabled it, the works that came out of it, the stories worth telling, the
measurable impact, and the council that vouches for it. This blueprint generalizes the
hand-built Genesis page into a **cinematic `/chapters/[slug]` driven entirely by
`ChapterArchive`**, and reframes `/chapters` as a **map of the movement** (the federation).

Canon: Planet B is a *federation of chapters* — "the primary institutional object from which
artists, artworks, certificates, stories, media, partners, timeline, press, and impact
emerge" ([src/domains/chapter/index.ts](../../src/domains/chapter/index.ts)). The Chapter is
one of the four worlds ([docs/phase-3/00-README.md](00-README.md)): **documentary-of-a-place**.

## Extends

- **Genesis reference page** — [app/(public)/chapters/abuja-2026/page.tsx](<../../app/(public)/chapters/abuja-2026/page.tsx>): a rich, hand-authored Abuja page (hero, proverbs, voices, timeline, team, films, performance, founders, partners) reading from [lib/data](../../lib/data.ts) JSON. The blueprint **preserves its emotional sequence** while generalizing it to any chapter via the domain.
- **The utilitarian index** — [app/(public)/chapters/page.tsx](<../../app/(public)/chapters/page.tsx>): clean link-list (`chapterService.list()`); the canon names this a "gap" ("plain Tailwind, link-lists, no Reveal/Plate/motion"). This blueprint elevates it to a map.
- **The data contract** — [src/domains/chapter/chapter.types.ts](../../src/domains/chapter/chapter.types.ts): `ChapterArchive { chapter, partners, people, artworks, timeline, press, impact, council, counts }`; served by `chapterService.archiveFor(slug)` ([chapter.service.ts](../../src/domains/chapter/chapter.service.ts)).
- **Shared primitives** — [Reveal](../../components/Reveal.tsx), [Plate](../../components/Plate.tsx), [AliveEye](../../components/experience/AliveEye.tsx), [VideoPlayer](../../components/experience/VideoPlayer.tsx); tokens & motion from [app/globals.css](../../app/globals.css).

## The data → scene mapping (every scene cites a real `ChapterArchive` field)

| Scene | `ChapterArchive` field(s) | Used today on the Genesis page? |
|---|---|---|
| Establishing hero | `chapter` (`name`, `theme`, `eventName`, `openedOn`/`endedOn`, `city`/`country`, `venue`, `summary`, `heroMedia`) | yes (theme/venue/summary/cover) |
| Proverbs / invocation | `chapter.yorubaProverbs[]` | yes |
| Documentary spine | `timeline[]` (`phase`, `title`, `eventDate`, `description`, `sortOrder`) | yes |
| The people | `people[]` (`name`, `roles[]`, `slug`, `passportId`) | partly (curated subsets) |
| Host & partners | `partners[]` (`name`, `type`, `relation`, `label`, `slug`) | yes (via `getOrganization`) |
| The works | `artworks[]` (`title`, `year`, `status`, `artistName`, `slug`) | partly (founders' first works) |
| Featured stories | (Story domain, joined by chapter) + `press[]` | films/performance only |
| Environmental impact | `impact[]` (`metric`, `value`, `unit`, `asOf`, `verified`) | **no — new** |
| Founding council | `council[]` (`personName`, `councilCategory`, `citation`, `isCharterMember`) | **no — new** |
| At-a-glance counts | `counts` (artists, artworks, certificates, partners, timeline, press, impact, passports) | partly |

> **Genesis is the exception that proves the rule.** The bespoke Abuja page (films,
> performance art, curated "voices"/"team" subsets) is content the generic template renders
> from `people[].roles` + the Story/media domain. The generic `[slug]` page must produce the
> *same documentary feeling* from `ChapterArchive` alone; Genesis may keep bespoke flourishes
> as an override (see Open questions).

---

## /chapters/[slug] — the documentary descent

**Sequenced so the visitor understands WHY the chapter mattered**, in this order: *where & when → why (theme/proverb) → what happened (timeline) → who did it (people) → who enabled it (host/partners) → what it produced (artworks/stories) → what it changed (impact) → who vouches for it (council) → where next (federation).*

```
 SCENE                 EMOTION         EARNS
 ──────────────────────────────────────────────────────────────────
 A Establishing hero   Arrival         "I am in a place, on a date, with a host."
 B Invocation          Reverence       "This had a reason — it speaks the local tongue."
 C Timeline spine      Understanding   "I see how it unfolded, step by step."
 D The people          Recognition     "Real humans did this — and I can meet each one."
 E Host & partners     Credibility     "Institutions stood behind it."
 F The works           Wonder          "Here is what it produced."
 G Featured stories    Immersion       "Let me go deeper into one thread."
 H Impact              Conviction      "It measurably changed something."
 I Council             Authority       "This is vouched-for, charter-level."
 J Federation footer   Continuation    "This is one chapter of many. There will be more."
```

### Scene A — ESTABLISHING HERO · Arrival
*Refines the Genesis hero (cover image, theme, venue, dates).*

```
┌──────────────────────────────────────────────────────────┐ data-theme="ink"
│  [heroMedia, full-bleed, opacity ~0.2, object-cover]       │  place atmosphere
│  GENESIS CHAPTER · {city}, {country}      ← isGenesis flag │  eyebrow (muted, tracked)
│  {chapter.theme}                                           │  Fraunces 5–6xl
│  {chapter.summary}                                         │  Inter muted, max 2xl
│  ┌─────────────┬─────────────┬─────────────┐              │
│  │ Opened      │ Venue       │ Host         │  <dl> facts  │
│  │ {openedOn}  │ {venue}     │ {partners    │              │
│  │  –{endedOn} │             │  .label=Host}│              │
│  └─────────────┴─────────────┴─────────────┘              │
└──────────────────────────────────────────────────────────┘
```
- **Emotion:** Arrival — you are *somewhere specific*, not on a generic page.
- **Content (real):** `chapter.heroMedia` (fallback to a chapter cover), `theme`, `summary`, `openedOn`/`endedOn` (formatted; "—present" when `endedOn` null = ongoing), `city`/`country`, `venue`; **Host derived from `partners[].label === "Host"`** (generic, not hardcoded "Norwegian Embassy / Nike Gallery"). `isGenesis` badge.
- **Motion signature:** hero copy via staggered `Reveal`; the cover image holds still behind (no parallax on first paint). **Eye thread:** an `AliveEye` opens small in the eyebrow as the chapter's "this place is watching/being witnessed" mark.
- **Reduced-motion:** all copy/facts present instantly; cover static (already static `object-cover`).
- **Performance:** hero image is **LCP** — `priority`, `sizes="100vw"`, single image. Everything below lazy-loads.

### Scene B — INVOCATION · Reverence
*Refines the proverbs grid.*

```
   ╎ {yorubaProverbs[0].yoruba}
   ╎ {yorubaProverbs[0].english}        2-up, border-l accent, Reveal
   ╎ {yorubaProverbs[1].yoruba}
   ╎ {yorubaProverbs[1].english}
```
- **Emotion:** Reverence — the chapter is locally rooted; it speaks in its own voice.
- **Content (real):** `chapter.yorubaProverbs[]` (generalize the field's *display* to "local invocations" so non-Yoruba chapters fit; the type stays `YorubaProverb` for now).
- **Motion:** `Reveal` per quote. **Reduced-motion:** present, still.
- **Performance:** text only; trivial. Omit the scene entirely when `yorubaProverbs` is empty/null.

### Scene C — THE TIMELINE SPINE · Understanding
*Refines "The founding timeline"; this is the documentary's backbone.*

```
   THE TIMELINE                                  ← counts.timeline events
   ●─ {phase} · {eventDate}
   │   {title}
   │   {description}
   ●─ {phase} · {eventDate}
   │   {title}  …
   ●─ … (ordered by sortOrder)
```
- **Emotion:** Understanding — cause and effect; how the chapter actually unfolded.
- **Content (real):** `timeline[]` sorted by `sortOrder`; each `phase`, `title`, `eventDate` (optional), `description`.
- **Motion signature:** as each entry enters view, its node dot draws/fills and the row `Reveal`s — the spine "writes itself" on descent (transform/opacity only). The vertical rule is the literal spine of the documentary. **Optional living chrome:** a thin progress line tracks scroll down the spine.
- **Reduced-motion:** a static, complete ordered list with dots — fully legible (matches current `<ol>`).
- **Performance:** pure DOM/SVG; cheap. If a chapter has 50+ entries, virtualize or paginate (note for build).

### Scene D — THE PEOPLE · Recognition
*Generalizes the curated "voices"/"team"/"founders" sections into one role-aware roster.*

```
   THE PEOPLE ({counts.artists})        grouped by role (roles[])
   ┌────────┐ ┌────────┐ ┌────────┐
   │ portrait│ │ portrait│ │ portrait│   Plate(cover/contain)
   │ {name} │ │ {name} │ │ {name} │
   │ {roles}│ │ {roles}│ │ {roles}│   → /artists/{slug}
   └────────┘ └────────┘ └────────┘     ◉ passport badge if passportId
```
- **Emotion:** Recognition — the movement has faces, each reachable.
- **Content (real):** `people[]` — `name`, `roles[]`, link `/artists/{slug}`; **if `passportId` present, show the Eye as a "Passport" mark linking toward [12-passport-blueprint.md](12-passport-blueprint.md)** (`/passport/{passportId}`). Group by `roles` (artist, host, curator, embassy, council…) so the curated Genesis subsets emerge from data, not hardcoded slug lists.
- **Motion signature:** staggered `Reveal`; hover lifts name to accent (matches Genesis). **Eye thread:** the passport badge is the Eye as institutional mark — the bridge between the Chapter world and the Passport world.
- **Reduced-motion:** grid present instantly, all links/badges intact.
- **Performance:** portraits via `Plate` with `sizes`; lazy. Cap initial render (e.g. first N) with a "show all" reveal for large rosters.

### Scene E — HOST & PARTNERS · Credibility
*Refines "Made possible by".*

```
   MADE POSSIBLE BY
   ┌─────────────────────┐  ┌─────────────────────┐
   │ {label} ({relation})│  │ {label}             │
   │ {name}              │  │ {name}              │   border cards
   │ {type}              │  │ {type}              │   → /…/{slug} if present
   └─────────────────────┘  └─────────────────────┘
```
- **Emotion:** Credibility — institutions stood behind this.
- **Content (real):** `partners[]` — `label` (Host/Sponsor/Partner), `relation` (hosted_by/sponsored_by/partnered_with), `name`, `type` (embassy/gallery/museum/…), `slug`. **Host (Scene A) and the rest here come from the same array** — no duplication of org names in code.
- **Motion:** `Reveal` cards. **Reduced-motion:** present, still.
- **Performance:** text cards; trivial.

### Scene F — THE WORKS · Wonder
*New gallery generalizing "founders' first artworks" into the chapter's full output.*

```
   THE WORKS ({counts.artworks})
   ▓▓  ▓▓  ▓▓  ▓▓        masonry/grid of Plate(artwork)
   ▓▓  ▓▓  ▓▓  ▓▓        caption: {title} · {year} · {artistName}
                          → /artworks/{slug}  (status-aware)
```
- **Emotion:** Wonder — what the chapter produced; the gallery wall ([13-artwork-blueprint.md](13-artwork-blueprint.md)).
- **Content (real):** `artworks[]` — `title`, `year`, `status`, `artistName`, `slug`. Respect `status` (only show public/published states publicly).
- **Motion signature:** staggered `Reveal`; on hover, a `Plate` lift. Entry into a single work is the hand-off to the Artwork world (future Eye-blink transition).
- **Reduced-motion:** static grid, captions, links.
- **Performance:** the heaviest scene — many images. `Plate`/`next/image` with strict `sizes`, lazy below fold, and a sensible initial cap. Hold the image budget from [09-performance-budget.md](09-performance-budget.md).

### Scene G — FEATURED STORIES · Immersion
*Replaces the bespoke films/performance blocks with a generic stories rail (Genesis keeps its films as overrides).*

```
   STORIES                                  Story domain joined by chapter
   ┌──────────────┐ ┌──────────────┐
   │ [media/poster]│ │ [media/poster]│       VideoPlayer for video stories
   │ {story title} │ │ {story title} │       → /stories/{slug}
   └──────────────┘ └──────────────┘
   IN THE PRESS
   • {outlet} — {title} ({publishedOn})  →   press[].url ↗
```
- **Emotion:** Immersion — go deeper into one thread; the chapter is layered, not flat.
- **Content (real):** featured **Stories** for this chapter (Story domain, see canon's `/stories`), rendered with [VideoPlayer](../../components/experience/VideoPlayer.tsx) for video; plus `press[]` (`outlet`, `title`, `url`, `publishedOn`) as an external-press list.
- **Motion:** `Reveal`; video is **opt-in play only** (no autoplay sound — canon non-negotiable). **Reduced-motion:** posters + links, no motion.
- **Performance:** posters are images; video loads on user intent. Omit each block when empty.

### Scene H — ENVIRONMENTAL IMPACT · Conviction  *(new)*
*Surfaces `impact[]` — currently absent from the Genesis page.*

```
   IMPACT
   ┌────────────┐ ┌────────────┐ ┌────────────┐
   │ {value}{unit}│ │ {value}{unit}│ │ {value}{unit}│  large Fraunces numerals
   │ {metric}    │ │ {metric}    │ │ {metric}    │  ✓ if verified  · as of {asOf}
   └────────────┘ └────────────┘ └────────────┘
```
- **Emotion:** Conviction — the chapter measurably changed something real.
- **Content (real):** `impact[]` — `metric`, `value`, `unit`, `asOf`, `verified`. **Only `verified` impact may carry the `signal #2FA36B` accent** (canon reserves signal for verified/impact) — unverified renders neutral with an "unverified/as-of" note.
- **Motion signature:** count-up of numerals on enter (transform/opacity-safe; or static under reduce). The check mark is the Eye-family verification cue.
- **Reduced-motion:** final numbers shown immediately, no count-up.
- **Performance:** text; trivial. Omit scene when `impact` empty.

### Scene I — THE FOUNDING COUNCIL · Authority  *(new)*
*Surfaces `council[]` — the chapter's vouching body; absent from the Genesis page today.*

```
   FOUNDING COUNCIL
   ◉ {personName} — {councilCategory}        Eye = institutional seal
     "{citation}"                            ★ charter member if isCharterMember
   ◉ {personName} — {councilCategory} …
```
- **Emotion:** Authority — this is vouched-for at charter level; institutional weight.
- **Content (real):** `council[]` — `personName`, `councilCategory`, `citation`, `isCharterMember` (mark charter members distinctly); link to `/artists/{slug}` or passport when the person resolves.
- **Motion signature:** the **Eye as institutional seal** beside each council member (the canon's "verification seal / institutional symbol" role). Quiet `Reveal`.
- **Reduced-motion:** present, still seals.
- **Performance:** text + small SVG seals; trivial. Omit when empty.

### Scene J — FEDERATION FOOTER · Continuation
```
   This is one chapter of a federation built to hold a
   hundred chapters over a hundred years.
   → All chapters   → Artist Registry   → Become part of the story
   · SiteFooter (the small Eye persists) ·
```
- **Emotion:** Continuation — zoom back out to the movement; the chapter is part of something larger.
- **Content (real):** `counts` recap (e.g. "{artists} people · {artworks} works · {certificates} certificates · {passports} passports"); links to `/chapters`, `/artists`, `/origin`.
- **Motion / reduced-motion:** `Reveal`; static fallback. **Performance:** trivial.

---

## /chapters — the map of the movement

*Elevates [app/(public)/chapters/page.tsx](<../../app/(public)/chapters/page.tsx>) from a link-list to a federation map.*

```
┌──────────────────────────────────────────────────────────┐
│  PLANET B · A FEDERATION                                   │  data-theme="ink"
│  "Built to hold a hundred chapters over a hundred years."  │
│                                                            │
│        · Genesis ◉ Abuja                                   │  a quiet map/constellation:
│            \                                               │  each chapter = a point;
│             · (future chapter, dimmed)                     │  Genesis glows (isGenesis)
│              · (future chapter, dimmed)                    │  unpublished = faint/locked
│                                                            │
│  ── list (accessible fallback / below map) ──              │
│  ┌────────────────────────────────────────────┐           │
│  │ {name}  [Genesis]            {openedOn}      │           │  card per published chapter
│  │ {city}, {country}                            │           │  → /chapters/{slug}
│  │ {counts.artists} people · {artworks} works · │           │
│  │ {counts.certificates} certificates           │           │
│  └────────────────────────────────────────────┘           │
└──────────────────────────────────────────────────────────┘
```
- **Emotion:** Scale & continuity — Planet B is bigger than one event; the visitor sees the shape of a hundred-year institution.
- **Content (real):** `chapterService.list()` → `ChapterSummary[]` (`name`, `city`/`country`, `isGenesis`, `openedOn`/`endedOn`, `counts.{artists,artworks,certificates}`); filter `status === "published"` (current behavior). Future chapters may render as dimmed/locked points to show the federation is *built to grow*.
- **Motion signature:** the map/constellation points `Reveal` in; Genesis breathes (the Eye/`pb-breath`) as the origin star; hover on a point reveals its card. **Reduced-motion:** the map collapses to the accessible card list (the list is the source of truth; the map is progressive enhancement layered on top — keyboard-complete, semantic `<ul>`).
- **Performance:** lightweight — summaries only (no images required for the map). The map is SVG/positioned points, not a heavy library. Hold to the JS budget.

---

## Reused vs. new

**Reused:** `Reveal`, `Plate`, `AliveEye`, `VideoPlayer`, `SiteHeader`/`SiteFooter`,
tokens/motion, and `chapterService.archiveFor(slug)` / `.list()` — already the data spine.
The generic `[slug]` page is the **same emotional sequence** as the Genesis page, sourced
from `ChapterArchive` instead of curated slug lists.

**New primitives proposed (small, reversible):**
1. **`<ChapterDocumentary slug>`** server component — fetches `archiveFor(slug)`, renders Scenes A–J, omitting any scene whose array is empty. The route `/chapters/[slug]` consumes it; **Genesis (`/chapters/abuja-2026`) may keep its bespoke film/performance overrides** by passing extra slots.
2. **`<TimelineSpine entries>`** — the documentary backbone (Scene C) with scroll-written dots.
3. **`<ImpactStat>`** — verified-aware numeral (Scene H); the only place outside verification UI that may use `signal`.
4. **`<CouncilSeal>`** — the Eye as institutional seal (Scene I); shared with verification/certificate per [03-motion-language.md](03-motion-language.md).
5. **`<FederationMap chapters>`** — progressive-enhancement constellation over the accessible list (`/chapters`).
6. **Date/host formatters** — `openedOn–endedOn` ("—present" when null) and Host-from-`partners` derivation, so no org names are hardcoded.

All degrade to the current pages and to reduced-motion; none block the existing Genesis page.

---

## Open questions for approval

1. **Genesis exception:** keep the hand-authored Abuja page (films, performance art, curated voices/team) as **bespoke overrides** on top of `<ChapterDocumentary>`, or migrate it fully to the generic template and move the bespoke content into Story/media records so it renders generically?
2. **Proverbs generalization:** Scene B's field is typed `YorubaProverb`. For non-Yoruba chapters, do we relabel the *display* to "local invocation" now, or widen the type later (out of Phase-3 scope = backend)?
3. **People grouping:** group Scene D by `roles[]` (artist/host/curator/embassy/council). Confirm the role vocabulary so grouping is stable across chapters.
4. **Impact accent:** confirm only `verified === true` impact uses `signal #2FA36B`; unverified renders neutral with an "as of {asOf}" note. (Canon reserves signal for verified/impact.)
5. **Council ↔ verification:** should `<CouncilSeal>` and the verification seal share one Eye component now, or stay separate until [14-graph-discovery.md](14-graph-discovery.md)/verification UI lands?
6. **Federation map:** ship the constellation now (progressive enhancement over the list), or land the elevated card list first and add the map after more chapters exist? Should unpublished/future chapters appear as dimmed points to signal growth?
7. **Stories join:** Scene G needs Stories filtered by chapter — confirm the Story domain exposes "stories for chapter X" (or whether `press[]` alone carries this scene until then).
