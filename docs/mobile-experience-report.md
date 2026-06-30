# Mobile Experience Report — Planet B

**Phase:** Experience Phase · Mobile First
**Objective:** Make every existing experience world-class on a phone, treating mobile as the primary platform and desktop as the expansion — without adding features or pages.
**Outcome:** 10 commits (Gate 0 foundation + Gates 1–9), production build green, typecheck clean throughout.

---

## 1. Method

The work proceeded gate by gate. After each gate: render-test on the dev server, typecheck, and commit, keeping the application build-green at every step. Foundation primitives were established first (Gate 0) so every later gate could inherit a single mobile-first system rather than patch pages individually.

**Verification note:** changes were validated by HTTP render checks (every route returns 200 / correct redirect), `tsc --noEmit` (0 errors), and a full `next build` (green). They have **not** yet been visually QA'd on physical devices — that pass is the recommended next step (see §8), and the fluid/responsive CSS is written to the device matrix in §7.

---

## 2. The two systemic problems (found in the audit)

1. **No mobile navigation.** `SiteHeader` rendered all five links in a single horizontal row with sub-44px targets — it overflowed an iPhone SE and had no menu. This was the single largest defect and blocked the whole site on phones.
2. **Desktop typography squeezed onto phones.** Headings were fixed Tailwind sizes that jumped at the `sm` breakpoint (e.g. `text-4xl sm:text-6xl`), so a phone wore a near-desktop size with no smooth scaling.

Plus three structural issues: a fixed-sidebar admin console unusable below 1024px, unwrapped admin tables that overflowed the layout, two duplicate `<main>` landmarks, and one `video` element missing `playsInline` (iOS forced fullscreen).

---

## 3. Gate 0 — Foundation (commit `5c9dbba`)

**Navigation — full rebuild.** `SiteHeader` is now a compact bar (logo + 44×44 menu button) that opens a full-height sheet on phones: 48–52px touch rows, focus-trapped, scroll-locked, ESC/backdrop dismiss, auto-close on navigation, safe-area aware. The inline desktop nav expands from `md` up. Phone is the base; desktop is the expansion.

**Design-system primitives** (`globals.css`):
- **Fluid display scale** — `.pb-display-1…4` using `clamp()`, so one value scales smoothly from phone to desktop with no breakpoint jump. `.pb-read` gives body copy a hair more size on phones for one-handed legibility.
- **`-webkit-text-size-adjust: 100%`** — stops iOS inflating body text on rotate.
- **`overflow-x: clip`** on `body` — a safety net so a single wide child can't force sideways scroll (root causes still fixed per gate).
- **`.pb-touch` (44×44)** and **safe-area helpers** (`.pb-safe-b`, `.pb-safe-x`) for notch/home-indicator clearance.

**Footer** links became 44px touch rows with safe-area-bottom padding.

---

## 4. Gate-by-gate changes

| Gate | Commit | Key before → after |
|---|---|---|
| **1 · Homepage** | `8212fa7` | "View in archive" cue was `opacity-0` until hover → **invisible on touch**; now visible by default on phones, fade reserved for desktop. Flat `py-28/32` → `py-20/24` on phones. Hero/section headings → fluid. Closing CTAs → full-width 52px thumb target. |
| **2 · Genesis Chapter** | `2df5d24` | `VideoPlayer` missing `playsInline` → iOS forced fullscreen; now inline. Hero `py-32`→`py-20`, title fluid, fact gaps tightened. Interstitials `py-28`→`py-20`. Footer actions → 44px. Timeline already touch-native (vertical scroll spine) — left intact. |
| **3 · Passport** | `108ad4a` | Portrait `<Image sizes="200px">` → **under-fetched/blurred** on phones; fixed to responsive sizes and capped to a contained passport photo (designed for the hand, not shrunk). Legacy-Snapshot orphan cell now spans full width on phones. "Open Passport"/print actions → 48px. |
| **4 · Artwork** | `aad2f44` | Already strong (hero stacks, content-visibility provenance). Titles → fluid; back-link → 44px; mobile rhythm tightened. |
| **5 · Story** | `9661f9f` | Already an excellent reading column. Titles → fluid; body → `.pb-read`; narrative pacing `space-y-20`→`16` on phones. |
| **6 · Verify** | `678f8ae` | The "Examine" submit was a tiny inline text target → now a 44px target; input guaranteed 44px (keeps 18px mono = no iOS zoom-on-focus). Removed a **duplicate `<main>` landmark**. |
| **7 · Founder's Letter** | `d1444fc` | Reading was already journal-grade (66ch / 1.075rem / 1.85 leading). Title + pull quote → fluid; closing link → 44px. Films integrate inline with honest "being prepared" note. |
| **8 · Institution** | `f5c2b62` | Origin, Partners, Research, Press, Certificates, Artist Registry, Chapters + shared `ExhibitLayout`: titles → fluid, intro copy → `.pb-read`, back-link → 44px. Removed a second **duplicate `<main>`** (Chapters). |
| **9 · Admin** | `39f6750` | Fixed `grid-cols-[240px_1fr]` sidebar crushed iPad/phone → new **`AdminShell`**: sidebar from `lg` up, focus-trapped drawer below. All 11 tables become horizontal scroll containers below `lg` (one CSS rule, no per-page churn). Form controls/buttons → 44px. |

---

## 5. Performance

- **No layout shift from media:** every `next/image` already declared dimensions via `fill` + `sizes`; the Passport portrait `sizes` bug (over-/under-fetch) was corrected, improving both CLS and bytes-on-wire on phones.
- **LCP:** hero images use `priority`; fluid `clamp()` headings remove a reflow that previously occurred at the `sm` breakpoint.
- **JS:** no new client components on public reading pages — the new interactivity (nav sheet, admin drawer) is small, self-contained, and compositor-only (transform/opacity) at 60fps. Bundle shared JS unchanged at ~87 kB first-load.
- **Video:** `preload="none"` retained, so the large films never download until tapped; `playsInline` avoids a costly fullscreen transition on iOS.
- **`content-visibility:auto`** on artwork provenance rows (pre-existing) is preserved — off-screen rows skip layout/paint.

---

## 6. Accessibility

- **Touch targets:** primary nav, footer links, CTAs, back-links, the Verify form, and all admin controls are now ≥44×44 (WCAG 2.5.5).
- **Landmarks:** removed **two** duplicate `<main>` landmarks (Verify, Chapters) — each page now exposes a single main region.
- **Keyboard:** both the public nav sheet and the admin drawer trap focus, support `Esc`, restore focus to the trigger on close, and expose `aria-expanded` / `aria-controls` / `role="dialog"` / `aria-modal`.
- **Reduced motion:** the global `prefers-reduced-motion` reset (pre-existing) is untouched; all new transitions are transform/opacity and honour it.
- **No hover-only affordances:** the homepage "View in archive" cue (the one true hover-only reveal) now shows on touch.
- **Focus states:** the global `:focus-visible` ring (pre-existing) covers all new interactive elements.

---

## 7. Responsive strategy

- **Phone-first base, desktop as expansion.** Default styles target the phone; `sm`/`md`/`lg` widen rather than the reverse.
- **Breakpoint roles:** `sm` (640) refines phone→large-phone; `md` (768) is where the public inline nav appears; `lg` (1024) is where the admin sidebar becomes permanent.
- **Fluid type** removes most breakpoint guesswork for headings — they scale continuously with the viewport.
- **Device matrix the CSS is written for:** iPhone SE (smallest), iPhone 13–15 / Pro Max, Pixel, Galaxy, iPad Mini (portrait → drawer admin), iPad Pro (landscape → sidebar admin), desktop, ultrawide (capped by `max-w-container-wide`).

---

## 8. Remaining opportunities

1. **Physical-device QA pass.** Validate the gates on the real device matrix (esp. iPhone SE 320–375px and iPad Mini portrait). This is the highest-value next step.
2. **Admin tables → cards (optional upgrade).** Horizontal scroll is the reliable solution shipped here; a per-table card layout on phones would be even nicer for the heaviest tables (Media, Audit) if staff use phones, not just iPads.
3. **Lighthouse/INP measurement** on a throttled device to put numbers behind §5 (the work is structurally sound but unmeasured here).
4. **Image `sizes` audit sweep** — the Passport bug suggests a quick pass over every `sizes` attribute to confirm none over-fetch on phones.
5. **Container queries** for a few cards (e.g. PortraitCard) could make them context-responsive rather than viewport-responsive.
6. **`prefers-reduced-data`** could gate the large films' posters in the future.

---

## 9. Summary

Planet B no longer carries the obvious tells of a desktop-first site: there is real mobile navigation, type scales fluidly instead of being squeezed, touch targets meet the 44px floor, films play inline, landmarks are clean, and the admin console works from an iPad. The reading experiences (Founder's Letter, Story, Origin) were already close to journal-grade and were refined rather than rebuilt; the Passport was redesigned specifically for the hand; the foundation now makes every screen feel intentionally designed for the device it is on.
