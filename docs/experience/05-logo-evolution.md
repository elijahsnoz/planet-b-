# 05 · Logo Evolution

The mark must work as a **static institution seal** and as a **living being**. It evolves from the Phase-0 "Eye-World" concept (docs/08) into a system: one geometry, many states.

## The constant
The geometry never changes: an almond eye whose **iris is a world**, with a fine meridian that doubles as a clock hand near midnight, and a pupil. One color, currentColor, scales from 16px favicon to a building.

```
static seal (favicon, footer, certificate seal, partner lockups)
        .-‐‐‐‐‐‐‐‐-.
     .-'    │      `-.
   (      ( ◉ )        )      ◉ = iris/world · │ = meridian/clock-hand ~11:55
     `-.    │       .-'
        `-‐‐‐‐‐‐‐‐-'
```

## The states (same mark, different life)
| State | Where | Behavior |
|---|---|---|
| **Seal** | favicon, certificates, print, partner co-brand | perfectly still, single color — authoritative |
| **Resting** | header, footer | a near-imperceptible breath (scale 1.00→1.012, 6s) |
| **Waking** | Threshold | opens from a closed lid (S1) on arrival |
| **Watching** | Responsibility beat, idle moments | pupil drifts subtly toward the cursor/scroll, then re-centers |
| **Witness** | loading | dims to ~30% and breathes slowly — a held breath, never a spinner |

## Wordmark
Serif **PLANET B**, open tracking; the mark sits left of or above it. The movement lockup stacks *BECAUSE THERE IS NO PLANET B* in small caps beneath when the full name is needed. Co-brand lockups (Planet B · Royal Norwegian Embassy · Nike Art Gallery) keep each identity distinct ([docs/07 brand](../07-brand-identity.md)).

## Evolution path (decreasing abstraction → increasing life)
```
Phase 0  static SVG mark (shipped: components/PlanetBMark)
   ↓
Phase A  + breath + waking (CSS/Framer, reduced-motion aware)
   ↓
Phase B  + watching (pointer-reactive pupil, throttled, desktop-only nicety)
   ↓
Phase C  the "alive" Eye for the Threshold — richer rendering (see doc 06),
         degrading to the static mark everywhere else and on weak devices
```

## Rules
- The **static seal is the source of truth**; every animated state must collapse back to it pixel-identical.
- One color. The Eye never becomes a rainbow or a gradient logo. Color lives in the *artworks*, not the mark.
- It must read at 16px. If a state doesn't survive favicon scale, that state is decorative-only (large surfaces).
- The mark is **never** stretched, recolored per-campaign, or boxed in a "tech" badge. Timeless, not trendy.
- Accessibility: the mark always carries an accessible label ("Planet B"); animation respects reduced-motion.
