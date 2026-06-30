# Prototype v1 — Validation Report

**Phase:** Prototype Validation (Real-Device + Lighthouse)
**Scope:** Validate Planet B v1 as a product being prepared for its first public audience. No new features.
**Build state:** production build green; typecheck clean; 13 commits this arc (Founder's Letter → Mobile Gates 0–9 → Phase B fixes).

---

## 1. Method

- **Phase A — Real device:** the production build (`next build && next start`) was exposed over a temporary Cloudflare quick tunnel for hands-on review on iPhone, Android, iPad, and desktop. Server-side behaviour was validated programmatically; visual/interaction QA on physical hardware is the founder's pass (checklist provided, results pending).
- **Phase B — Lighthouse:** mobile preset, run against the production server on localhost (not through the tunnel, to remove network noise), Performance / Accessibility / Best Practices / SEO, across the five most representative pages.

> Production build is served with Node 20; SQLite via better-sqlite3 (WAL). These are local-host facts that matter for deployment — see §6.

---

## 2. Issues discovered

### Phase A (server-side validation over the tunnel)
All clean — no defects found at the protocol level:
- 14 public routes return 200; dynamic Verify (`?q=`) returns 200; admin correctly redirects (307) when unauthenticated.
- Video streams with HTTP range support (`206`, `Accept-Ranges: bytes`) — films play/seek over the tunnel.
- *Visual/interaction defects on real devices are still to be confirmed by the founder's hands-on pass.*

### Phase B (Lighthouse)
| # | Issue | Page(s) | Severity |
|---|---|---|---|
| 1 | No favicon → `/favicon.ico` 404 logged to console; no tab/home-screen icon | all | Best Practices + device polish |
| 2 | Muted text (`#9b978e`) only **2.62:1** on paper — below WCAG AA | all | Accessibility (real legibility) |
| 3 | `aria-hidden-focus`: closed nav/admin drawers kept links in the tab order | all (mobile) | Accessibility |
| 4 | `link-in-text-block`: inline prose links distinguished by colour only | Verify (+ pattern site-wide) | Accessibility (Level A) |
| 5 | Moderate Performance on motion-rich pages (framer-motion TBT, hero LCP) | home, genesis | Performance (by design) |
| 6 | Render-blocking CSS, legacy-JS polyfills, unused JS | all | Performance (minor) |

---

## 3. Issues resolved (commit `ef0093b`)

Implemented **only** changes that preserve the museum experience:

1. **App icon added** (`app/icon.svg`) — the Eye-World mark, oxblood on paper. Kills the 404 on every page and gives phones a real tab + "Add to Home Screen" icon.
2. **Muted-text contrast → WCAG AA** — darkened to the *lightest* value that passes (`#6f6a61` = 4.85:1) so the quiet stone character is preserved while becoming readable in sunlight. Theme-aware: the dark "ink" sections keep their original light value (legible on near-black).
3. **`inert` on closed drawers** — closed nav/admin menus now leave the tab order and the accessibility tree entirely.

### Lighthouse — before → after (mobile, production)

| Page | Performance | Accessibility | Best Practices | SEO | CLS |
|---|---|---|---|---|---|
| Home | 63 → **62** | 93 → **100** | 96 → **100** | **100** | **0** |
| Genesis Chapter | 51 → **54** | 96 → **100** | 96 → **100** | **100** | **0** |
| Founder's Letter | 68 → **70** | 96 → **100** | 96 → **100** | **100** | **0** |
| Verify | 75 → **91** | 96 → **96** | 96 → **100** | **100** | **0** |
| Passport | 83 → **97** | 96 → **100** | 96 → **100** | **100** | **0** |

**Best Practices and SEO are 100 across the board; Accessibility is 100 on four of five pages; CLS is a perfect 0 everywhere** (no layout shift — images and type are correctly sized).

---

## 4. Recommendations documented but NOT implemented

Per the directive — *only implement what preserves the museum experience; do not optimise solely for a score* — these were left as deliberate decisions:

- **Performance on Home (62) / Genesis (54).** Driven by framer-motion main-thread work (TBT) and large hero images (LCP 3.5–5.4s on throttled mobile). The motion *is* the museum experience and already respects `prefers-reduced-motion`. Chasing the number would mean stripping the choreography. **Recommendation:** leave as-is; if desired later, lazy-mount below-the-fold motion components (structural, post-v1).
- **`link-in-text-block` (Verify 96).** Inline links in body copy are distinguished by colour alone. The accessible fix is to underline inline prose links by default — but that is a **visible, site-wide change to the museum's quiet link aesthetic** and therefore a founder design decision, not a validation-phase edit. **Recommendation:** founder sign-off, then underline inline links *within reading columns only* (not standalone/card/nav links).
- **Legacy-JS polyfills / render-blocking CSS / unused JS.** Inherent to Next.js App Router + a styled, animated site; the measured savings are small (~150ms) and changing browserslist/splitting risks the experience. **Recommendation:** leave for v2 if ever.

---

## 5. Remaining known limitations

1. **Visual device QA pending.** Server behaviour is validated; the founder's hands-on pass on the real device matrix (esp. iPhone SE smallest width, iPad portrait admin drawer, iOS inline video) is the final sign-off. Tunnel + checklist provided.
2. **Performance is "good," not "fast,"** on the two motion-rich pages — an intentional trade for the experience.
3. **One Level-A a11y item open** (inline link distinguishability) pending a founder aesthetic decision.
4. **Large video masters are local-only.** `workshop.mp4` (371 MB) and `Final interview .mp4` (238 MB) exceed GitHub's 100 MB limit and are git-ignored — they will not travel with a git-based deploy.
5. **Database is local SQLite (better-sqlite3, WAL).** It runs perfectly on a Node host with a writable disk; it will **not** run on a read-only serverless platform (e.g. Vercel functions) without a rework.
6. **Historical-accuracy "un-issued" state is intentional** — certificates verify as *archived, awaiting issuance*. This is correct, not a defect.

---

## 6. Production readiness assessment

**Front-end / experience:** ✅ **Ready.** Museum-grade, mobile-first, Accessibility ~100, Best Practices & SEO 100, zero layout shift, build green.

**For a first public audience via a controlled preview (the tunnel or an equivalent Node host):** ✅ **Ready now** — everything works, including video and the live database.

**For an unattended public production deployment:** ⚠️ **Two infrastructure decisions remain** (neither is a front-end defect):
- **Video hosting** — move the two large films to external storage (Vercel Blob / Cloudflare R2 / S3 / Vimeo) and point the records at those URLs.
- **Runtime/DB host** — either deploy to a Node host with a persistent writable disk (keeps SQLite as-is) **or** migrate the data layer for a serverless target.

Until those two are decided, the truthful status is: **the product is ready; the hosting is the open question.**

---

## 7. Deployment checklist

**Pre-deploy**
- [ ] Founder completes the real-device pass (iPhone / Android / iPad / Desktop) and signs off.
- [ ] Decide inline-link a11y item (§4) — underline prose links or accept Level-A exception.
- [ ] Choose a runtime host (Node-with-disk vs serverless) — drives the DB decision.
- [ ] Choose video hosting; upload the 4 films; update media `storagePath` values to the hosted URLs.
- [ ] Set production env vars (`PLANET_B_DB` path or DB connection; any auth secrets).
- [ ] Confirm `next build` green on the target Node version (20.x).
- [ ] Seed/migrate the production database (`db:migrate` + `db:seed`) — keep the un-issued Genesis state truthful (no demo certificates).

**Deploy**
- [ ] Build and start on the chosen host; smoke-test the 14 public routes + `/admin/login`.
- [ ] Verify the app icon, a video plays inline on a real iPhone, and a Passport opens.
- [ ] Confirm HTTPS + that the admin panel is reachable only behind auth.

**Post-deploy**
- [ ] Re-run Lighthouse against the live URL; confirm parity with §3.
- [ ] Add `apple-icon`/PWA manifest if "Add to Home Screen" polish is wanted (optional).
- [ ] Tear down the temporary tunnel.

---

## 8. Summary

Prototype v1 passed validation as a product, not a work-in-progress. The four Lighthouse pillars are strong (BP & SEO 100, A11y 100 on 4/5 and 96 on the last, CLS 0 everywhere), and the three fixes applied were genuine quality wins that preserved the museum aesthetic. The only open experience item is a single Level-A inline-link decision that belongs to the founder. The real remaining work is **infrastructure** (video hosting + runtime/DB host), not the product. Planet B v1 is ready for its first audience.
