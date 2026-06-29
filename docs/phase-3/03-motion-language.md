# 03 . Motion Language

**Purpose.** Define the complete Phase 3 motion system: the named signatures that
already exist (The Breath, The Reveal, The Watch, Waste-to-Art) PLUS the new ones
the institution needs to feel like a world -- context-preserving page/section
transitions (the Eye as motif), the Eye as a loading state, hover/focus
micro-interactions, scroll-choreography for the cinematic surfaces, and "living
chrome" ambient systems. Every signature here is meaning-bearing, runs at 60fps on
`transform`/`opacity` only, and carries a reduced-motion path. DESIGN ONLY --
nothing ships until approved.

**Extends.** [docs/experience/03-motion-storyboard.md](../experience/03-motion-storyboard.md)
(S1-S7, the motion grammar, the hard rules) and the tokens in
[tokens/motion.json](../../tokens/motion.json) /
[tokens/tokens.css](../../tokens/tokens.css) (durations `instant 120 . base 240 .
slow 480 . cine 900 . breath 6000`; easings `standard`, `exit`, `breath`;
`reveal-rise 24px`; `stagger 50ms`; the reduced-motion override). It cites the
working vocabulary in [components/experience/AliveEye.tsx](../../components/experience/AliveEye.tsx),
[WasteToArt.tsx](../../components/experience/WasteToArt.tsx),
[HopeShift.tsx](../../components/experience/HopeShift.tsx),
[TickingWatch.tsx](../../components/experience/TickingWatch.tsx), and
[components/Reveal.tsx](../../components/Reveal.tsx), plus the `pb-breath`/`pb-blink`
keyframes in [app/globals.css](../../app/globals.css). It governs all of
[00-README.md](00-README.md) (the constitution, Sec "Non-negotiables").

---

## 0 . The one law

```
Animate ONLY transform & opacity.   60fps or it doesn't ship.
Every motion carries meaning.        Every motion has a reduced-motion path.
```

No animation of `width`, `height`, `top/left`, `margin`, `box-shadow` blur,
`background-color` of large surfaces (HopeShift's `backgroundColor` tween is the
single sanctioned exception -- see S5 / Sec 6.4 -- because it is the *meaning*), or
`filter` on scroll. Shadow "lift" is faked with an opacity-crossfaded shadow layer,
never an animated blur. This law is inherited verbatim from 00-README Sec "Non-negotiables"
and experience/03 "Hard rules".

---

## 1 . The signature catalogue (at a glance)

```
EXISTING (Phase 1 -- extended here, not redefined)
  The Breath        S3   ambient heartbeat        pb-breath / AliveEye
  The Reveal        S6   content entrance          Reveal.tsx
  The Watch         S4   reflection / urgency      TickingWatch.tsx
  Waste-to-Art      S2   transformation            WasteToArt.tsx
  The Eye Opens     S1   arrival                   AliveEye openOnMount
  Dark->Light       S5   hope passage              HopeShift.tsx
  The Descent       S7   strata / timeline         (spec only, Phase 1)

NEW (Phase 3 -- specified below)
  The Blink         Sec 4   transition motif          page/section change
  The Held Breath   Sec 5   loading / pending         the Eye dims & slows
  The Notice        Sec 6.1 hover/focus micro         pointer/keyboard attention
  The Lift          Sec 6.2 touch-the-work            artwork on attention
  The Draw          Sec 6.3 link / threshold          underline + border warm
  The Strata        Sec 6.5 scroll-choreography       cinematic surfaces
  Living Chrome     Sec 7   dust/light/atmos/tone     ambient GPU systems
```

---

## 2 . Token additions (proposed -- extend motion.json)

These are the *only* new primitives Phase 3 needs. They are reversible additions to
[tokens/motion.json](../../tokens/motion.json) and mirrored as `var(--pb-*)` in
[tokens/tokens.css](../../tokens/tokens.css)+[app/globals.css](../../app/globals.css)
(the dual-source debt is noted in 00-README Sec "the gap"; these additions must land in
both until that seam is resolved).

```
duration
  blink      320ms   the transition dip-through-dark (a blink, not a load)   NEW
  (instant/base/slow/cine/breath unchanged)

easing
  threshold  cubic-bezier(.22,.61,.36,1)   cinematic reveals      PROMOTE
             (already used inline in AliveEye open + Reveal-as-threshold;
              promote from literal to a named token so it stops being copy-pasted)
  (standard/exit/breath unchanged)

transform
  notice-lift   2px    hover/focus rise for chrome (links, controls)   NEW
  work-lift     4px    artwork/portrait rise on attention              NEW
  work-zoom     1.01   artwork gentle zoom on attention                NEW
  (reveal-rise 24px, breath-scale 1.0->1.03 unchanged)

ambient (living chrome -- all opacity-capped, GPU-only)
  dust-max        <= 60 particles on screen   (matches experience/03 grammar)
  dust-opacity    <= 0.18                      (matches HopeShift Dust)
  parallax-max    <= 16px                      hard cap on any scroll parallax

reduced_motion
  duration-cap    240ms  (unchanged)
  blink -> 1ms, ambient systems -> not mounted, scroll-scenes -> static (unchanged policy)
```

Reduced-motion already collapses every `--pb-dur-*` to `1ms` and `--pb-reveal-rise`
to `0px`; `--pb-dur-blink` and the lifts must be added to that override block.

---

## 3 . Existing signatures -- what Phase 3 changes

| Signature | File today | Phase 3 extension | Still true |
|---|---|---|---|
| The Breath | `AliveEye` `pb-breath` | becomes the loading "held breath" base (Sec 5); reused as verification-seal idle, passport mark | 6s, 1.0->1.03, ease-in-out, off under reduce |
| The Reveal | `Reveal.tsx` | gains a `threshold` variant (slower, `ease-threshold`, `cine`) for the four cinematic surfaces' hero blocks | rise+fade once, stagger 50ms, instant under reduce |
| The Watch | `TickingWatch` | unchanged motion; reused only on Reflection beats (never decorative) | single tick, then still |
| Waste-to-Art | `WasteToArt` | the canonical scroll-scene template for Sec 6.5 Strata; shard count stays <= grammar cap | scroll-linked, static before/after under reduce |
| Dark->Light | `HopeShift` | the sanctioned color-tween exception; its `Dust` is the reference Living-Chrome implementation (Sec 7.1) | warms near-black->paper, dust drifts, static under reduce |

---

## 4 . The Blink -- page & section transitions (context-preserving)

The recurring transition motif of Planet B. Navigation is *crossing a threshold*,
not loading a page (experience/10 Sec "Page-to-page transitions"). The screen performs a
short **blink** -- a dip through near-black -- and the next passage rises into light.
The Eye is the connective tissue: the same mark that lives in the header is what
"closes" over the old view and "opens" onto the new one.

```
trigger     route change (Next App Router nav) OR major in-page section swap
storyboard  0ms    outgoing view at rest
            0-160   eyelid closes: a near-ink scrim wipes in (opacity 0->1, scaleY
                    from center) -- "the blink" -- outgoing content fades to 0
            ~160    swap (route commits / section mounts) behind the scrim
            160-320 eyelid opens: scrim fades/parts (scaleY 1->0 from center),
                    incoming content rises reveal-rise(24px)+fade with ease-threshold
property    transform (scaleY of the scrim) + opacity. NO layout, NO color tween.
token       --pb-dur-blink (320ms total), ease-threshold; incoming uses slow/cine
            on the four worlds, base elsewhere
meaning     awareness closing and re-opening on a new place -- continuity of a single
            consciousness moving through the archive, never a "page load"
```

**Context preservation -- two mechanisms, progressive:**

```
PREFERRED   View Transitions API (where supported)
            - mark persistent elements (the Eye/header mark, an artwork thumbnail
              that becomes the hero) with view-transition-name so the browser
              morphs them across the navigation (shared-element continuity)
            - we author ::view-transition-old/new groups to animate ONLY opacity
              + transform (default cross-fade replaced by our blink curve)
            - Next 14 App Router: opt-in per-navigation; degrade silently if the
              UA lacks support (feature-detect document.startViewTransition)

FALLBACK    framer-motion (no View Transitions support)
            - AnimatePresence mode="wait" at the layout boundary runs the same
              blink: scrim scaleY + content opacity/rise
            - shared element becomes a crossfade (thumbnail fades out, hero fades
              in at slow) rather than a true morph -- same meaning, lower fidelity
```

```
reduced-motion   NO scrim, NO scaleV, NO morph. Instant content swap with a single
                 base-capped (<=240ms) cross-fade. The "blink" becomes a quiet cut.
                 Honors the experience/10 promise: arc still reads as a sequence.
perf             scrim is one fixed full-bleed <div> on a GPU layer (transform +
                 opacity only); it is removed from the DOM when idle (no permanent
                 compositing layer). Shared-element morph is browser-native (cheap)
                 in the View Transitions path; the framer fallback animates exactly
                 two elements. INP must not regress -- the swap commits at ~160ms so
                 perceived nav latency stays under the blink, never gated behind it.
```

---

## 5 . The Held Breath -- the Eye as loading state

There are **no spinners** (experience/03 hard rule "No spinners as theater";
experience/10 "loading is the Eye holding its breath"). Pending state IS the Eye,
breathing slower and dimmer -- a world waiting, not a machine working.

```
trigger     route pending / data fetch in flight / suspense boundary / form submit
visual      AliveEye (currentColor, quiet) at rest size, but:
            - the breath SLOWS (period stretches ~6s -> ~9s feel) and DIMS
              (opacity floor drops from .92 toward ~.6 at trough)
            - the pupil stops watching the pointer (attention turns inward)
            - NO progress bar, NO percentage, NO spin
property    transform: scale (the existing breath) + opacity. Nothing else.
token       built on pb-breath + --pb-dur-breath; "held" variant lengthens the
            ease-in-out period and lowers the opacity trough
meaning     the institution is gathering itself; the visitor waits WITH a living
            thing, not for a loader. Patience as part of the calm.
resolve     when content is ready -> hand off into The Blink (Sec 4) open, or simply
            Reveal (Sec 3) the content in. The breath returns to normal rate.
states      - skeletal: while breathing, low-contrast placeholder mats (Plate
              shapes) hold layout to protect CLS -- they do NOT shimmer/pulse
            - slow-network (>~600ms): the held breath is the only indicator
            - instant (<~120ms): show nothing; never flash a loader for a blink
```

```
reduced-motion   the Eye is STILL and dimmed (no breath loop, no scale). A simple
                 static "open eye, waiting" mark + the skeletal mats. Optional
                 polite aria-live "Loading" for SR users (silent visually).
perf             one SVG, transform/opacity only; already proven in AliveEye.
                 Pause/teardown when resolved so no orphan rAF/animation persists.
```

---

## 6 . Micro-interactions & scroll-choreography

### 6.1 The Notice -- hover/focus on chrome

```
trigger     pointer hover OR keyboard focus (PARITY -- same visual for both; see 06)
applies to  links, threshold-buttons, menu glyph, controls (NOT artworks -> Sec 6.2)
visual      rise notice-lift(2px) + opacity/underline draw; quiet, weighted
property    transform: translateY(-2px) + opacity (and the Draw, Sec 6.3)
token       --pb-dur-instant (120ms), ease-standard
meaning     "the world notices you" (experience/10 Sec 6 "The Eye notices") -- feedback
            is light/weight shifting, never a color-block button state (Sec 5 there)
reduced     opacity/underline only, no translate; instant
perf        instant + transform-only; trivially 60fps
```

### 6.2 The Lift -- touch the work

```
trigger     hover OR focus on an artwork/portrait (Plate)
visual      lifts work-lift(4px) + gentle work-zoom(1.01); shadow "softens" via an
            opacity crossfade of a pre-rendered softer shadow layer (NOT animated blur)
property    transform: translateY(-4px) scale(1.01) on the image; opacity on the
            shadow layer. Image overflow clipped by the mat so zoom stays framed.
token       --pb-dur-base (240ms), ease-standard
meaning     artworks are objects under museum light, not buttons (experience/10 Sec 4)
on commit   crossfade into the record via The Blink (Sec 4) -- shared-element morph of
            the thumbnail into the hero where View Transitions is available
reduced     no lift/zoom; a static focus ring + shadow swap (instant)
perf        scale on an <img>/<Image> is GPU-cheap; the mat clips so no repaint of
            siblings. Cap to one lifted work at a time.
```

### 6.3 The Draw -- links & thresholds

```
trigger     hover/focus on a link or threshold-button
visual      underline draws in from the leading edge (scaleX 0->1, origin-left) OR
            a quiet border warms toward oxblood (opacity of an oxblood border layer)
property    transform: scaleX (underline) + opacity (border warmth)
token       --pb-dur-instant (120ms), ease-standard
meaning     a "quiet threshold," not a CTA (experience/10 Sec 5)
reduced     underline simply present on hover/focus (opacity step), no draw
perf        scaleX on a 1px pseudo-element; transform-only
```

### 6.4 Sanctioned color motion (the only exception)

`HopeShift` tweens `backgroundColor`/`color` across the Hope passage (S5). This is
the **single** place large-surface color animates, because the warming IS the
meaning (pollution lifting -> dawn). It is scroll-linked (not a loop), is `static`
under reduce, and must not be copied to other surfaces. Any new "mood" shift must
instead crossfade two pre-painted layers (opacity), not tween color.

### 6.5 The Strata -- scroll-choreography for the four worlds

The cinematic surfaces (Home, Chapter, Passport, Artwork + Graph) use scroll-linked
choreography built on the `WasteToArt` template: a tall scene with a `sticky`
viewport, `useScroll` -> `useTransform` mapping progress onto `transform`/`opacity`.

```
principle   scroll-LINKED, never scroll-JACKED. The visitor always owns the
            scrollbar; we map their progress, we never seize it (experience/10 Sec 7;
            see 06 Sec "scroll ownership").
pattern     - sticky stage (h-100svh) inside a tall track (e.g. h-[240vh])
            - shards/strata/captions converge or resolve as progress 0->1
            - one idea per stage; generous empty scroll between stages (experience/10 Sec 8)
property    transform (x/y/scale/rotate) + opacity ONLY, all via useTransform
token       reveals use slow/cine + ease-threshold; ambient particles obey Sec 7 caps
meaning     descending through strata / a work resolving into being / a life
            unfolding -- movement as travel, not as reading a list (S2, S7)
reduced     each scene returns its STATIC composed result (the WasteToArt reduce
            branch is the reference): final image + caption, normal document scroll,
            no sticky track, no particles
perf        IntersectionObserver pauses off-viewport scenes (experience/03 grammar);
            particle count <= dust-max(60); downgrade/disable on save-data + low-power;
            never more than ONE active scroll-scene compositing at a time
```

---

## 7 . Living chrome -- ambient systems

"Alive, not animated" (00-README Sec "Canonical vocabulary"). These make the world
breathe at the edges. All are **cheap, GPU-only, meaning-bearing, and opt-out under
reduce / save-data / low-power**. None ever block reading or capture the pointer
(`pointer-events:none`, `aria-hidden`).

### 7.1 Dust / particles (reference: HopeShift `Dust`)

```
trigger     ambient on cinematic surfaces (and the Hope passage today)
visual      sparse motes drift (translateY upward) and fade in/out
property    transform: translateY + opacity
token       count <= dust-max(60); opacity <= dust-opacity(0.18); paused off-viewport
meaning     air, time, regeneration -- the room has atmosphere
reduced     NOT mounted (no particles) -- exactly as HopeShift does under reduce
perf        each mote is a 1px span on a single GPU layer; no per-frame layout
```

### 7.2 Light (ambient luminance drift)

```
trigger     ambient on hero/threshold surfaces
visual      a soft radial light layer drifts slowly (translate within a small range)
            and breathes its opacity in sync with The Breath rhythm
property    transform: translate (<= parallax-max 16px) + opacity. NO filter, NO
            radius animation (the radial gradient is static; only the LAYER moves)
token       breath rhythm (--pb-dur-breath); opacity <= ~0.10
meaning     museum light shifting; the Eye's "wet with faint light" (S1) at room scale
reduced     static light layer (no drift, no breath)
perf        one positioned gradient div on a GPU layer; transform/opacity only
```

### 7.3 Atmosphere / parallax depth

```
trigger     scroll, on layered cinematic compositions
visual      background layers translate slightly slower than foreground (depth)
property    transform: translateY only, mapped from scroll via useTransform
token       displacement HARD-CAPPED at parallax-max (16px); ease-standard feel
meaning     spatial depth -- a place with foreground/background, not a flat page
reduced     no parallax (layers static); scroll-linked only, never jacked
perf        transform-only; <= 2-3 layers; IntersectionObserver gated
```

### 7.4 Day/night tone

```
trigger     time-of-day (visitor local clock) -- a SUBTLE, optional tone shift
visual      crossfade between two pre-painted chrome tone overlays (warm day /
            cool dusk); NEVER a hue tween of live surfaces (Sec 6.4 rule)
property    opacity (crossfade of overlay layers) ONLY
token       slow (480ms) on the rare transition; otherwise static for the session
meaning     the world keeps its own time alongside the visitor -- alive, aware
reduced     respects the chosen tone but no crossfade animation (instant)
constraints must NOT break AA contrast on text ([08-accessibility-review]) and must
            NOT fight artwork color (00-README: "artworks supply the color").
            Treat as the lowest-priority ambient; ship last, behind a flag.
```

---

## 8 . When motion is FORBIDDEN (the rule)

Motion must be *withheld* -- not just reduced -- in these cases. Silence and stillness
are interactions too (experience/10 Sec 8).

```
1. prefers-reduced-motion: reduce
      -> loops off, scroll-scenes static, transitions become cuts, ambient systems
         NOT mounted. The arc still reads (00-README non-negotiable #2).
2. The visitor is READING / typing
      -> no motion may run over body copy or an active input/textarea. Reveal fires
         ONCE on enter, then never again. No loop touches a text column.
3. The artwork/record is the subject
      -> chrome holds still so the work is the only thing that can move
         (00-README #5: "Chrome recedes"). No ambient particle crosses an artwork.
4. Performance is at risk
      -> save-data, low-power, low-end (device-memory/hardwareConcurrency), or a
         dropped-frame budget breach -> downgrade then disable ambient + scroll-scenes.
         60fps is a gate, not a target (00-README #1).
5. It carries no meaning
      -> if a movement can't be traced to a meaning in this doc or experience/03,
         it is cut. "Earn it or kill it." No decoration, ever.
6. It would steal control
      -> no autoplay, no scrolljack, no forced sequence, no motion that traps focus
         or moves the viewport without the visitor's input (experience/10 Sec 7).
7. Critical feedback / errors
      -> errors and confirmations are stated plainly and immediately; we never make
         someone wait through a flourish to learn what happened (the Eye may frame
         an empty/error state, but the MESSAGE is instant -- see 06 Sec error states).
```

---

## Open questions for approval

1. **View Transitions API scope.** Adopt the native API for same-origin App Router
   navs with the framer `AnimatePresence` fallback (this doc's recommendation), or
   ship framer-only for one source of truth until browser support is broader?
2. **Shared-element morph candidates.** Confirm the sanctioned pairs (thumbnail->hero
   on Artwork; portrait->hero on Passport; header Eye persistent across all). Any
   others, or keep the morph list deliberately tiny?
3. **`--pb-dur-blink` value.** Is 320ms total (160 close / 160 open) the right
   "blink," or should the four cinematic worlds use a longer cine-weighted close
   (e.g. 480ms) for gravitas while utility pages stay at 320?
4. **Promote `ease-threshold` to a token?** It is currently a copy-pasted literal
   `cubic-bezier(.22,.61,.36,1)` in AliveEye + experience/03. Approve adding it to
   motion.json/tokens.css as `--pb-ease-threshold`.
5. **Day/night tone -- ship or shelve?** It is the most decorative ambient and risks
   fighting artwork color + AA contrast. Approve as flagged/last, or cut from Phase 3?
6. **Held-breath thresholds.** Confirm timings: show nothing under ~120ms, held
   breath only after ~600ms? And confirm "no percentage/no bar" even for long uploads
   in admin (or do admin tools get a plain determinate bar, off the public poetry)?
