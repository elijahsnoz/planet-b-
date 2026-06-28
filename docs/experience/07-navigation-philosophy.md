# 07 · Navigation Philosophy

Navigation should never dominate the first impression — **the movement should.** We design wayfinding that feels like moving through a building, not operating an app.

## Principles
1. **Withhold, then offer.** The Threshold has no visible nav. The persistent header fades in only after the visitor commits to the descent (past Frame 1), or on scroll-up. Leaving the top can return them to quiet.
2. **Orientation over options.** At any depth the visitor should sense *where they are in the world* more than *what else they could click*. Fewer doors, clearer ground.
3. **The Eye is home.** The mark is the one constant; selecting it always returns to the Threshold. It is the north star, not a logo slot.
4. **Reveal-on-intent.** Full navigation lives behind a calm, deliberate gesture (a quiet menu that opens to a *map of the world*, not a list of links). Opening it dims the world and presents the passages as places.
5. **Depth gauge, not breadcrumbs.** In the Archive/Journey, a slim progress/locator (e.g. the timeline depth, the chapter name) tells you how deep you are — travel feedback, not file paths.

## The menu as a "map of the world"
```
opened menu (overlay, world dimmed behind):

        ( ◉ )  PLANET B

        THRESHOLD        return to arrival
        MEMORY           why there is no Planet B
        DISCOVERY        the works · the Eye
        ARCHIVE          Genesis Chapter — Abuja 2026
        JOURNEY          the founding timeline
        LEGACY           founders · council · certificates
        INVITATION       become part of the story

        ── research · press · about ──   (institutional, quiet)
```
Calm typography, generous space, each item a *place* with a one-line sense-of-what. No dropdowns, no mega-menu density.

## Persistent chrome (when present)
- Minimal: the Eye + wordmark (left), a single menu affordance (right), the sound glyph. Nothing else.
- Translucent over content, never a heavy bar; recedes while reading, returns on scroll-up.
- On deep records (artwork/person): a quiet "← back to the gallery / chapter" and cross-links to *related* records ([the graph](../architecture/07-registry-and-relationships.md)) — discovery by relationship, not by menu.

## Accessibility & robustness (non-negotiable)
- The "reveal-late" nav is a **progressive enhancement**: a standard, keyboard-reachable nav + skip-link exists from first paint for assistive tech and no-JS; the cinematic withholding is layered on top, never a barrier.
- Full keyboard operation, focus trap in the menu overlay, visible oxblood focus ring, ESC to close, reduced-motion = instant menu.
- Deep links work for everyone (researchers arrive mid-world): every passage and record has a stable URL and renders standalone with orientation intact.
