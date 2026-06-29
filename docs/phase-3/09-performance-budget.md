# Phase 3 - 09 - Performance Budget

> Status: DESIGN - awaiting approval. Targets + measurement plan, not code.
> No optimization ships until the founder approves.

## Purpose

Make "Performance is experience" (00-README non-negotiable #6) enforceable. The
cinematic atmosphere of Phase 3 - scroll scenes, the living chrome, page
transitions, the Eye, ambient sound - adds weight by definition. This budget
sets hard numbers (Core Web Vitals, per-route JS, image, font) on a realistic
device, names where framer-motion and force-dynamic rendering will cost us, and
defines how we measure so a regression fails loudly. The reference device is a
mid-range Android (think Pixel 6a class) on a throttled 4G connection - if it
holds there, it holds everywhere.

## Extends

- docs/phase-3/00-README.md (non-negotiables #1 60fps/transform+opacity, #6
  real budget, #5 the artwork is the hero / chrome recedes)
- next.config.mjs (image formats avif/webp at L8-11; better-sqlite3 kept
  server-side at L4-7)
- app/layout.tsx (next/font Fraunces/Inter/JetBrains Mono, display:swap, L5-20)
- components/Plate.tsx (next/image usage, responsive `sizes`, `priority` flag)
- tokens/tokens.css + tokens/motion.json (durations/easings; the motion these
  budgets must run at 60fps)
- It adds no new tokens; it constrains how the existing system is rendered.

---

## 1. Core Web Vitals targets (mid Android / throttled 4G)

| Metric | Target | Hard fail (CI gate) | Notes |
|--------|--------|---------------------|-------|
| LCP - Largest Contentful Paint | <= 2.5s | > 2.8s | LCP element per surface defined in S2. Only the LCP image gets `priority`. |
| INP - Interaction to Next Paint | <= 200ms | > 250ms | Scroll-linked motion is the main threat; keep handlers passive + off the main thread (transform/opacity only). |
| CLS - Cumulative Layout Shift | <= 0.1 | > 0.15 | Reserve image boxes (Plate already uses aspect-ratio); font swap must not reflow (size-adjust). Reveal uses transform, not layout - good. |
| TTFB | <= 0.8s | > 1.0s | At risk on force-dynamic artist/artwork pages - see S6. |
| TBT (lab proxy for INP) | <= 200ms | > 300ms | Bounded by per-route JS (S3) and framer-motion hydration. |

Field truth (CrUX/RUM, p75) is the contract; Lighthouse lab is the early-warning
proxy. A surface is "green" only when p75 field meets target.

---

## 2. Per-surface budget

The "four worlds" + the registry/utility pages. Weights are first-load, over the
wire (compressed), excluding fonts (counted once in S4).

| Surface | Route | LCP element | JS budget (route, gz) | Image budget (initial vp) | Notes / risks |
|---------|-------|-------------|------------------------|----------------------------|---------------|
| Home (documentary) | app/(public)/page.tsx | Threshold h1 text (or the WonderEye art) | <= 130 KB | <= 250 KB (Threshold is SVG+gradient, no raster above fold) | Heaviest motion page: WasteToArt + HopeShift + AliveEye + Reveal x many. framer-motion is the dominant cost. Threshold first paint must be near-instant (text + SVG). |
| Chapter (documentary-of-a-place) | chapters/abuja-2026 | Cover image (opacity-20 wash) | <= 120 KB | <= 300 KB | Cover is `priority` + `100vw`; ensure it is the LCP and sized right. Future VideoPlayer is `preload="none"` - keep it. |
| Passport (a life) | passport/[id] | Portrait / first record block | <= 110 KB | <= 200 KB | Currently utilitarian; when cinematic, lazy-load below-fold scenes. |
| Artwork (the gallery wall) | artworks/[slug] | The artwork Plate (priority) | <= 110 KB | <= 220 KB | force-dynamic (L10) -> no static cache today; see S6. The art IS the hero - it gets `priority`, everything else lazy. |
| Artist (record) | artists/[slug] | Primary artwork / portrait Plate (priority) | <= 110 KB | <= 220 KB | force-dynamic (L9). Same caching recommendation. |
| Registry grids | artists, artworks | First row of Plates | <= 100 KB | <= 350 KB (many thumbs) | No `priority` on grid thumbs - they are below/at fold in bulk; rely on lazy + small `sizes`. |
| Utility (verify, press, research, partners, certificates, stories) | various | Page h1 | <= 90 KB | <= 120 KB | Mostly server-rendered, link-lists; should be the lightest. verify has a tiny form, no heavy JS. |

Site-wide ceiling: shared/global JS (framework + next/font loader + header/footer
client islands) <= 90 KB gz; any single route's total first-load JS <= 170 KB gz.

---

## 3. JavaScript budget + the framer-motion problem

framer-motion is the single largest discretionary cost and it ships to the
client on every page that imports it (Reveal.tsx, SiteHeader.tsx, and all of
components/experience/*). Rules:

- Favor CSS for the living chrome and the Breath. The Breath is already pure CSS
  (`@keyframes pb-breath`, globals.css L105-112) - keep it; do NOT reimplement
  ambient/atmospheric loops (dust, light, day/night tone) in JS where a CSS
  keyframe or `@property`-driven gradient suffices. Living chrome = CSS-first.
- Reserve framer-motion for genuinely interactive/scroll-linked choreography
  (WasteToArt shard convergence, HopeShift sweep, the Eye pupil drift). Each
  such use must earn its existence (00-README #1).
- Lazy-load scroll scenes. The below-the-fold cinematic components
  (WasteToArt, HopeShift, and future blueprint scenes) should be dynamically
  imported (`next/dynamic`, client-side, no SSR of the heavy motion path) so the
  Threshold paints without waiting on the whole arc's JS. Above-the-fold motion
  (Threshold, the Eye) loads eagerly; everything past beat 1 is deferred.
- One motion library. Do not add a second animation dependency for page
  transitions; build them on framer-motion + CSS that already ships.
- Tree-shake imports (named imports only, which the code already does).
- Budget enforcement: per-route first-load JS in S2 is the gate. If framer-motion
  pushes Home over 130 KB, the fix is more lazy-loading, not a higher budget.

Reduced-motion is also a perf win: under reduce, scenes render their static
fallback - confirm those fallbacks skip the motion code paths (they do today:
e.g. WasteToArt.tsx L41 returns before any motion value is used).

---

## 4. Image budget

- Formats: AVIF then WebP (next.config.mjs L10 already sets
  `formats: ["image/avif","image/webp"]`) - keep AVIF first.
- Responsive sizes: every `next/image` must pass an accurate `sizes`. Plate.tsx
  defaults to `(max-width:768px) 100vw, 33vw`; grids/heroes already override it.
  Audit that no full-bleed hero accidentally inherits the 33vw default.
- priority discipline: `priority` ONLY on the per-surface LCP element (S2).
  Today ExhibitLayout.tsx L43 sets `priority` on the record hero (correct, it is
  LCP). The chapter cover is `priority` (correct). Registry thumbs must NOT be
  priority. The Home Threshold has no raster LCP, so no image priority there.
- Reserve space: Plate wraps every image in an aspect-ratio box
  (Plate.tsx L26) -> no image-driven CLS. Keep this invariant for any new
  imagery.
- Derivative weight: target each above-the-fold hero <= 150 KB after AVIF at the
  device's actual rendered size; registry thumbs <= 35 KB each.
- Local media today (no CDN); when remote patterns land (next.config note L9),
  re-confirm formats + caching headers.

---

## 5. Font strategy

- Loader: next/font/google self-hosts Fraunces (display), Inter (text),
  JetBrains Mono (mono) with `display: "swap"` (app/layout.tsx L5-20) -> no
  external request, no FOIT. Good baseline.
- Subsetting: all three set `subsets: ["latin"]` (correct). Yoruba proverbs
  (page.tsx L94) use only Latin + standard diacritics - confirm Latin subset
  covers the required glyphs; add `latin-ext` ONLY if a glyph is missing
  (it costs bytes).
- Weights: Fraunces is pinned to 400/500/600 (layout.tsx L9) - good restraint.
  Inter/JetBrains load default weights; pin Inter to the weights actually used
  (likely 400/500/600/700) to avoid shipping the full range.
- Variable-axis caution: Fraunces is a variable font with optical/SOFT/WONK
  axes; ensure we are not pulling unused axes. Body copy should not animate font
  axes (would risk layout work).
- CLS from swap: pair swap with next/font's automatic size-adjust fallback
  metrics so the swap from fallback to webfont does not shift layout (counts
  against CLS <= 0.1). Verify the fallback stacks in tokens
  (tokens.css L27-29: serif / system-ui / mono) match metrically.
- Budget: total font payload (all three, latin, chosen weights) <= 120 KB gz,
  loaded once and cached; counted outside per-route JS.

---

## 6. SSR / ISR / dynamic posture

- Current state: artists/[slug] and artworks/[slug] are `force-dynamic`
  (artists/[slug]/page.tsx L9, artworks/[slug]/page.tsx L10) "so the living
  archive / provenance is always current." This means no full-route caching:
  every visit re-renders + re-queries SQLite, hurting TTFB -> LCP on exactly the
  hero pages where the artwork must paint fast.
- Recommendation: move from force-dynamic to time-based ISR
  (`export const revalidate = <N>`, e.g. 300-3600s) plus on-demand revalidation
  (`revalidatePath`) fired by the admin actions that mutate a record
  (app/admin/.../actions.ts). The archive stays "current" the instant an editor
  changes it, but anonymous visitors are served a cached, fast page. Provenance
  that accrues from public reads is rare; tag-based revalidation covers writes.
- Static where possible: home, chapter, and the utility pages should be static
  or ISR, not dynamic. Registry index pages are ISR-friendly.
- DB on the client: confirmed server-only (next.config.mjs L4-7) - keep
  better-sqlite3 out of any client bundle.
- Resolve the dual-source seam (00-README: JSON hero + DB sections) as part of
  this - a single source per surface simplifies caching/revalidation.

---

## 7. The 60fps rule (motion performance)

- Animate transform + opacity only. Audit confirms compliance: Reveal (opacity
  + y, L33-35), WasteToArt shards (x/y/opacity/rotate via motion values),
  HopeShift dust (y/opacity), AliveEye (scaleY + x/y), TickingWatch (rotate),
  pb-breath (transform scale). The one watch item: HopeShift animates
  `backgroundColor` and `color` on scroll (HopeShift.tsx L15-16) - color is
  compositor-cheap-ish but is not transform/opacity; verify it stays 60fps on
  the reference device, and prefer an overlay opacity cross-fade if it janks.
- will-change discipline: do not blanket-apply `will-change`. Apply only to the
  specific animating element, only while animating; never to large or many
  elements (memory cost). The shard/dust layers are `pointer-events-none` and
  small - acceptable.
- Avoid layout thrash: no animating width/height/top/left/margin. Reveal moving
  `y` via transform (not top) is correct. Keep scroll handlers passive
  (SiteHeader.tsx L33 uses `{ passive: true }` - good) and rAF-batched
  (AliveEye.tsx L48-50 batches pointermove in rAF - good).
- Sticky scroll scenes (WasteToArt's `sticky` stage) are GPU-friendly; ensure
  the long scroll container (`h-[240vh]`) does not force repaint of the whole
  page.

---

## 8. Measurement plan

| Layer | Tool | Gate | When |
|-------|------|------|------|
| Lab, per-route | Lighthouse CI (mobile preset, 4x CPU + 4G throttle) | Fail PR if any S1/S2 budget exceeded; assert categories (perf >= 90) | Every PR |
| Bundle weight | next build size output + size-limit/bundle-analyzer | Fail if route first-load JS > S2 budget or shared > 90 KB | Every PR |
| Field, real users | web-vitals lib -> analytics endpoint (LCP/INP/CLS p75) | Alert if p75 regresses past S1 hard-fail | Continuous in prod |
| Motion fps | Manual DevTools Performance trace on reference device for each cinematic scene | No frame > 16.7ms during scroll choreography | Per cinematic PR |
| Images | Lighthouse "properly sized / next-gen formats" audits | No oversized or non-AVIF/WebP hero | Every PR |

CI baseline: commit a `lighthouserc` budget file mirroring S1/S2 numbers so the
budget lives in the repo, not in this doc only. web-vitals reporting is a small
client snippet on the public layout (cheap, no third-party SDK).

## The standard Planet B must hold

1. Numbers, not vibes: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1 at p75 on mid
   Android / 4G - or the surface is not done.
2. Atmosphere is free or it does not ship: living chrome is CSS-first; JS motion
   is lazy-loaded and earns its bytes.
3. The artwork paints first - LCP image gets `priority`, all else defers.
4. Cache the archive (ISR + on-demand revalidate); never serve a dynamic
   round-trip where a cached page would do.
5. 60fps means transform/opacity only, disciplined will-change, no layout
   thrash.
6. The budget is enforced in CI, measured in the field, and reduced-motion is a
   first-class (and faster) path.

---

## Open questions for approval

1. Confirm the reference device/throttle (mid Android, 4x CPU, 4G) as the
   official budget baseline?
2. S6: approve moving artist/artwork pages off force-dynamic to ISR +
   on-demand revalidation from admin actions? (Needs the admin mutation paths to
   call `revalidatePath`/tag.) Approve a default `revalidate` window.
3. Approve the per-route JS ceilings in S2, especially Home at 130 KB gz given
   framer-motion - or do we want it lower and accept fewer motion scenes
   eager-loaded?
4. Future ambient sound (08 #6): what is its asset budget and load posture
   (lazy, on first opt-in only)? It must not count against initial LCP.
5. Do we adopt Lighthouse CI + size-limit + web-vitals as the stack, and where
   does the field beacon report (self-hosted endpoint vs a provider)?
6. Resolve the dual-source (JSON hero / DB sections) seam now as part of the
   caching work, or track it separately?
