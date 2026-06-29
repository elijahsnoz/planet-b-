# Phase 3 - 08 - Accessibility Review (Public Experience)

> Status: DESIGN - awaiting approval. This is an assessment + targets, not code.
> No remediation ships until the founder approves.

## Purpose

A WCAG 2.2 AA audit of the PUBLIC experience of Planet B - the cinematic home
and the Phase-2 domain pages - so that "accessibility is part of beauty"
(00-README non-negotiable #3) is enforceable, not aspirational. The museum's
quiet stone-on-paper chrome is intentional, but quiet must never mean
illegible. This document names exactly where the current build risks failing,
maps each finding to a Success Criterion, and gives a fix direction - never
code.

## Extends

- docs/phase-3/00-README.md (non-negotiables #2 reduced-motion, #3 WCAG 2.2 AA,
  #4 no autoplay sound)
- docs/00-PRINCIPLES.md (the constitution overrides this doc)
- tokens/tokens.css and app/globals.css (palette, reduced-motion override,
  focus-visible rings, the .pb-admin contrast note at globals.css lines 55-75)
- app/(public)/layout.tsx (skip link + the single intended `main` landmark)
- It introduces no new SC; it audits the existing surface against WCAG 2.2 AA.

---

## 1. What is already right (verify, then hold)

These are strengths the audit confirms - the bar to protect, not to rebuild.

- Reduced-motion is genuinely first-class. tokens/tokens.css lines 76-91 and
  app/globals.css lines 121-129 collapse every duration to ~0 and disable
  smooth scroll globally; every motion component branches on
  `useReducedMotion()` and renders a still, captioned fallback:
  WasteToArt.tsx lines 41-52, HopeShift.tsx lines 18-20, AliveEye.tsx lines
  34-41, TickingWatch.tsx line 14, Reveal.tsx lines 24-28. This satisfies
  2.3.3 (Animation from Interactions) and is the model the new scroll scenes
  and page transitions must follow exactly.
- No autoplay sound exists today. The only media element,
  components/experience/VideoPlayer.tsx, is `controls preload="none"`,
  poster-first, sound never autoplays - satisfying 1.4.2 (Audio Control).
- A skip link exists: app/(public)/layout.tsx lines 7-12 (`#main`), and it is
  the first focusable element. Focus-visible rings are defined globally
  (globals.css lines 97-101, tokens.css lines 93-96): 2px oxblood, 2px offset
  - satisfies 2.4.7 (Focus Visible).
- Decorative imagery is correctly hidden: the WasteToArt shards, HopeShift dust,
  Threshold gradient, and the chapter cover wash all carry `aria-hidden` /
  `alt=""` (WasteToArt.tsx line 25, HopeShift.tsx line 24, Threshold.tsx lines
  16/38, app/(public)/chapters/abuja-2026/page.tsx line 41) - satisfies 1.1.1
  for decorative content.
- The Eye carries an accessible name (`role="img"`, `aria-label`, `<title>`):
  AliveEye.tsx lines 74-83.

---

## 2. Findings (prioritized)

Severity: P0 blocks an AA claim and a real user; P1 is an AA failure with a
narrower blast radius; P2 is AA-adjacent or 2.2-specific polish.

| # | Issue | Where (real path) | WCAG 2.2 SC | Sev | Fix direction (no code) |
|---|-------|-------------------|-------------|-----|-------------------------|
| 1 | `--pb-text-muted` = `stone #9B978E` on paper is **2.63:1** - fails the 4.5:1 body/caption minimum. This is the dominant secondary-text color: captions, meta, footer copy, eyebrows, "Image to be added". | tokens.css L12/L20; globals.css L16/L22; used pervasively (Plate.tsx L39, SiteFooter.tsx L34/41/55, ExhibitLayout.tsx L49/52, page.tsx captions) | 1.4.3 Contrast (Minimum) | P0 | Darken the semantic `--pb-text-muted` to >= 4.5:1 on paper (clay `#7A5C3E` already measures 5.53:1; or a dedicated muted-ink near `#5E5A52`). Keep raw `--pb-stone` as a decorative-only token for borders/dividers, never text. One token change, museum-quiet preserved. |
| 2 | "verified" text/badge uses `signal #2FA36B` on paper = **2.88:1**; the verify/provenance "checkmark" text fails. | verify/page.tsx (tone strings, hashes); artworks/[slug] L97 `text-verified`; tokens `--pb-verified` | 1.4.3; 1.4.11 Non-text Contrast (the dot/check as UI) | P0 | Reserve `signal` green as a fill/icon accent, never as small text on paper. Pair the check glyph with a text label in `--pb-text` and a darker green for any text use (>= 4.5:1). Do not rely on color alone to convey "verified" (also 1.4.1). |
| 3 | On the dark "ink" threshold surface, accent `#9B2B2B` = **2.6:1** on ink - links/CTA text and the Eye stroke in `text-accent` fail both 4.5:1 (text) and 3:1 (UI). | tokens.css L71 `[data-theme=ink]`; Threshold.tsx L23, page.tsx L92 AliveEye `text-accent`, Silence/Invitation sections | 1.4.3; 1.4.11 | P0 | Brighten the ink-scoped `--pb-accent` until interactive text/icon hits >= 4.5:1 on `#0B0B0C` (around `#C24A45`+). The Eye is a graphic object (3:1) but accent *links* on ink are text (4.5:1). Re-measure every ink section. |
| 4 | Duplicate `main` landmark + duplicate `id="main"`. layout.tsx already wraps children in `<main id="main">`, yet several pages render their own `<main id="main">` inside it - nested `main`, ambiguous skip-link target. | layout.tsx L15 vs verify/page.tsx L107, chapters/page.tsx, stories/page.tsx, stories/[slug]/page.tsx, passport/[id]/page.tsx | 1.3.1 Info & Relationships; 4.1.2 Name/Role/Value; 2.4.1 Bypass Blocks | P0 | One `main` per document. Pages should render a `section`/`div` wrapper, not a second `main`/`#main`. Decide a single owner of the landmark (the layout) and strip it from page bodies. |
| 5 | Heading order is not guaranteed to be hierarchical. Cinematic home stacks multiple `h2` with no `h1` after the Threshold's `h1`; SiteFooter uses `h2` for "Archive"/"Institution" column labels (visually small), competing with content `h2`s. Several record sections jump h1 -> h3 (ExhibitLayout h1, then Section h3) skipping h2. | page.tsx (h2 x4), SiteFooter.tsx L41, ExhibitLayout.tsx L51 + artists/[slug] Section h3 (L18), artworks/[slug] h3 (L85) | 1.3.1; 2.4.6 Headings & Labels | P1 | Define one outline per page. Footer column labels should be a non-heading or visually-hidden-leveled. Record pages: ensure h1 -> h2 -> h3 with no skips (the `Section` helper should emit h2). Document the canonical outline per "world". |
| 6 | The planned ambient SOUND is unbuilt - and must arrive opt-in + controllable. Canon forbids autoplay (#4); the spec must also guarantee a persistent, keyboard-reachable mute/volume control and a remembered preference. | Not yet in repo; specified in motion/interaction docs (3, 6) | 1.4.2 Audio Control; 2.1.1 Keyboard; 1.4.1 | P1 | State the contract now: sound defaults OFF; a labelled toggle (accessible name "Sound", state announced) lives in persistent chrome; honor `prefers-reduced-motion` as a soft signal to also default ambience off; never gate meaning behind audio. |
| 7 | Target size. Header nav links are `text-sm` with only `gap-5`, no padding - tap targets likely < 24x24 CSS px; footer link rows (`space-y-2` text-sm) and inline registry links similar. | SiteHeader.tsx L52-59; SiteFooter.tsx L42-48; record link-lists | 2.5.8 Target Size (Minimum) - new in 2.2 | P1 | Ensure each interactive target is >= 24x24px (padding or min-height), or has 24px clear spacing. Easiest: give nav/footer links block padding. Verify on mobile, not just desktop. |
| 8 | Focus order vs the reveal-on-scroll header. On home the header is `opacity-0 pointer-events-none -translate-y-2` until scroll (SiteHeader.tsx L42). Good that it is pointer-disabled, but confirm its links are also removed from tab order while hidden, else keyboard focus lands on invisible nav. | SiteHeader.tsx L40-45 | 2.4.3 Focus Order; 2.4.11 Focus Not Obscured (new in 2.2) | P1 | While withheld, the nav must be unfocusable (e.g. `inert`/hidden), not merely transparent. Also verify the sticky/fixed header never obscures a focused element below it (2.4.11). |
| 9 | Color-only status signaling. Verify outcomes are conveyed largely by tone class (`text-accent` etc.); provenance "verified" by a green check; nav active state (if any) by color. | verify/page.tsx PRESENTATION map; artworks/[slug] L97 | 1.4.1 Use of Color | P1 | Each status must carry a text label or icon+text, not hue alone (the verify page already prints a label - keep that pattern everywhere, including the green check). |
| 10 | Screen-reader narrative order on the cinematic pages. The visual arc (Threshold -> WasteToArt -> Silence -> Reflection -> Hope -> Responsibility -> Founders -> Invitation) reads in DOM order today (good), but decorative scroll layers and sticky stages can interleave; the "Silence" section is a bare image with no text anchor, and "descend" is aria-hidden. Confirm the linearized SR reading is a coherent quiet sequence. | page.tsx L28-145; WasteToArt sticky stage L54-76 | 1.3.2 Meaningful Sequence; 2.4.10 Section Headings | P2 | Keep DOM order == visual order (it currently is). Give each beat a programmatic name (visually-hidden heading where the visual design omits one, e.g. "Silence"). Verify with a screen reader that no aria-hidden layer swallows real content. |
| 11 | Alt-text quality on hero art. Alts are auto-built as "Title by Artist" (good), but the `Plate` empty state renders the literal phrase "Image to be added" as visible muted text that also fails contrast (see #1) and is not ideal SR copy. | Plate.tsx L38-40; usages in page.tsx, ExhibitLayout | 1.1.1 Non-text Content | P2 | Keep descriptive alts. For the placeholder, treat the tile as decorative-empty (or give it an honest accessible name like "Image pending") and fix its contrast under #1. |
| 12 | Motion / seizure safety. No flashing exists; the Breath (6s, 1.0->1.03) and single watch-tick are gentle and well under 3 flashes/sec. The HopeShift full-viewport background color sweep (#0b0b0c -> paper) is large-area motion driven by scroll. | HopeShift.tsx L15-31; globals.css pb-breath L105-112 | 2.3.1 Three Flashes; 2.3.3 Animation from Interactions | P2 | No change to Breath/tick. Confirm the HopeShift sweep is smooth (no stutter that could read as flash) and that its reduced-motion fallback (static paper, L18-20) is the path for sensitive users - it is. Hold the rule: no new effect may flash > 3x/sec or cover large area abruptly. |
| 13 | Forms. The single public form (verify) is good: the input has `aria-label`, the button has a text label (verify/page.tsx L116-125). But there is no visible `<label>`, no error/empty-query messaging, and focus styling relies on border color change only. | verify/page.tsx L116-125 | 3.3.2 Labels or Instructions; 1.4.3 (border-color focus); 4.1.3 Status Messages | P2 | Prefer a visible or visually-hidden `<label>` over aria-label. On empty/no-result, announce via a polite live region (4.1.3, new emphasis in 2.2 era). Ensure focus uses the global ring, not just `focus:border-accent`. CLAIM to verify: this is the only public form. |

---

## 3. Cross-cutting notes

- The "quiet contrast is intentional" stance (globals.css L55-60, written for the
  admin panel) is the right instinct, but it currently leaks into the PUBLIC
  site through the shared `--pb-text-muted` = stone token. Finding #1 fixes the
  root: split decorative-stone from text-muted at the token layer, so the
  public site stays quiet AND legible without per-component overrides.
- Token duplication (tokens.css mirrored in globals.css, noted in 00-README) is
  an a11y risk multiplier: a contrast fix must be applied in BOTH files or it
  silently half-lands. Treat the muted-text remediation as a paired edit.
- Reduced-motion is the safe path for nearly every risk above (motion, the
  future sound ambience, the HopeShift sweep). It is already honored; the new
  scroll scenes and page transitions in blueprints 10-14 must not regress it.

## The standard Planet B must hold

1. WCAG 2.2 AA on every public surface - 4.5:1 for body/caption text, 3:1 for
   large text and UI/graphics, on BOTH the paper and the ink surfaces.
2. Quiet is a contrast budget, not an excuse: secondary text is muted by being
   smaller and calmer, never by dropping below 4.5:1.
3. Keyboard-complete, single `main`, hierarchical headings, visible focus,
   targets >= 24px.
4. Motion and sound are opt-out-able and opt-in respectively; reduced-motion is
   a designed path, never a degraded one.
5. Meaning is never carried by color or audio alone.
6. The cinematic DOM order equals the visual order, so the arc reads the same
   to a screen reader as to the eye.

---

## Open questions for approval

1. Finding #1: do we redefine the semantic `--pb-text-muted` to a darker
   muted-ink (proposed ~`#5E5A52`, ~5:1) and demote raw `stone` to
   decorative-only? This is the single highest-impact change and touches the
   whole site's "feel" - approve the exact value.
2. Finding #3: approve a brighter ink-scoped `--pb-accent` for interactive text
   on dark (around `#C24A45`), accepting it is louder than `#9B2B2B` on the
   threshold?
3. Finding #4: confirm the layout (not pages) owns the single `main`/`#main`,
   and we strip the duplicates from verify/chapters/stories/passport.
4. Sound (Finding #6): confirm the contract - default OFF, persistent labelled
   toggle, preference remembered, reduced-motion also suppresses ambience.
5. Do we target plain AA, or stretch any surface (e.g. body copy) toward AAA
   7:1 to match the institutional tone?
6. Scope check: is `/verify` truly the only public form for Phase 3, or do
   "Become part of the story" (page.tsx L139) / partner inquiry flows add forms
   we must audit now?
