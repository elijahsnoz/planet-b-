# 09 · Wireframes (low-fidelity)

Layout intent for the core pages. ASCII = structure, not pixels.

## Home — the threshold
```
┌─────────────────────────────────────────────┐
│            [no chrome yet]          🔊 (mute) │  ← full-bleed dark
│                                               │
│              ( breathing eye/Earth )          │  ← The Breath
│                                               │
│           Because there is no Planet B.       │  ← serif, fades in
│                  ↓ scroll                      │
├─────────────────────────────────────────────┤
│  [scroll scene: waste fragments → artwork]    │  ← Wonder
├─────────────────────────────────────────────┤
│   " artist quote, large serif "               │  ← Reflection
│                          — Artist, *Work*     │
├─────────────────────────────────────────────┤
│   the founders   ◯ ◯ ◯ ◯ ◯ ◯ ◯ (faces)        │  ← Connection
├─────────────────────────────────────────────┤
│   proverb · the planet watches back           │  ← Responsibility
├─────────────────────────────────────────────┤
│   garbage → grace (hope beat)                 │  ← Hope
├─────────────────────────────────────────────┤
│   [ Enter the Genesis Chapter → ]             │  ← Action
│   nav + footer index appear                   │
└─────────────────────────────────────────────┘
```

## Genesis Chapter (Abuja 2026)
```
┌─────────────────────────────────────────────┐
│ Planet B · Abuja 2026        [primary nav]    │
│ Hero: title · WED 5 June 2026 · Nike Gallery  │
│ Partners lockup: Norway · Nike                │
├─────────────────────────────────────────────┤
│  IMMERSIVE TIMELINE (sticky scrubber left)    │
│  ● Preparation                                │
│  ● Road Walk sensitization                    │
│  ● 5-day Workshop                             │
│  ● Creation                                   │
│  ● Installation                               │
│  ● Opening Ceremony                           │
│  ● Exhibition / Guest Experience              │
│  ● Panel Discussion                           │
│  ● Performance: Òdàlè Dà'lẹ̀                   │
│  ● Certificates                               │
│  ● Media Coverage / Closing                   │
│  each node → media + people + artworks         │
└─────────────────────────────────────────────┘
```

## Artist Registry (index) & Artist profile
```
INDEX                              PROFILE (museum exhibit)
┌───────────────┐                  ┌──────────────────────────────┐
│ filter: chapter│                 │ ◖portrait◗   NAME             │
│ ▢ ▢ ▢ ▢       │                  │            role · chapter      │
│ ▢ ▢ ▢ ▢       │  →               │ ── biography ────────────────  │
│ (portrait grid │                 │ " their own statement quote "  │
│  + name +      │                 │ Artwork ▮ The Watchful Eye →   │
│  artwork title)│                 │ materials · 61×61cm · 2026     │
└───────────────┘                  │ gallery · video · certificate  │
                                   │ related people / performance   │
                                   └──────────────────────────────┘
```

## Artwork record
```
┌─────────────────────────────────────────────┐
│   ▮▮▮ large plate (zoomable)   │  TITLE        │
│                                │  by Artist →   │
│                                │  materials     │
│                                │  61×61cm, 2026 │
│                                │  chapter →     │
│                                │  certificate → │
├────────────────────────────────────────────── │
│  Artist statement (their words)               │
│  Detail crops · appears-in video              │
└─────────────────────────────────────────────┘
```

## Certificate / verification
```
┌─────────────────────────────────────────────┐
│   [ eye-seal ]   CERTIFICATE OF PARTICIPATION │
│   Name · Role · Genesis Chapter · Abuja 2026  │
│   ID: PB-ABJ-2026-014   ✓ verified            │
│   (future) on-chain: [ verify on ledger ]     │
│   linked: artist → artwork → chapter          │
└─────────────────────────────────────────────┘
```

Index pages share one **Registry** template (filterable card grid). Profiles share one **Exhibit** template. This keeps the system small (see [12 Components](12-component-library.md)).
