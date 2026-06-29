# 10 · Homepage Experience Blueprint

> **Status: DESIGN — awaiting approval. Nothing ships until the founder approves.**
> Reversible · build-green · reduced-motion-safe increments only.

## Purpose

The homepage is the **front door of a movement, told as a cinematic documentary**. A
visitor arrives in silence, crosses a threshold, watches waste become art, sits with one
work, hears an artist, feels hope warm the room, is watched back by the planet, meets the
ordinary people who began it, and is handed an unwritten chapter. The arc the canon
mandates — `Curiosity → Wonder → Reflection → Responsibility → Hope → Action`
([docs/phase-3/00-README.md](00-README.md)) — must be *felt as one descent*, not read as a
page. This blueprint **refines the eight beats already shipping**; it does not rebuild them.

## Extends

- **Phase 1 storyboard** — [docs/experience/04-homepage-storyboard.md](../experience/04-homepage-storyboard.md) (Frames 0–8). This document is the cinematic amendment of that storyboard against the *real* code that now implements it.
- **The shipped arc** — [app/(public)/page.tsx](<../../app/(public)/page.tsx>): `Threshold → WasteToArt → Silence → Reflection (TickingWatch) → HopeShift → Responsibility (AliveEye) → Founders → Invitation`.
- **Canon** — [docs/phase-3/00-README.md](00-README.md): the Eye, the Breath, living chrome, quiet-by-default, the four worlds.
- **Tokens** — [app/globals.css](../../app/globals.css) / [tokens/tokens.css](../../tokens/tokens.css): palette, type (Fraunces/Inter/JetBrains Mono), motion durations (`base 240 · slow 480 · cine 900 · breath 6000`), `[data-theme="ink"]`, full reduced-motion override.

## Components in play (real)

| Beat | Component (real path) | Data source ([lib/data](../../lib/data.ts)) |
|---|---|---|
| Threshold | [components/experience/Threshold.tsx](../../components/experience/Threshold.tsx) → wraps [AliveEye](../../components/experience/AliveEye.tsx) | static copy |
| Waste→Art | [components/experience/WasteToArt.tsx](../../components/experience/WasteToArt.tsx) | `getArtwork("the-watchful-eye")`, `artworkImage`, `getPerson` |
| Silence | inline `<section data-theme="ink">` + [Plate](../../components/Plate.tsx) | `getArtwork("man-and-his-environment")` |
| Reflection | [components/experience/TickingWatch.tsx](../../components/experience/TickingWatch.tsx) | `eye.statement` |
| Hope | [components/experience/HopeShift.tsx](../../components/experience/HopeShift.tsx) | `getArtwork("garbage-to-grace")` |
| Responsibility | [AliveEye](../../components/experience/AliveEye.tsx) `watch` | `chapter.yoruba_proverbs[0]` |
| Founders | inline grid + [Plate](../../components/Plate.tsx) + [Reveal](../../components/Reveal.tsx) | `getFoundingArtists()` |
| Invitation | inline `<section data-theme="ink">` | static + links to `/chapters/abuja-2026`, `/origin` |
| (global) | [Reveal](../../components/Reveal.tsx), [Plate](../../components/Plate.tsx), `SiteHeader`/`SiteFooter` | — |

---

## The descent — section sequence & what each *earns*

```
 SCENE          EMOTION          EARNS (the visitor leaves with…)
 ─────────────────────────────────────────────────────────────────────
 0 Threshold    Curiosity        "I have entered somewhere, not opened a tab."
 1 Waste→Art    Wonder           "Trash became this. How?"
 2 Silence      Stillness        "I'm allowed to just look. Nothing is selling me."
 3 Reflection   Recognition      "A human made this, and meant it. The clock is real."
 4 Hope         Lift             "Damage is not the last word."
 5 Responsib.   Reckoning        "It's looking back. This is about me."
 6 Founders     Belonging        "Ordinary people did this. People like me."
 7 Invitation   Agency (Action)  "The next chapter is mine to write."
```

Each scene is a full-viewport (or near) beat; the **spine is the scroll**. The pinned
scroll choreography (Waste→Art, Hope) are the two "set pieces"; the rest are quiet plates
with `Reveal`. The rhythm must alternate **tension (ink) ↔ release (paper)** so the descent
breathes:

```
ink ──── (paper warming) ──── ink ── paper ── ink ── paper
 0       1          2          3      4        5      6/7
Thresh   Waste/Silence(ink)   Reflect Hope→   Resp   Founders→Invitation(ink)
```

---

## How the Eye threads through

The Eye ([AliveEye](../../components/experience/AliveEye.tsx)) is the documentary's
recurring subject — it **opens, observes, then turns to watch the viewer**:

```
 0 Threshold   ◉  opens (openOnMount, 500ms) — the film begins
 1–4           ·  absent as a glyph, but ITS artwork ("the-watchful-eye") is the
                  hero of Waste→Art — the Eye is literally the first thing built
 5 Responsib.  ◉  returns with watch=true, openOnMount=false — now it watches YOU
 footer        ·  the small mark (PlanetBMark) persists — the institution endures
```

This is the canon's "the Eye returns — now watching you" (storyboard Frame 6). **New
intent:** make scene 5's open *answer* scene 0's open — same motif, inverted relationship
(it looked out; now it looks in).

---

## Scene-by-scene refinement

### Scene 0 — THE THRESHOLD · Curiosity
*Refines storyboard Frames 0–1; component [Threshold.tsx](../../components/experience/Threshold.tsx).*

```
┌─────────────────────────────────────────────┐  data-theme="ink"
│                                               │  near-black bg-bg, two faint
│                  ╭─────╮                       │  radial gradients (clay + oxblood)
│                 (   ◉   )   ← AliveEye size140 │  opens 500ms after mount
│                  ╰─────╯                       │
│                                               │
│          Because there is no Planet B.        │  Fraunces, Reveal delay 0.9
│        The living archive of a movement.      │  Inter muted, Reveal delay 1.4
│                                               │
│                  descend                       │  ↓ cue, bottom-8, aria-hidden
│                    │                           │
└─────────────────────────────────────────────┘
```
- **Emotion:** Curiosity — arrival into a held breath.
- **Content (real):** static line + tagline (in `Threshold.tsx`); the Eye.
- **Motion signature:** Eye opens (scaleY 0.04→1, 1.2s, custom ease) over the Breath loop (`pb-breath`, 6s); copy rises after the Eye (the line waits for the gaze). **Refine:** add a one-time ~1.2s ambient settle of the gradient depth (opacity 0→0.7) so the room "comes up" rather than appears.
- **Reduced-motion:** Eye renders open & still (already handled in `AliveEye`); gradient at final opacity; copy present immediately. The Threshold still reads as a monumental dark title card.
- **Performance:** This is **LCP**. First paint = ink bg + the inline SVG Eye (tiny) + system-then-Fraunces text. No image here. Header/footer JS and below-fold scenes must not block. Hold the budget from [09-performance-budget.md](09-performance-budget.md).
- **Nav:** Per [04-navigation-philosophy.md](04-navigation-philosophy.md), the persistent header **fades in only after the Threshold** (on first scroll or scroll-up) so nothing dominates the crossing. *(New behavior — see Open questions.)*

### Scene 1 — WASTE BECOMES ART · Wonder
*Refines Frame 2; component [WasteToArt.tsx](../../components/experience/WasteToArt.tsx) (240vh pinned).*

```
descend ▼
   ◦   ◦        ◦         12 colored shards drift on a ring
      ◦   →→→  converge  →→→   ◦       (palette tokens as shard colors)
          ╔═══════════════╗
          ║  ▓ the-watchful ║   artwork resolves: opacity 0→1 (.15–.85),
          ║  ▓   -eye  ▓    ║   scale .92→1 (.15–1) as you scroll the 240vh
          ╚═══════════════╝
              The Watchful Eye
              <artist full_name>        caption fades in last (.7–.95)
```
- **Emotion:** Wonder — the central act of the movement (discard → art) enacted, not stated.
- **Content (real):** `getArtwork("the-watchful-eye")` image + title; `getPerson(eye.artist).full_name`.
- **Motion signature:** scroll-linked shard convergence + artwork resolve + late caption (already built). **Refine:** none structurally; ensure the shard palette stays *quiet* (it currently uses oxblood/signal — acceptable as "fragments," but verify signal green isn't read as a "verified" cue here, which canon reserves for impact/verification).
- **Reduced-motion:** static artwork + title + artist + "What the world threw away. Look closer." (already the fallback). Wonder survives as a captioned plate.
- **Performance:** 240vh pinned section; `next/image` with `object-contain`, `sizes` already set. Animate only `transform`/`opacity` (it does). Lazy below the fold of the Threshold.

### Scene 2 — SILENCE · Stillness
*Refines Frame 3; inline `data-theme="ink"` + [Plate](../../components/Plate.tsx) `fit="contain"`.*

```
┌─────────────────────────────────────────────┐  data-theme="ink", 100svh
│                                               │
│            ┌───────────────────┐              │  one square work, contained,
│            │  man-and-his-       │             │  shadow-museum-soft, lots of air
│            │     environment    │             │  NO caption — presence only
│            └───────────────────┘              │
│                                               │
└─────────────────────────────────────────────┘
```
- **Emotion:** Stillness — deceleration; the museum's "quiet by default."
- **Content (real):** `getArtwork("man-and-his-environment")`, image only.
- **Motion signature:** single `Reveal` (rise+fade once). **Refine:** consider an *extremely* subtle living-chrome breath on the matting (≤1% scale, tied to `pb-breath`) so the work feels alive without animating — must stay imperceptible, or omit.
- **Reduced-motion:** `Reveal` renders instantly; the still work on ink is the whole point — fully intact.
- **Performance:** one contained image; cheap. The pause also gives the browser room before the next pinned scene.

### Scene 3 — REFLECTION · Recognition
*Refines Frame 4; [TickingWatch.tsx](../../components/experience/TickingWatch.tsx) + blockquote.*

```
        ╭───╮
        │ ◷ │   damaged watch — second hand ticks ONCE on enter
        ╰───╯
   "My piece uses an eye made of discarded plastics… the damaged
    watch symbolises the urgency of addressing environmental
    issues before it is too late."
                         — <artist full_name>, The Watchful Eye
```
- **Emotion:** Recognition — a human, a deadline, a real voice.
- **Content (real):** `eye.statement` (artist's own words); `eyeArtist.full_name`; `eye.title` as cite.
- **Motion signature:** the watch's single tick (`rotate 0→6deg`, 0.12s) when in view — urgency as a *single* gesture, then stillness. Quote via `Reveal`.
- **Reduced-motion:** watch renders still (no tick); quote present. Recognition survives in text.
- **Performance:** inline SVG + text; trivial.

### Scene 4 — HOPE · Lift
*Refines Frame 5; [HopeShift.tsx](../../components/experience/HopeShift.tsx) (bg `#0b0b0c→#7a5c3e→#f6f3ec`, dust rising).*

```
   · dust drifting upward ·            background WARMS as you scroll
 ┌───────────────┐   FROM WASTE TO GRACE
 │ garbage-to-    │   Waste is not an end, but a beginning.
 │    grace ▓     │   <hope.statement>
 └───────────────┘
   (ink) ───────────────────────── (clay) ───────────────── (paper)
```
- **Emotion:** Lift — the literal turn from dark to light; the movement's thesis.
- **Content (real):** `getArtwork("garbage-to-grace")` image + `hope.statement`; headline "Waste is not an end, but a beginning."
- **Motion signature:** scroll-linked `backgroundColor`/`color` warm + 14 rising dust motes (already built). This is the arc's emotional fulcrum; let it be the **longest** dwell.
- **Reduced-motion:** static warm paper surface with the same image + copy (fallback already returns `bg-paper text-ink`). Lift survives as a bright, hopeful plate.
- **Performance:** animating `backgroundColor` is a paint, not transform — acceptable on one large section but **profile on a mid-range phone**; if it janks, swap to an opacity cross-fade of two stacked layers (transform/opacity only). Note for build.

### Scene 5 — RESPONSIBILITY · Reckoning
*Refines Frame 6; [AliveEye](../../components/experience/AliveEye.tsx) `watch openOnMount={false}` on ink.*

```
┌─────────────────────────────────────────────┐  data-theme="ink", 80svh
│                  (   ◉   )                     │  the Eye RETURNS — watches you
│                                               │  (pupil drifts toward pointer on
│      Bi ilu baa baje, ti onilu lo n da.       │   fine pointers; re-centers)
│   When the community falls into disrepair,    │
│   its restoration lies in the hands of        │
│   those who inhabit it.                       │
└─────────────────────────────────────────────┘
```
- **Emotion:** Reckoning — the planet (and the proverb) addresses the visitor directly.
- **Content (real):** `chapter.yoruba_proverbs[0]` (`.yoruba` + `.english`).
- **Motion signature:** Eye breathes + pupil tracks the pointer (fine-pointer only, `requestAnimationFrame`-throttled). **This is the inversion of Scene 0** — same Eye, now looking *in*. Proverb via `Reveal`.
- **Reduced-motion / coarse pointer:** Eye still & open, no tracking (already guarded by `matchMedia("(pointer: fine)")`); proverb present. Reckoning survives.
- **Performance:** one `pointermove` listener, rAF-coalesced, `passive`; spring on a 3px pupil. Cheap. Confirm the listener unmounts (it does, cleanup in effect).

### Scene 6 — BELONGING · Founders
*Refines Frame 7; inline grid of `getFoundingArtists().slice(0,10)`.*

```
            Ordinary people began this.
   Fifteen artists, a gallery (since 1983), an embassy that
   crossed an ocean — one World Environment Day in Abuja.

   ◯  ◯  ◯  ◯  ◯        each: Plate(first artwork) + full_name,
   ◯  ◯  ◯  ◯  ◯        links → /artists/{slug}, staggered Reveal
```
- **Emotion:** Belonging — the movement has faces, and they're reachable.
- **Content (real):** `getFoundingArtists()` (first 10); each `p.full_name`, `artworkImage(p.artworks[0])`, link `/artists/{slug}`.
- **Motion signature:** staggered `Reveal` (delay `(i%5)*0.04`); hover lifts name to accent. **Refine:** these portraits are the bridge to the Passport world — on hover, consider a faint Eye watermark or a "view passport" affordance to foreshadow [12-passport-blueprint.md](12-passport-blueprint.md). *(Optional — see Open questions.)*
- **Reduced-motion:** grid renders instantly, all faces present, links intact.
- **Performance:** 10 contained `Plate` images with `sizes` set; lazy (below fold). Keep grid images modest.

### Scene 7 — THE INVITATION · Action
*Refines Frame 8; inline `data-theme="ink"` 90svh.*

```
┌─────────────────────────────────────────────┐  data-theme="ink"
│              THE NEXT CHAPTER                  │  Fraunces, monumental, calm
│           has not yet been written.           │
│                                               │
│        [ Enter the Genesis Chapter ]          │  → /chapters/abuja-2026 (accent btn)
│          Become part of the story             │  → /origin (quiet underline)
│                                               │
│   · SiteFooter — legacy index, the small mark │  nav/footer arrive only now
└─────────────────────────────────────────────┘
```
- **Emotion:** Action — the end that is a beginning; agency handed over.
- **Content (real):** static headline; primary CTA → `/chapters/abuja-2026` (hands the visitor to the Chapter world, [11-chapter-blueprint.md](11-chapter-blueprint.md)); secondary → `/origin`.
- **Motion signature:** two `Reveal`s (headline, then CTAs); button hover `-translate-y-0.5`. **Refine:** the small Eye mark in the footer is the institution's persistence — it should be the *last* breathing thing on the page.
- **Reduced-motion:** all present and still; CTAs fully usable.
- **Performance:** text + footer; trivial. CTA is the first hard navigation — when page transitions land ([03](03-motion-language.md)/[06](06-interaction-principles.md)), this hand-off becomes an Eye-blink transition into the Chapter.

---

## Reused vs. new

**Reused as-is (no code change required to ship this blueprint):**
`Threshold`, `WasteToArt`, `HopeShift`, `TickingWatch`, `AliveEye`, `Reveal`, `Plate`,
`SiteHeader`, `SiteFooter`, and all `lib/data` getters. The shipped 8-beat arc *is* the
spine — this document elevates it, it does not replace it.

**New primitives proposed (small, reversible, each optional):**
1. **`<EyeTransition>`** — the Eye as a page-transition motif (a blink that wipes the screen) for the Invitation→Chapter hand-off. Specified in [03-motion-language.md](03-motion-language.md)/[06-interaction-principles.md](06-interaction-principles.md); homepage is its first consumer.
2. **Deferred-nav behavior** — header fades in after the Threshold (scroll-aware), per [04-navigation-philosophy.md](04-navigation-philosophy.md). Currently the persistent header is always present.
3. **`<AmbientDepth>`** (optional living chrome) — extract the Threshold's gradient settle into a reusable quiet-atmosphere layer for ink scenes (0/2/5/7), so "alive, not animated" is consistent.
4. **Founders→Passport foreshadow** (optional) — a faint Eye/"passport" hover affordance on Scene 6 portraits.

None of these block the current page; all degrade to the existing experience and to reduced-motion.

---

## Open questions for approval

1. **Deferred nav:** approve the header fading in only *after* the Threshold (vs. always-present)? This changes first-impression but matches storyboard Frame 0 ("no nav · no menu").
2. **Eye-blink page transition** between Invitation and the Genesis Chapter — ship now as the first transition, or wait for the global transition system in [03](03-motion-language.md)?
3. **Hope background warm** is a `backgroundColor` paint, not a transform. Accept as-is if it profiles clean on a mid-range Abuja phone, or pre-emptively refactor to a stacked opacity cross-fade?
4. **Silence "breathing matting"** (≤1% scale on `pb-breath`) — tasteful living chrome, or does it violate "quiet by default"? Default recommendation: omit unless truly imperceptible.
5. **Founders→Passport foreshadow** affordance — yes/no, and does it appear before the Passport world ships?
6. **Shard palette** in Waste→Art currently includes `signal #2FA36B`; canon reserves signal for verified/impact. Recolor the shards to neutral palette only?
