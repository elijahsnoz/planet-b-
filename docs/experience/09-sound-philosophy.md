# 09 · Sound Philosophy

Sound is an **invitation, never an ambush.** Silence is the default and is respected. When chosen, sound deepens presence — wind, distant birds, the faint life of a workshop — and never becomes a soundtrack that performs at you.

## Principles
1. **Never autoplay with sound.** The world begins in silence. A single, quiet glyph offers atmosphere; the visitor opts in. (Browsers require this anyway — we make it a feature, not a workaround.)
2. **Atmosphere, not music.** No scored track, no stings, no UI "clicks/boops." Sound is *environment*: a low wind bed, sparse birds, the distant hum/clink of the upcycling workshop, the rare tick of the damaged watch at the Reflection beat.
3. **Diegetic & tied to place.** Sound belongs to *where you are*: the Threshold breathes wind; the Workshop phase carries faint making-sounds; the Performance carries room tone. It maps to the passage, not to a global loop.
4. **Always escapable, always remembered.** One persistent, unobtrusive mute/unmute. The choice persists across the visit (and return). Muting is instant and total.
5. **Quiet by craft.** Levels sit just above the threshold of notice (think −24 to −30 LUFS feel). If a visitor has to think "is something playing?", it's too loud.

## The control
```
◔  (resting, muted)        ◉))  (atmosphere on)
- single glyph near the Eye; tooltip: "atmosphere"
- one tap toggles; no volume slider in v1 (atmosphere is pre-balanced)
- announces state to screen readers ("atmosphere on/off")
```

## Mapping (sound follows the journey)
| Passage | Bed | Accents |
|---|---|---|
| Threshold / Arrival | low wind, deep room tone | a single distant bird |
| Wonder (waste→art) | air, faint material rustle | soft settle as fragments lock |
| Silence | near-true silence | — (respect it) |
| Reflection | held air | the watch ticks once |
| Hope | wind warms, more birds | a breath of openness |
| Workshop (Genesis) | distant workshop ambience | faint tools, voices (unintelligible) |
| Performance (Òdàlè Dà'lẹ̀) | room tone | sparse, reverent |

## Craft & guardrails
- Web Audio with a single mixed ambient bed per passage; crossfade on passage change; **suspend when tab hidden / off-viewport / muted** (no wasted CPU or battery).
- Assets tiny and looped seamlessly; lazy-loaded only after opt-in (zero audio bytes for the silent default).
- Respect OS "reduce/silence" and `prefers-reduced-motion` users who often want calm — default stays muted regardless.
- Sourcing honors provenance/licensing (field recordings credited like any media asset; workshop sound only with consent).
- **Accessibility:** sound is never required to understand anything; all meaning exists visually/textually. The watch "tick" has a visual equivalent (the hand jump).
