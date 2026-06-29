# 06 . Interaction Principles

**Purpose.** Define how it *feels* to touch Planet B -- the physical grammar of
pointer, keyboard, and touch; the deceleration that makes visitors slow down;
hover-revealed relationships across the knowledge graph; focus order as a guided
path; scroll the visitor always owns; the opt-in, silence-by-default sound
architecture; mobile gestures; and error/empty/loading states rendered through the
Eye. Each is tied to the emotional arc (Curiosity -> Wonder -> Reflection ->
Responsibility -> Hope -> Action). DESIGN ONLY -- nothing ships until approved.

**Extends.** [docs/experience/10-interaction-principles.md](../experience/10-interaction-principles.md)
(the ten principles, the microinteraction palette, the page-to-page transition
intent, "the standard we hold every interaction to"). It binds tightly to
[03-motion-language.md](03-motion-language.md) (which owns the *motion* of every
interaction named here) and to [00-README.md](00-README.md) Sec "Non-negotiables" /
Sec "Canonical vocabulary". It references real components:
[AliveEye](../../components/experience/AliveEye.tsx),
[Reveal](../../components/Reveal.tsx), `Plate`/`ExhibitLayout`/`RegistryGrid`
(00-README Sec "Ground truth"), and the focus-ring + reduced-motion rules in
[tokens/tokens.css](../../tokens/tokens.css).

---

## 0 . The feeling we are designing

> Handling an object in a museum, not clicking a UI (experience/10 opening line).

Every rule below answers one test (experience/10 Sec "the standard"): *Would a museum
be proud? Would Apple ship it? Would a child remember it?* If no -- redesign it.

```
Curiosity  -> the world notices you (The Notice) and invites a closer look
Wonder     -> works lift to your attention (The Lift); scenes resolve as you move
Reflection -> the pace slows; silence and stillness hold; the Watch ticks once
Responsibility -> the Eye meets you; relationships surface; you see the web you're in
Hope       -> the chrome warms; ambient light breathes; the path opens forward
Action     -> a quiet threshold, not a CTA; a calm commit, never a hard sell
```

---

## 1 . Input parity -- pointer . keyboard . touch

One interaction, three doors. No path is second-class (experience/10 Sec 10 "Inclusive
by construction"; 00-README #3).

```
              POINTER (fine)         KEYBOARD                 TOUCH (coarse)
attention     hover                  focus (Tab/arrows)       (no hover) -> tap reveals
the Notice    2px lift + draw        SAME 2px lift + draw     focus-visible on tap-hold
              (03 Sec 6.1)              on :focus-visible        not relied upon
the Lift      hover lift+zoom        focus lift+zoom          first tap = lift/preview,
(artwork)     (03 Sec 6.2)              (identical)              second = commit (no hover trap)
relationships hover a node ->        focus a node ->          tap a node -> reveal panel
(graph)       dwell-reveal edges     SAME reveal on focus     (explicit, not dwell)
the Eye       pupil drifts to        pupil rests (no pointer  pupil rests; breath only
              pointer (AliveEye)     to track) -- still alive  (AliveEye gates on pointer:fine)
commit        click                  Enter/Space              tap
```

Hard parity rules:
- **Anything hover reveals, focus reveals identically.** No information lives behind
  hover alone (fails keyboard + touch). AliveEye already gates pointer-tracking on
  `(pointer: fine)` and `prefers-reduced-motion` -- relationships/captions must do the same.
- **No hover trap.** Touch never depends on a state it cannot reach; dwell-reveals
  (graph edges, captions) have an explicit tap equivalent.
- **Targets >= 44px**, visible focus ring everywhere (`:focus-visible` ring in
  tokens.css), one focus style for mouse and keyboard users alike.

---

## 2 . The deceleration principle -- visitors slow down

The single behavioral goal: a visitor arrives in scroll-reflex and *decelerates*
into attention. We design friction-of-calm, never friction-of-frustration.

```
- Weighted, eased responses (slow/base, ease-standard) -- nothing snaps or bounces.
- Generous empty space and pauses BETWEEN beats (experience/10 Sec 8) -- silence is an
  interaction; emptiness lets feeling land. The "Silence" beat on Home is literal.
- One idea per moment (experience/10 Sec 8; 03 Sec 6.5 "one idea per stage").
- Reveal fires ONCE on enter, then rests (Reveal.tsx, viewport once) -- content does
  not re-animate as you scroll back, so nothing nags.
- The Breath sets the tempo: a 6s heartbeat is the metronome the whole world keeps.
arc: deceleration is what turns Curiosity into Wonder, and Wonder into Reflection.
```

We measure success not in time-on-page but in *unhurriedness*: scroll velocity
trending down through a cinematic surface is the signal we're succeeding.

---

## 3 . Hover-reveal of relationships (the graph)

The knowledge graph is invisible today -- edges exist in data but render as bulleted
links (00-README Sec "the gap"). We make connections *gently revealed*, never exposed
all at once (experience/10 Sec 3 "Reveal, don't expose"). Detailed surface design lives
in [14-graph-discovery.md]; here is the interaction law.

```
resting     a record shows itself; related works/people/chapters are LATENT
            (a quiet count or faint marks), not a wall of links
attention   hover/focus/tap a record or a node -> its relationships surface:
            connected nodes gain presence (opacity), edges draw in (03 Sec 6.3 Draw),
            unrelated nodes recede (opacity down) -- focus is given by SUBTRACTION
commit      activate a related node -> The Blink (03 Sec 4), shared-element morph
            where available, into that record
meaning     "you are inside a web, not at a dead end" -- this is the Responsibility
            beat made tangible: every person/work is connected to others
parity      hover-dwell (pointer) == focus (keyboard) == tap (touch); see Sec 1
reduced     no draw/recede animation; relationships appear as a plain, present,
            keyboard-navigable list (graph degrades to a clean related-list, never
            broken). save-data/low-power -> same static list.
perf        animate opacity of nodes + scaleX of edges only; cap visible nodes;
            never animate graph layout positions on hover (no reflow).
```

---

## 4 . Focus order as a guided path

Tab order is not an accessibility checkbox -- it is a *curated walk* through the
space, the keyboard visitor's version of the cinematic scroll.

```
- DOM order == reading order == emotional order. The arc's beats are the focus
  sequence: a keyboard visitor Tabs through Threshold -> work -> reflection ->
  relationships -> action, in the same order the scroll reveals them.
- Landmarks first: skip-link -> header/Eye -> main -> the beats -> footer. Semantic
  <header>/<main>/<nav>/<footer> so SR users can jump (experience/10 Sec 10).
- Visible focus is part of the choreography: the same lift/zoom a pointer triggers
  (The Lift / The Notice) fires on focus, so the keyboard walk is as alive as the
  mouse one (Sec 1 parity).
- No focus traps, ever (experience/10 Sec 7). Menus/overlays return focus to origin on
  close; the cinematic path is escapable at any point.
- The Held Breath (03 Sec 5) announces loading politely (aria-live) so the path never
  leaves a keyboard/SR visitor wondering if the world stalled.
arc: a guided focus path means the keyboard visitor experiences the SAME arc, in
order, never a scrambled tab-jump.
```

---

## 5 . Scroll ownership -- linked, never jacked

```
LAW   the visitor owns the scrollbar, always (experience/10 Sec 7 "Control is never
      taken"; 00-README Sec "the gap" wants connections gently revealed, not forced).
DO    scroll-LINKED choreography: map the visitor's own scroll progress onto
      transform/opacity (useScroll -> useTransform), exactly as WasteToArt/HopeShift.
      They scroll; the world responds in proportion. They can always go faster,
      slower, or leave.
DON'T scroll-JACK: no hijacked wheel, no snap that fights the visitor, no forced
      pauses, no "you must watch this before continuing," no scroll that moves the
      viewport for them.
escape  every cinematic surface is fully usable by scrolling straight past it; there
        is always a direct route to the record (experience/10 Sec 7).
reduced  scroll-scenes return their static composed result (03 Sec 6.5); document scroll
         is normal; scroll-behavior forced to auto (tokens.css reduced-motion block).
arc: ownership is what makes Wonder feel like discovery rather than a ride.
```

---

## 6 . Sound architecture -- opt-in, silence by default

**No autoplay sound, ever** (00-README #4; experience/10 Sec 7 "no surprise audio").
Silence is the default and a design tool. Sound is a single, quiet invitation.

```
DEFAULT      silence. Nothing plays on load, ever. The sound glyph rests muted/faint
             (experience/10 microinteraction palette: "Sound glyph | muted, faint").

THE TOGGLE   ONE ambient control (the sound glyph in the header). Off by default.
             - off -> faint, latent
             - hover/focus -> faint pulse (The Notice)
             - on -> atmosphere fades IN (opacity/volume ramp, never a hard cut)
             - it is a real, labeled, keyboard-operable button (aria-pressed),
               >=44px, with visible focus -- not a decorative glyph
             - a global MUTE is always one action away; muting is instant & total

PER-SURFACE  when sound is ON, each world carries its own ambience (the four worlds,
 AMBIENCE     00-README Sec "Canonical vocabulary"), crossfaded as the visitor moves:
             - Home / Threshold ...... wind (open air, arrival)
             - Chapter ............... nature / place (documentary-of-a-place)
             - Passport (a life) ..... gallery hush (museum archive)
             - Artwork ............... gallery room tone (the wall)
             - the workshop ambience . workshop (making / waste-becomes-art moments)
             crossfade between surfaces on The Blink (03 Sec 4) -- never a jarring switch.
             Volume is low, looped, seamless; ambience is a ROOM, not a soundtrack.

EVENT SOUND  optional, tiny, meaning-bearing only (e.g. the Watch's faint tick at the
             Reflection beat, experience/03 S4). Never UI click-blips. Subject to the
             same on/off + mute. Default off with the rest.

PERSISTENCE  the on/off + volume preference persists (localStorage; survives nav and
             return visits). The world remembers your choice; it never re-asks or
             re-enables itself.

RESPECTS     - prefers-reduced-motion -> still silent by default; if a visitor opts
               IN, ambience may play (it is not motion), but event sounds tied to
               motion (the tick) stay OFF under reduce.
             - a system/page mute and the global toggle both fully silence.
             - tab blur / page hidden -> fade out (no background audio bleed).
             - respects any OS "reduce/disable" and honors first-run silence.
arc: sound deepens Reflection and Hope for those who choose it, and costs nothing --
     in attention or access -- to those who don't.
```

---

## 7 . Gestures on mobile (touch)

```
PRIMARY      vertical scroll owns the experience (Sec 5). Cinematic surfaces are built
             to be SCROLLED on touch, not swiped through a forced carousel.
TAP          first tap on a work = The Lift / preview (reveal caption + relationships,
             Sec 1); second tap (or an explicit "open") = commit. No hover dependency.
PINCH-ZOOM   on Artwork, native pinch-to-zoom on the high-res image is allowed and
             encouraged (examine the work) -- we do NOT disable user-scalable; we never
             trap the gesture.
HORIZONTAL   used sparingly and only where it maps to meaning (e.g. stepping through a
             chapter's plates); always with visible affordance + a scroll/keyboard
             equivalent. Never the ONLY way to reach content.
NO           no long-press hijack of system menus, no swipe-to-dismiss that fights the
             OS back gesture, no custom gesture a visitor must "learn," no edge-swipe
             traps. Generous 44px targets; thumb-reachable controls.
reduced/save no parallax/particles (03 Sec 7); transitions become cuts (03 Sec 4); the
             experience stays whole on a low-end phone (00-README #6 "performance is
             experience").
arc: the phone visitor gets the same arc through scroll + tap, with nothing gated
     behind a gesture they can't discover.
```

---

## 8 . Error . empty . loading -- rendered through the Eye

The Eye is the institution's face for every "in-between" state (00-README
Sec "Canonical vocabulary": the Eye is also loading + institutional symbol). These are
not edge cases -- they are moments the visitor is most likely to feel abandoned, so
they get the most care.

```
LOADING / PENDING  The Held Breath (03 Sec 5): the Eye breathes slower & dimmer; skeletal
                   Plate mats hold layout (protect CLS); no spinner, no percentage.
                   <120ms -> show nothing; >~600ms -> the held breath; resolve hands
                   off into The Blink/Reveal. Polite aria-live "Loading" for SR.
                   feeling: you wait WITH a living thing, not for a machine.

EMPTY              not a void and not a cute mascot. A still, open Eye, quiet copy
                   that respects the visitor ("Nothing here yet" / "This part of the
                   archive is still being written" -- never fabricated content,
                   00-README #7), and ONE clear way onward (back to a populated path).
                   The Eye present = the world is still with you, just quiet here.

ERROR             the MESSAGE is instant and plain (03 Sec 8 rule 7 -- never make someone
                   wait through a flourish to learn what broke). The Eye frames it
                   (the institutional face, steady), states what happened in human
                   language (no codes/stack traces to the public), and offers a calm
                   recovery (retry / go home / contact). Tone: dignified, never
                   jokey, never blaming the visitor.

404 / NOT FOUND   "this passage doesn't exist" framed by the Eye, with a route back
                   into the archive. A crossing that leads nowhere, gracefully.

OFFLINE / SLOW    the Held Breath plus an honest, quiet line; never a fake-progress
                   bar. save-data/low-power already strips ambient (03 Sec 7), so these
                   states stay light.

reduced-motion    the Eye is STILL (no breath loop) in all of the above; copy +
                   skeletal mats carry the state. Messages remain instant.
arc: handled with grace, even a dead end keeps Responsibility/Hope intact -- the
     visitor is never dropped out of the world into "an app that broke."
```

---

## Open questions for approval

1. **Sound glyph placement & first-run.** Header (always visible) is proposed. Do we
   show any *one-time* hint that ambience exists (a single faint pulse on first
   visit), or stay fully silent/latent and let the curious discover it?
2. **Per-surface ambience sourcing.** Wind / nature / workshop / gallery loops must be
   licensed or original (00-README #7 "no invented content" governs media too).
   Confirm the founder sources/approves the actual audio before this ships.
3. **Event sounds beyond the Watch tick.** Keep event audio to the single canonical
   tick, or sanction a tiny set (e.g. a soft tone on "verify" success)? Default-off
   either way.
4. **Touch preview gesture.** Is the two-tap (lift -> commit) model right, or do we
   prefer single-tap-to-open with the caption/relationships shown inline on the
   record itself? (Affects graph reveal on mobile, Sec 3.)
5. **Reduced-motion + sound.** Confirm the stance: opting INTO ambience is allowed
   under `prefers-reduced-motion` (sound isn't motion), but motion-tied event sounds
   (the tick) stay off. Approve or make reduce -> fully silent.
6. **Persistence mechanism.** localStorage for the sound preference is proposed (no
   account needed). Acceptable, or should it ride a future visitor-preference store
   alongside reduced-motion overrides?
7. **Error copy ownership.** Who writes the human-voiced error/empty/404 strings so
   they match the institution's tone (and never fabricate)? Proposed: founder/editorial
   approves a small string set referenced here.
