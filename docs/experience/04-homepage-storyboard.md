# 04 · Homepage Storyboard

The homepage is not a page — it is **the entire journey in one descent**, ending in a beginning. Frame-by-frame. (ASCII = intent, not final art.)

## Frame 0 — THE THRESHOLD  (Arrival)
```
┌───────────────────────────────────────────────┐
│                                                 │   near-black void
│                                                 │   faint atmospheric depth
│                    ▁▁▁▁▁                         │   the Eye — closed (a line)
│                                                 │
│                                          ◔ sound │   one tiny, optional sound glyph
└───────────────────────────────────────────────┘
no nav · no menu · no copy · no cookie wall over content · ~2s of quiet
```

## Frame 1 — THE EYE OPENS  (Curiosity)
```
┌───────────────────────────────────────────────┐
│                    ( ◉ )                         │   the Eye opens; iris = a world
│                                                 │
│           Because there is no Planet B.         │   one line, serif, fades in
│                     ↓                            │   a single quiet "descend" cue
└───────────────────────────────────────────────┘
nav still absent — the movement dominates, not the interface
```

## Frame 2 — WASTE BECOMES ART  (Wonder)
```
descend ──────────────────────────────────────────
  ◦  ◦   ◦      fragments drifting…        ◦   ◦
        ◦   →→→  converging  →→→   ◦
                  ▓▓▓▓▓  …locking into an artwork
"What the world threw away. Look closer."
```

## Frame 3 — SILENCE
```
┌───────────────────────────────────────────────┐
│                                                 │
│            ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                       │   one artwork, full-bleed
│            ▓  the work breathes ▓                │   on deep ground, lots of air
│                                                 │   no caption yet — just presence
└───────────────────────────────────────────────┘
```

## Frame 4 — REFLECTION
```
"My piece uses an eye made of discarded plastics…
 the damaged watch symbolises the urgency of
 addressing environmental issues before it is too late."
                              — an artist of the Genesis Chapter
                                              [watch ticks once]
```

## Frame 5 — HOPE  (dark → light)
```
background warms from black → clay → paper · dust rising toward light
            a hand of waste, a butterfly on its finger
                 "Waste is not an end, but a beginning."
```

## Frame 6 — RESPONSIBILITY
```
            ( ◉ )   the Eye returns — now watching you
   "Bi ilu baa baje, ti onilu lo n da."
   When the community falls into disrepair, its restoration
   lies in the hands of those who inhabit it.
```

## Frame 7 — BELONGING  (the founders surface)
```
   ◯  ◯  ◯  ◯  ◯  ◯  ◯      faces fade up, named
   "Fifteen artists began this. Ordinary people.
    A gallery. An embassy. One World Environment Day in Abuja."
   → Enter the Genesis Chapter
```

## Frame 8 — THE INVITATION  (the end that is a beginning)
```
┌───────────────────────────────────────────────┐
│                                                 │
│        The next chapter has not yet             │   monumental, calm
│            been written.                        │
│                                                 │
│        [ Become part of the story ]             │   not donate · not subscribe
│                                                 │
│   ·  Legacy index appears here (quiet footer) · │   nav/footer arrive only now
└───────────────────────────────────────────────┘
```

## Notes for build
- **Nav appears late.** The persistent header fades in only after Frame 1 (or on scroll-up), so the Threshold is undominated. See [07](07-navigation-philosophy.md).
- **The descent is the spine.** Each frame is a scroll-pinned/section beat with the transitions in [03](03-motion-storyboard.md) and [08](08-scroll-narrative.md).
- **Performance budget.** First paint = the dark Threshold + the Eye (tiny). Heavy scenes lazy-load below the fold. Fast on a mid-range phone in Abuja.
- **Graceful core.** With JS off / reduced-motion: the same eight frames render as a quiet, monumental vertical essay — every word and image intact, just still.
- **Content is live data.** The quote, the artworks, the founders all come from the backend ([lib/data](../../lib/data.ts)) — the story is editable, never hardcoded.
