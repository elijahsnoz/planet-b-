# 10 · Interaction Principles

How Planet B *responds* to a human. Every interaction is calm, meaningful, and respectful — closer to handling an object in a museum than clicking a UI.

## The ten principles

1. **Every interaction has meaning.** No motion, sound, or feedback exists for its own sake. If it doesn't deepen understanding or feeling, it's removed. (The recurring test: would a museum be proud? would a child remember?)

2. **Calm by default.** Slow, weighted, eased responses. Nothing snaps, bounces, flashes, or competes for attention. The world is unhurried; it invites slow reading and lingering.

3. **Reveal, don't expose.** Interface appears when intended (nav after the Threshold, captions on approach, related works on dwell). Reduce what's on screen to what the moment needs.

4. **Touch the work, gently.** Artworks respond to attention: a soft lift/zoom on focus, a frame that breathes, never a harsh hover state. Images are objects under museum light, not buttons.

5. **Feedback is physical, not chrome.** Hovers/taps feel like light and weight shifting (subtle scale, shadow, parallax of the matting), not color-blocky button states. Buttons are quiet thresholds, not "CTAs."

6. **The Eye notices.** Idle attention is acknowledged — the Eye's pupil drifts toward movement, content breathes — so the world feels aware of the visitor without demanding action.

7. **Control is never taken.** No scrolljacking, no forced sequences, no modal traps, no surprise audio. The visitor can always move faster, leave the cinematic path, or go straight to a record.

8. **Respect the threshold of attention.** One idea at a time; generous whitespace and pauses between beats. Silence and emptiness are interactions too — they let feeling land.

9. **Dignity for people and works.** Profiles and artworks are presented as museum subjects: consent-gated, credited, never reduced to cards or "content." Interactions honor the people behind the pixels.

10. **Inclusive by construction.** Everything is keyboard-operable with visible focus; targets ≥44px; full `prefers-reduced-motion` / `save-data` / no-JS paths; AA+ contrast; alt text and transcripts everywhere. The poetry never costs anyone access.

## Microinteraction palette (calm, consistent)
| Element | Resting | On attention (hover/focus) | On commit |
|---|---|---|---|
| Artwork/portrait | still in matting | lifts 2–4px, shadow softens, gentle 1.01 zoom | crossfade into the record |
| Link / threshold-button | underline latent / quiet border | underline draws in / border warms to oxblood | quiet fade transition |
| The Eye | breathing | pupil drifts toward motion | opens / returns home |
| Menu | hidden | glyph warms | world dims, map of passages rises |
| Sound glyph | muted, faint | faint pulse | atmosphere fades in |

## Page-to-page transitions
Transitions between passages feel like *moving through a space*, not loading a page: a brief cross-dissolve through near-black (a blink), the next passage rising into light. Built as view transitions / route transitions, always with an instant fallback. Never a spinner — loading is the Eye holding its breath ([06](06-eye-symbol-studies.md)).

## The standard we hold every interaction to
> Would this make someone stop scrolling? Would a museum be proud? Would Apple ship it? Would a child remember it? Would a historian preserve it?

If any answer is no — redesign it.
