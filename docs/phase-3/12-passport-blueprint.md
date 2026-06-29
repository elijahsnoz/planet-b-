# 12 · Passport Experience Blueprint

> **Status: DESIGN — awaiting approval. Nothing ships until the founder approves.**
> DESIGN ONLY. This blueprint describes the *felt* experience of `/passport/[id]`. It adds no backend domains; the institution ([Phase 2](../phase-2/00-README.md)) is complete. The record is the hero; chrome recedes.

**Purpose.** "Opening a Passport should feel like opening a museum archive — a life, not a dashboard." This blueprint re-stages [`app/(public)/passport/[id]/page.tsx`](<../../app/(public)/passport/[id]/page.tsx>) — today a clean but utilitarian stack of `Section` link-lists — into a quiet, paced reading of one person's *lifelong contribution*: an opening that **states the identity** (name, honorific, and the Genesis-Contributor seal rendered as **the Eye**), the contribution as a **single quiet chronological timeline** (chapters-with-roles and contributions interleaved), certificates as **verifiable credentials** sealed by the Eye, the works, and the closing sense that *"every contribution matters."* It moves the visitor along the arc from **Reflection → Responsibility**: this is what a life of contribution looks like, and it could be yours.

**Extends.** [docs/phase-2/04 · Planet Passport Specification](../phase-2/04-planet-passport-spec.md) (consent gating §4, public-vs-owner §5, the Eye-as-seal §5, charter cohort §7) and [docs/phase-2/05 · Certificate Verification](../phase-2/05-certificate-verification-spec.md) (the verify bridge, the `✓ VERIFIED` seal). Consumes [`PassportArchive`](../../src/domains/passport/passport.types.ts) via [`passportService.publicArchive()`](../../src/domains/passport/index.ts). Obeys [00-README](00-README.md) ground truth + non-negotiables, [00-PRINCIPLES](../00-PRINCIPLES.md) (III contribution-not-attendance, IV no-one-invisible / consent gates publication, VI accuracy). Reuses [`Reveal`](../../components/Reveal.tsx), [`Plate`](../../components/Plate.tsx), [`AliveEye`](../../components/experience/AliveEye.tsx), tokens in [app/globals.css](../../app/globals.css). Sibling: [13 · Artwork Blueprint](13-artwork-blueprint.md).

---

## 0. Data source — what is real (cite, don't invent)

Everything below reads from one object, `PassportArchive` ([`passport.types.ts`](../../src/domains/passport/passport.types.ts)), already assembled server-side by `passportService.publicArchive(decodeURIComponent(params.id))`:

| Surface element | Field on `PassportArchive` | Notes |
|---|---|---|
| Name / honorific | `person.honorific`, `person.fullName`, `person.displayName` | |
| Roles | `person.roles[]`, `person.primaryRole` | open-ended; grows in place |
| Biography | `person.bio ?? person.shortBio` | |
| Portrait | `person.portraitMedia` | nullable → `Plate` placeholder, never invented |
| Passport ID | `passport.passportId` (`PB-ID-NNNNNN`) | permanent permalink key |
| Country | `passport.country` | nullable |
| Genesis seal | `isGenesisContributor` | drives the **Eye seal** (§3) |
| Certificates | `certificates[]` (`CertificateListItem`) | each → `/verify?q={publicId}` |
| Artworks | `artworks[]` (filter `status==="published"`) | each → `/artworks/{slug}` |
| Contributions | `contributions[]` (`ContributionView`: `kind`, `title`, `description`, `occurredOn`, `chapterName`, `verified`) | the life-event stream |
| Chapters + roles | `chapters[]` (`ChapterRef`: `name`, `slug`, `roles[]`, `isGenesis`) | |
| Counts | `counts.{certificates,genesisCertificates,artworks,contributions,chapters}` | |

**Consent / privacy (Principle IV; [04 §4, §5]).** `publicArchive()` already returns the public, consent-filtered projection (published only when `person.consentStatus = 'granted'`; no PII; `private.institutionalNote` redacted). This blueprint shows **only** what that method returns and never reaches for owner-view fields. No new data is fetched. **No invented content** (Principle VI): a missing portrait, country, or bio renders as quiet absence, not a guess; the reserved 15th founder has no Passport to render ([04 §7]).

---

## 1. The spatial model — an archive folio, not a dashboard

A dashboard is a grid of equal cards screaming for attention. An archive is a **narrow, vertical reading column** you descend slowly. The Passport is one measure-width folio (`max-w-measure`-ish reading column inside `max-w-container`), generous vertical rhythm, each region separated by air and a hairline rule — never by boxes.

```
 ┌──────────────────────────────────────────────────────────────┐
 │  region order (top → bottom)         emotion                  │
 │  ───────────────────────────         ───────                  │
 │  A. THE SEAL & IDENTITY              "this is a person"       │
 │  B. THE LIFE IN A LINE (epigraph)   "a record, not a profile"│
 │  C. THE CONTRIBUTION TIMELINE       reflection (the spine)    │
 │  D. CREDENTIALS (certificates)      trust / verifiable        │
 │  E. THE WORKS                       the made things           │
 │  F. CLOSE: "every contribution …"   responsibility → action  │
 └──────────────────────────────────────────────────────────────┘
```

Reordering note vs today: certificates currently appear *above* the timeline. We move the **timeline to the spine** (region C) because the brief's emotional center is "the lifelong contribution as a quiet timeline." Credentials and works hang off that spine.

---

## 2. Region A — The Seal & Identity (the opening)

**Emotion.** Arrival at a life. Before any list, the page must say *who this is* with the gravity of a museum label and an institutional seal.

**Real data.** `person.honorific`, `person.fullName`; `person.portraitMedia` → `Plate fit="cover"`; `person.roles` joined `·`; `passport.passportId`; `passport.country`; `isGenesisContributor` → the Eye seal.

```
 ┌──────────────────────────────────────────────────────────────┐
 │  PLANET B · PLANET PASSPORT                  (eyebrow, mono)  │
 │                                                              │
 │   ┌─────────┐                                                │
 │   │ portrait│   Dr. Nike Okundaye          ◉  GENESIS        │
 │   │ (Plate  │   ───────────────────────       CONTRIBUTOR    │
 │   │  cover) │   Artist · Storyteller · Founding Narrator     │
 │   └─────────┘                                                │
 │               PB-ID-000002 · Nigeria        (mono, muted)    │
 │                                                              │
 │   ◉ = the Eye, rendered as the PASSPORT SEAL (see §3)         │
 └──────────────────────────────────────────────────────────────┘
```

If `portraitMedia` is null, the portrait frame shows the `Plate` "Image to be added" state — present but quiet; the identity still reads from type alone.

**Motion.** Portrait + name + seal arrive as one `Reveal` group (rise 24px + fade, `cine` ~900ms feel, staggered `50ms`: eyebrow → name → roles → seal). The Eye seal performs its single **open** (lid scaling open, ~1.2s, per `AliveEye openOnMount`) exactly once on entry — the archive "opening its eye" on this life — then settles to the slow **Breath** (6s 1.0→1.03). Pupil-watch is **off** here (this is a seal, not the home hero; `watch={false}`).
**Reduced-motion.** No rise, no open animation, no breath: the Eye renders as a still open mark, identity fully visible immediately (`AliveEye` already collapses durations to 0 under `prefers-reduced-motion`; `Reveal` renders in place). The sequence still *reads* — type hierarchy alone carries "this is a person."
**Perf.** Portrait is the LCP element: `Plate priority`, explicit `sizes`, fixed `aspect` (no CLS). The seal is inline SVG (`currentColor`), animating only `transform`/`opacity` (60fps). No layout work after paint.

---

## 3. The Eye as the Passport mark (the seal)

Per [00-README §"The Eye"] the Eye is *not yet* a passport mark — **this blueprint specifies it.** Per [04 §5] the same oxblood eye-Seal used on certificates renders on the Passport keyed to `PB-ID-*`, so a Passport and a certificate read as one visual identity system, and "15 today / 1,500 later look identical."

```
   GENESIS CONTRIBUTOR              EVERYONE ELSE (non-Genesis)
   ┌────────────────────┐          ┌────────────────────┐
   │   ◉  open Eye,      │          │  small static Eye  │
   │   oxblood, breath   │          │  glyph, stone tone │
   │   + "GENESIS"       │          │  (institutional    │
   │     wordmark        │          │   membership mark) │
   └────────────────────┘          └────────────────────┘
   isGenesisContributor === true    isGenesisContributor === false
```

- **Component.** Reuse `AliveEye` (`watch={false}`, `openOnMount` once). Color is `currentColor`; the seal element sets `text-accent` (oxblood) for Genesis, `text-stone` muted for the general membership mark. **No new SVG asset** — one motif, one component, two tones.
- **Meaning, not decoration (Principle 1 / [00-README §"Living chrome"]).** The Eye appears once, as the institutional seal of identity. It does not repeat per row. The breath is the only ongoing motion and is the page's single heartbeat.
- **Accessibility.** `AliveEye` already exposes `role="img"` + `<title>`. The seal's title = `"Planet B — Genesis Contributor seal"` (or `"Planet B membership"`); the visible `GENESIS CONTRIBUTOR` wordmark is real text, not image, and must clear AA against `paper`/`ink`. Color is never the *only* signal — the wordmark carries the meaning.
- **Verification tie.** The seal links the identity to its **verifiable** credentials below (region D); the seal is the visual promise, the certificates are the proof.

---

## 4. Region B — The life in a line (the epigraph)

**Emotion.** Set the contract: this is a *record of contribution that grows over a lifetime*, not a social profile. One restrained sentence, the existing copy elevated to an epigraph.

**Real data.** The existing sentence, fed by `counts`: "This is a record of *contribution* — a lifelong archive that grows over time, not a social profile." Then, quietly, `counts.certificates` · `counts.artworks` · `counts.contributions` · `counts.chapters`, with `counts.genesisCertificates` noted when > 0.

```
 ┌──────────────────────────────────────────────────────────────┐
 │   A record of contribution — a lifelong archive that grows    │
 │   over time, not a social profile.                            │
 │                                                              │
 │   4 certificates · 6 artworks · 12 contributions · 3 chapters │
 │   (counts, mono, muted — quiet ledger, not a stat dashboard)  │
 └──────────────────────────────────────────────────────────────┘
```

**Motion.** Single `Reveal` (rise+fade) as it scrolls in. No counting/odometer animation — that would read as a dashboard, the exact opposite of the intent.
**Reduced-motion.** Renders in place; identical meaning.
**Perf.** Static text; zero JS, zero images. Negligible.

---

## 5. Region C — The Contribution Timeline (the spine)

**Emotion.** The heart of the page: a life seen as a quiet chronological descent. Today, *chapters* and *contributions* are two separate lists; this blueprint **interleaves chapters-with-roles and contributions into one chronological timeline** so a visitor reads a single arc of a life, not two indexes. Slowness is the feeling: each entry earns a beat.

**Real data.** Merge two streams into one sorted list (design-time merge in the page; **no new domain method required** — both arrays already arrive on `PassportArchive`):
- `contributions[]` → date = `occurredOn`; label = `kind` (humanized, e.g. `role_change` → "Role change"); body = `title` + optional `description`; context = `chapterName`; trust = `verified`.
- `chapters[]` → a "chapter membership" entry; body = `name` + `roles.join(" · ")`; flagged `isGenesis`. Chapters lack an explicit date on `ChapterRef`; see Open Question 1 — for now, undated chapter entries group under a "Chapters & roles" cluster at the foot of the timeline rather than being date-guessed (Principle VI: no invented dates).

```
 ┌──────────────────────────────────────────────────────────────┐
 │  THE CONTRIBUTION                                             │
 │  ┌─ (single hairline spine, left) ───────────────────────────│
 │  │                                                           │
 │  ●  2026-03   EXHIBITION                       (verified ✓)   │
 │  │            Genesis Chapter opening — Abuja 2026            │
 │  │            …short description if present…                  │
 │  │            Abuja 2026 ★  (chapterName, Genesis star)       │
 │  │                                                           │
 │  ●  2024-09   MENTORSHIP                                      │
 │  │            Adire workshop, Oshogbo                         │
 │  │                                                           │
 │  ●  (undated cluster) CHAPTERS & ROLES                        │
 │  │            Abuja 2026 ★ — Founding artist · Narrator       │
 │  │            Lagos 2027   — Curator                          │
 │  └───────────────────────────────────────────────────────────│
 │  "every contribution matters" — even one entry stands here.   │
 └──────────────────────────────────────────────────────────────┘
```

- **Sort.** Descending by `occurredOn` (most recent first) by default — the life as it stands today, reading back into history; undated chapter cluster last. (Open Question 2: ascending "from the beginning" is the alternative; ascending may better serve the "a life unfolding" reading.)
- **The dot is the Eye, distilled.** Each timeline node is a tiny static iris glyph (the Eye reduced to a 6px mark) in `stone`, or `signal` (`#2FA36B`) when `verified === true` — reusing the *verified/impact only* color rule ([00-README tokens]). This is the only place green appears.
- **"Every contribution matters."** A single-entry timeline must look *intentional and dignified*, never empty. One node on the spine, centered, with the closing line — the design explicitly honors the lone contribution (Principle III). Never an "only 1 item" empty-state apology.

**Motion.** Entries reveal on scroll as a stagger down the spine (`Reveal` with increasing `delay`, `stagger 50ms`); the spine itself does not animate. As each node enters, only its glyph + text translate/fade (transform+opacity). No parallax, no scroll-jacking.
**Reduced-motion.** All entries present at load, in document order; the spine reads as a static printed chronology. No stagger. Full meaning retained.
**Perf.** Pure text + inline SVG glyphs; no images in the timeline. Stagger is CSS/`Reveal`-driven (IntersectionObserver, transform/opacity only) → no layout thrash, INP-safe. For very long lives, entries below the fold are cheap DOM; consider CSS `content-visibility: auto` on off-screen entries (Open Question 4).

---

## 6. Region D — Credentials (certificates, verifiable)

**Emotion.** Trust made tangible. These are not badges — they are **verifiable** records, each carrying the same Eye seal and a live link to proof.

**Real data.** `certificates[]`: `roleAtIssue`, `artworkTitle?`, `isGenesisCollection`, `publicId`; link `/verify?q={encodeURIComponent(publicId)}` (the existing bridge from [05 A.4]).

```
 ┌──────────────────────────────────────────────────────────────┐
 │  CREDENTIALS                              (4 · 2 Genesis ★)    │
 │  ───────────────────────────────────────────────────────────  │
 │  ◉  Artist · Storyteller — The Watchful Eye        ★ Genesis   │
 │     PB-ABJ-2026-002                         Verify this ↗      │
 │  ───────────────────────────────────────────────────────────  │
 │  ◉  Facilitator                                               │
 │     PB-ABJ-2026-011                         Verify this ↗      │
 └──────────────────────────────────────────────────────────────┘
   each ◉ = small static Eye seal (institutional consistency)
```

- Each row leads with the small static Eye glyph (same motif as the masthead seal, smaller) — so the credential visually inherits the institution's mark. The `publicId` stays mono; "Verify this ↗" is the clear affordance into Flow A ([05]).
- `isGenesisCollection` → the `★` + accent, matching the existing convention.

**Motion.** Rows reveal in a short stagger as the region scrolls in. Hover/focus: the row's "Verify this ↗" gains an underline + the glyph performs a *single* slow blink (transform only) — a gentle "it's alive / it's real" cue, never looping. Reduced-motion drops the blink and the stagger.
**Reduced-motion.** Static list; underline-on-focus only.
**Perf.** Text + inline SVG. The `/verify` page is a separate route (no eager fetch here). 60fps trivially.

---

## 7. Region E — The Works

**Emotion.** The made things. A restrained gallery strip — proof of practice — that hands off to the Artwork world ([13]).

**Real data.** `artworks[]` filtered to `status === "published"` (as today): `title`, `year`, `slug` → `/artworks/{slug}`. `chapterName` available as quiet context.

```
 ┌──────────────────────────────────────────────────────────────┐
 │  THE WORKS                                            (6)      │
 │   ┌──────┐  ┌──────┐  ┌──────┐                                │
 │   │Plate │  │Plate │  │Plate │   small contained thumbnails   │
 │   └──────┘  └──────┘  └──────┘   title · year beneath each    │
 │   The Watchful Eye 2026   Adire Codex 2024   …                │
 └──────────────────────────────────────────────────────────────┘
```

- A small `Plate` thumbnail rail (not a heavy grid). **Image source caveat:** `PassportArtwork` carries no media path; thumbnails resolve via the existing `artworkImage(slug)` helper ([lib/data](../../lib/data.ts)) used by [13], or render the `Plate` placeholder. This is the same JSON-image / DB-record seam called out in [00-README] and resolved canonically in [13 §"Dual-source"]; the Passport should follow whatever single source [13] lands on.
- If no published artworks, the region is **omitted** (not an empty box) — many contributors are organizers/mentors with zero artworks, and that is a complete, dignified life (Principle III).

**Motion.** Thumbnails fade/rise in a stagger; on hover/focus a thumbnail lifts subtly (`transform: translateY` + shadow) — the standard `Plate` museum-matting feel. Reduced-motion: static.
**Reduced-motion.** Static thumbnails.
**Perf.** `Plate` with `loading="lazy"` (not `priority` — the masthead portrait owns LCP), explicit `sizes` for a small rail, fixed aspect (no CLS). Cap eager render to first row; rest lazy.

---

## 8. Region F — The close ("every contribution matters")

**Emotion.** Reflection → Responsibility → Action. The page ends not on a footer but on a quiet statement and a doorway outward.

**Real data.** Static institutional copy + existing outbound links: `/verify` (verify any certificate) and the Genesis Chapter (`/chapters/abuja-2026`), per today's page.

```
 ┌──────────────────────────────────────────────────────────────┐
 │            ◉                                                   │
 │     Every contribution matters.                              │
 │     This record will keep growing.                           │
 │                                                              │
 │     Verify a certificate →     Enter the Genesis Chapter →    │
 └──────────────────────────────────────────────────────────────┘
```

The closing Eye is the same seal, at rest in the Breath — the institution quietly watching, the visitor invited to cross outward into the graph.

**Motion.** One `Reveal`; the Eye continues its breath. Outbound links underline on hover/focus.
**Reduced-motion.** Static; breath off.
**Perf.** Text + the already-mounted Eye. Nil.

---

## 9. Accessibility & performance budget (this page)

- **Landmarks.** Single `<main id="main">`; regions A–F are `<section>` with `<h2>` headings; the timeline is an `<ol>` (chronology is ordered); credentials/works are `<ul>`. Skip-link already lands on `#main`.
- **Contrast (WCAG 2.2 AA, [00-README non-neg 3]).** Body text `ink` on `paper`; muted `stone` text must still pass AA at its size — verify mono `text-muted` at the small sizes used for `passportId`/counts. `signal` green used only on the small verified glyph (non-text-meaning is backed by the word "verified" / `✓`).
- **Keyboard.** Every link reachable in DOM order; focus-visible rings on all links and the seal if interactive (the seal itself is decorative `role="img"` — not a tab stop).
- **Motion budget.** Two animation kinds total: `Reveal` (transform+opacity, once) and the Eye Breath/open (transform+opacity). No scroll-jacking, no parallax. **No autoplay sound.**
- **Perf targets ([09 Performance Budget]).** LCP = the portrait (priority, sized). CLS ~0 (all media fixed-aspect via `Plate`). Page JS: only `AliveEye` (one client component) + `Reveal`; the rest is RSC/static. INP-safe: no per-row JS handlers beyond CSS hover.
- **No invented content.** Null portrait/country/bio/date → quiet absence. Reserved 15th founder → no page ([04 §7]).

---

## Open questions for approval

1. **Chapter dates.** `ChapterRef` has no date, so chapters can't be true-interleaved into the dated timeline. Approve the "undated Chapters & roles cluster at the foot of the timeline" treatment — or should the domain expose a chapter `joinedOn`/`firstContributionOn` so chapter memberships sort chronologically with contributions? (Pure design choice today; the latter is a small domain addition, out of Phase 3 scope.)
2. **Timeline direction.** Descending (newest first, "the life as it stands") vs ascending (oldest first, "a life unfolding"). Which better serves Reflection→Responsibility?
3. **Eye seal for non-Genesis contributors.** Confirm a *small static* membership Eye for everyone (institutional belonging, no-one-invisible / Principle IV) vs reserving the Eye seal exclusively for Genesis contributors. Recommendation: everyone gets the mark; only Genesis gets the open/breathing oxblood treatment + wordmark.
4. **Long lives / performance.** For Passports with hundreds of contributions, approve `content-visibility:auto` on off-screen timeline entries and a "show earlier years" progressive reveal, vs rendering the full chronology always.
5. **Works image source.** Confirm the Passport pulls artwork thumbnails through the *same* single source [13] settles on (recommend domain-backed `primaryMedia`), so the Passport and Artwork worlds never drift on imagery.
6. **Owner/private view.** This blueprint covers the **public** archive only ([04 §5]). Should Phase 3 also blueprint the private owner view (consent management, request-contribution), or is that a later (claim-flow) design package?
7. **Country / honorific display.** Confirm `country` and `honorific` render as shown when present, and simply vanish when null (no "Unknown"/placeholder), per Principle VI.
