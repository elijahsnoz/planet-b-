# 08 · Scroll Narrative

Scrolling should feel like **travelling**, not reading. The visitor *descends into history* — through the homepage descent, and literally down into 2026 in the Genesis Chapter.

## The grammar of the scroll
- **Scroll = descent.** Downward is *deeper, earlier, more intimate*. The homepage sinks from the Threshold (sky/void) toward the Earth and the people; the timeline sinks through the phases of 2026.
- **Beats, not pages.** The page is a sequence of full-height *moments* (one feeling each, [02](02-emotional-journey.md)). Between beats, generous empty travel — the visitor moves through space, not text.
- **Pinned moments for the key turns.** A few beats (Wonder's waste→art, the Hope dark→light) **pin** briefly and resolve as you scroll, so the transformation plays out under the visitor's own hand. Use sparingly (2–3 total) — pinning is precious, overused it nauseates.
- **Velocity-aware, never hijacked.** We do **not** seize the scrollbar or force scrolljacking. Native scroll, enhanced: scroll *position* drives transforms; the visitor keeps full control and can fly past.

## Homepage descent (mapped to [04](04-homepage-storyboard.md))
```
0vh   THRESHOLD   void · the Eye closed
      ↓ (quiet travel)
      EYE OPENS · the line
      ↓
  ▸ pin: WASTE → ART  (fragments assemble as you scroll ~150vh, then release)
      ↓
      SILENCE  full-bleed work, long air
      ↓
      REFLECTION  monumental quote · watch ticks
      ↓
  ▸ pin: DARK → LIGHT  (background warms, dust rises ~120vh)
      ↓
      RESPONSIBILITY  proverb · the Eye watches back
      ↓
      BELONGING  founders surface
      ↓
      INVITATION  "the next chapter…"  → nav/legacy arrive
```

## The Descent (Genesis timeline) — travel through strata
```
sticky "depth gauge" (left):        the world (right):
  ── Preparation                    full-bleed media + a line of story per phase
  ── Road Walk                      each phase fades/rises as it enters
  ── Workshop                       media parallax is gentle (≤8%), meaningful
  ── Creation                       ...
  ── Opening · 5 June 2026          the gauge marks how deep into the day we are
  ── Performance: Òdàlè Dà'lẹ̀
  ── Closing
```
Feels like lowering through the layers of the founding, not scrolling a list.

## Craft & guardrails
- Scroll-linked work uses `useScroll`/`useTransform` (or CSS scroll-driven animations where supported), throttled to rAF; scenes **pause when off-viewport** (IntersectionObserver).
- Budget: at most ~3 pinned scenes site-wide; everything else is simple reveal-on-enter ([03](03-motion-storyboard.md) S6).
- **Reduced-motion / no-JS:** no pinning, no scroll-linked transforms — the same beats become a calm, monumental vertical read with cross-fades. The story still travels, just on foot.
- **Mobile first:** pins shorten, parallax reduces, particle counts drop; the descent must feel right on a phone before a desktop.
- **Never trap the reader.** A persistent, subtle "skip to the archive" lets anyone leave the cinematic descent immediately (researchers, returning visitors).
