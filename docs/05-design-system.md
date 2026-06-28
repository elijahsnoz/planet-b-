# 05 · Design System

Museum-grade, editorial, architectural. The artworks supply the color; the system stays quiet so they sing.

## Principles
- **The interface is the frame, not the painting.** Near-monochrome chrome; saturated color comes only from the artworks.
- **Whitespace is storytelling.** Generous, asymmetric, confident negative space.
- **Type carries authority.** A serif display voice + a clean grotesque for text.
- **One accent, used rarely.** The oxblood from the catalogue spine.

## Color
The catalogue establishes the palette: deep **oxblood/maroon** spine, warm off-white paper, near-black ink, and a muted brown for display headers. The artworks themselves are the chromatic events.

```
Ink        #0B0B0C   primary text on light, background base for the dark threshold
Paper      #F6F3EC   primary light background (warm, archival, not pure white)
Oxblood    #6E1414   the single brand accent (links, marks, focus)  [from catalogue spine]
Clay       #7A5C3E   secondary/editorial header tone (warm brown)   [from catalogue]
Stone      #9B978E   muted captions, metadata, borders
Mist       #E7E2D7   hairlines, fills, subtle surfaces
Signal     #2FA36B   used ONLY for "verified / impact" states — never decorative green
```
Rules: never a green gradient; never green as decoration (only as *verification/impact* semantics, mirroring the green growth elements inside the artworks). Dark mode = Ink base with Paper-tinted text; oxblood brightens slightly for contrast. All pairings meet WCAG AA (AAA for body).

## Typography
- **Display / Serif:** a high-contrast editorial serif (e.g. *Canela, Ogg, or Fraunces*) — headlines, artwork titles, pull-quotes. Carries the "museum" authority.
- **Text / Sans:** a neutral grotesque (e.g. *Söhne, Inter, or Suisse Int'l*) — body, UI, metadata, captions.
- **Mono (sparingly):** for IDs, certificate codes, provenance hashes (e.g. *JetBrains Mono*).

Type scale (fluid, `clamp()`): Display 1 ~4–7rem · Display 2 ~3rem · H1 2rem · H2 1.5rem · H3 1.25rem · Body 1.125rem (reading) · Small 0.9rem · Caption 0.8rem. Line-height 1.5 body / 1.1 display. Measure: 60–72ch for long reads.

## Spacing & grid
- **Base unit 8px.** Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- **Grid:** 12-col desktop / 6-col tablet / 4-col mobile; wide gutters (32–48px desktop). A recurring **single-column editorial measure** centered for long reads.
- **Page rhythm:** large vertical sections (min 80–120px padding) so each idea has air.

## Tokens (shape)
Defined once as CSS variables / Tailwind theme; never hard-code values in components.
```
--color-*, --font-display, --font-text, --space-*, --radius-* (0, 2px, 8px),
--shadow-* (museum-soft, never heavy), --ease-*, --dur-* (see Motion),
--measure (66ch), --container (1200/1440px)
```

## Imagery rules
- Artworks and portraits are the imagery. **No stock photography. No icon-clipart of recycling/leaves/globes.**
- Treatment: generous matting (paper-colored margin around each plate, echoing the catalogue), subtle drop-shadow, consistent crop ratios per record type (portrait 4:5; artwork as-shot square ~1:1 since works are 61×61cm).
- Always store and show alt text + caption (title, artist, materials, dimensions, year).

## Accessibility (non-negotiable, it's an institution)
WCAG 2.2 AA minimum. Full keyboard nav, visible oxblood focus ring, `prefers-reduced-motion` honored everywhere, captions/transcripts on all video, semantic landmarks, alt text on every plate, target ≥44px.
