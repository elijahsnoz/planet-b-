# 03 · Motion Storyboard

Motion is **storytelling**, never decoration. Each signature movement below carries a specific meaning; if it doesn't, it's cut. All built on `transform`/`opacity` only (60fps), GPU-friendly, paused off-screen, and fully answered by a reduced-motion path.

## The signature movements (the "shots")

### S1 · The Eye Opens (Arrival → Curiosity)
```
frame 0.0s   ·  closed lid — a thin horizontal line in the dark
frame 1.5s   ·  the lid parts; the iris (a world) is revealed, wet with faint light
frame 2.2s   ·  the pupil settles; a single slow blink
meaning      ·  awareness awakening — the movement begins by being *seen*
reduced      ·  fade the open Eye in over 400ms; no lid animation
```

### S2 · Waste Becomes Art (Wonder)
```
scroll 0%    ·  ~40 fragments of discarded material scattered, drifting in dark space
scroll 50%   ·  fragments migrate toward a center, rotating, finding their places
scroll 100%  ·  they lock into a recognizable artwork (e.g. The Watchful Eye), light blooms
meaning      ·  transformation — the core promise, enacted, not described
craft        ·  scroll-linked (useScroll → transform); fragments are lightweight layers
reduced      ·  a static before→after dissolve (two images, 1 cross-fade)
```

### S3 · The Breath (everywhere, ambient)
```
loop 6s      ·  the Eye / the ground scales 1.000 → 1.012 and back, ease-in-out
meaning      ·  the Earth is alive; the world breathes with the visitor
reduced      ·  no loop (static)
```

### S4 · The Watch Ticks Once (Reflection)
```
trigger      ·  the Reflection beat enters viewport
action       ·  a damaged watch hand jumps one second, then stills; faint tick (if sound on)
meaning      ·  urgency — time is short, then we hold our breath
reduced      ·  no tick; the watch is simply present
```

### S5 · Dark Becomes Light (Hope)
```
range        ·  across the Hope passage, the background warms: near-black → deep clay → paper
overlay      ·  fine dust/particles drift upward toward light (slow, sparse)
meaning      ·  pollution lifting; regeneration; dawn
reduced      ·  a simple background color transition, no particles
```

### S6 · The Reveal (content entrances)
```
on enter     ·  text/image rises 16–24px + fades in, once; children stagger 50ms
meaning      ·  memory surfacing; things coming into being
reduced      ·  appear instantly (no transform)
```

### S7 · The Descent (Journey/timeline)
```
behavior     ·  scrolling the timeline feels like lowering through strata of 2026;
                a sticky date "depth gauge" counts the phases as you sink
meaning      ·  travelling into history, not reading a list
reduced      ·  a clean vertical timeline, normal scroll
```

## Motion grammar (tokens — extend docs/06)
```
ease-threshold  cubic-bezier(.22,.61,.36,1)   slow, cinematic reveals
ease-standard   cubic-bezier(.2,0,0,1)        UI enters
dur: breath 6s · cine 900–1500ms · slow 480ms · base 240ms · instant 120ms
particles: ≤ 60 on screen, opacity ≤ .15, will-change: transform, paused off-viewport
```

## Hard rules
- **Earn it or kill it.** Every animation maps to a meaning above. New motion must justify itself or be removed.
- **60fps or it doesn't ship.** Only `transform`/`opacity`; no layout-animating loops; IntersectionObserver to pause heavy scenes; downgrade on `save-data`/low-power.
- **Never block reading.** Motion enhances; content is fully usable mid-animation and with motion off.
- **No spinners as theater.** Loading is a held breath (a dim Eye), not a corporate spinner.
