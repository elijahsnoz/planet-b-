# 06 · Motion Principles

> Every animation must earn its existence. Motion communicates emotion — or it is removed.

## The four laws
1. **Motion has meaning.** It reveals relationship, transformation, or hierarchy — never decoration.
2. **Calm by default.** Slow, weighted, natural easing. Nothing bounces, nothing flashes. This is a museum, not a carousel.
3. **60fps or it doesn't ship.** Animate only `transform` and `opacity`. No layout thrash, no animating `width/top/box-shadow` in loops.
4. **Reduced motion is a first-class path**, not a fallback. `prefers-reduced-motion: reduce` → cross-fades and instant states; the emotional arc still reads as a quiet sequence.

## The signature gestures
- **The Breath** — the Earth/eye on the threshold breathes (subtle scale 1.0→1.03 over ~6s, ease-in-out, infinite). The heartbeat of the whole site.
- **Waste → Art** — as the visitor scrolls, scattered material fragments converge into an artwork (scroll-linked transform, GPU only). The core "transformation" metaphor. Built as a progressive enhancement over a static before/after for reduced-motion.
- **The Reveal** — content rises 16–24px and fades in on enter (once, not on every scroll-by). Stagger children 40–60ms.
- **The Watch** — a single damaged-watch motif ticks once on the Reflection beat (urgency), then stills.

## Tokens
```
--dur-instant 120ms   (hover, focus, small state)
--dur-base    240ms   (most UI transitions)
--dur-slow    480ms   (section reveals, image entrances)
--dur-cine    900ms+  (threshold / cinematic beats)
--ease-standard  cubic-bezier(.2,.0,.0,1)    (enter)
--ease-exit      cubic-bezier(.4,.0,1,1)
--ease-breath    ease-in-out                 (loops)
```

## Implementation notes
- **Framer Motion** for component/orchestration; **scroll-linked** effects via `useScroll`/`useTransform` or CSS scroll-driven animations where supported, throttled to rAF.
- Lazy-load and **pause heavy scroll scenes off-viewport** (IntersectionObserver). Never run the canvas/video when not visible.
- Respect data-saver / low-power: degrade the cinematic threshold to a single static hero with the line + sound invite.
- Audio is **always opt-in**, never autoplay with sound; a persistent, quiet mute/un-mute control.
