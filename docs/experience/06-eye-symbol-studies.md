# 06 · Eye Symbol Studies

The Eye is not a logo — it is **the soul of Planet B**. It breathes, watches, notices, and reacts, always elegantly, never flashy. This explores how it can be *alive* without becoming a gimmick.

> Source DNA: *The Watchful Eye* by Ajayi Elijah Snoz — a giant eye of discarded plastics, electronics, and a damaged watch. The philosophy: *the planet watches us; we watch over the planet; observation creates responsibility.* The studies extract that, never reproduce the artwork.

## Studies (concepts to prototype, then choose)

### Study A — The Line of Sight (recommended for the Threshold)
A near-abstract Eye rendered in light on dark. The iris is a soft-lit sphere (a world) with faint atmosphere; the meridian glints like a horizon. It opens once on arrival, blinks rarely, and the **pupil tracks slow movement** (scroll position, then cursor) before re-centering. Feels watchful and calm.
```
   dark field · soft rim-light · iris = lit sphere · pupil drifts ~3px toward motion
```
Why: most "alive," most cinematic, still elegant; collapses to the static mark elsewhere.

### Study B — The Assemblage Eye
The iris is composed of a few abstract fragments (a nod to *made of waste*) that **resolve into a whole** on load — enacting waste→art in the symbol itself.
```
   ◔ ◕ ◑  →  ●     fragments converge into one iris
```
Why: richest meaning; reserve the fragment animation for large/hero use; ship the resolved circle as the static mark.

### Study C — The Reflected World
The pupil holds a faint reflection — at the Threshold, a sliver of the breathing Earth; at the Invitation, a sliver of the visitor's own scroll-light. "We are reflected in what we watch."
Why: poetic; use sparingly as a special moment, not the everyday mark.

## Behaviors (the life, defined)
| Behavior | Trigger | Feel | Guardrail |
|---|---|---|---|
| **Breathe** | always | alive | scale ≤1.2%, 6s, off under reduced-motion |
| **Open** | arrival | awakening | once; then rests |
| **Blink** | rare, ~every 20–40s | human, not robotic | randomized cadence; never rhythmic/distracting |
| **Watch** | pointer/scroll movement | noticed, accountable | pupil ≤3–4px drift, eased, throttled to rAF; desktop nicety only |
| **Dim** | loading/idle | a held breath | replaces all spinners |
| **Close** | (optional) leaving / end | rest | subtle, never a "goodbye" gimmick |

## Rendering approach (progressive)
- **Default everywhere:** the static/CSS-animated SVG mark (cheap, crisp, accessible).
- **Threshold only:** an enriched Eye (SVG + soft filters, or a small canvas/shader for the iris glow & particles) — lazy-loaded, **only** if the device can afford it (`save-data`, low-power, reduced-motion → fall back to the SVG).
- No heavy 3D/WebGL globe. The Earth is *felt* (light, dust, breath), not modeled — cheaper and more poetic ([brief: "Earth should not be shown… it should be felt"]).

## Hard limits
- Elegance over spectacle: if a behavior reads as "cute" or "techy," cut it.
- Never autoplay sound with the Eye; the tick/wind is opt-in ([09](09-sound-philosophy.md)).
- Always degrades to the silent static seal. The soul survives even with everything off.
