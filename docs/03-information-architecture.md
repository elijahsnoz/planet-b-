# 03 · Information Architecture

The institution has **spaces**, not pages. The map below is the canonical sitemap; everything in the schema and CMS serves it.

## Top-level spaces

```
/                         Home — the cinematic threshold
/origin                   Origin Story — why "no Planet B", the philosophy
/chapters                 Chapter Network — the map of the movement
  /chapters/abuja-2026    GENESIS CHAPTER — the immersive founding timeline
/timeline                 The founding timeline (also embedded in Genesis Chapter)
/artists                  Artist Registry (index)
  /artists/[slug]         Artist profile (museum exhibit)
/artworks                 Artwork Registry (index, the Interactive Gallery)
  /artworks/[slug]        Artwork record (provenance + statement + media)
/people                   Founding People & Legacy (all non-artist roles)
  /people/[slug]          Person profile (organizer, partner, panelist, crew…)
/library                  Documentary Library (long-form video)
/archive                  Video Archive + media (workshop clips, raw footage)
/blog                     Blog / Journal (incl. press coverage)
/research                 Research — citable records, downloads, methodology
/learn                    Learning Hub — upcycling as practice, for educators
/certificates             Certificates — public verification entry point
  /certificates/[id]      A single verifiable participant certificate
/partners                 Sponsors & Partners (Norway, Nike, NESREA…)
/press                    Press room (coverage, kit, contact)
/impact                   Impact Dashboard (waste diverted, people, reach)
/verify                   Future blockchain verification (stub now)
/community                Community / Join (apply for a chapter, contact)
```

## How the spaces relate (the graph)
Everything is cross-linked into one knowledge graph, not a tree:

- An **Artwork** links to its **Artist**, its **Chapter**, the **materials** it reclaimed, its **certificate**, and any **video** it appears in.
- An **Artist** links to their **Artwork(s)**, **statement/quote**, their **chapter**, their **certificate**, and their **role** in the performance if any.
- A **Person** (organizer/partner/panelist) links to their **role(s)**, **chapter**, **quotes**, **gallery**, and **partner organization**.
- A **Chapter** is the spine: it links to its **timeline events**, **people**, **artworks**, **partners**, **media**, and **press**.
- A **Certificate** links a **person/artist** ⇄ **chapter** ⇄ (future) **on-chain record**.

## Navigation model
- **Primary nav (always available):** Origin · Genesis Chapter · Artists · Artworks · Library · About/Partners.
- **The home experience is not the nav** — it is a guided scroll. Nav appears (fades in) only after the threshold sequence.
- **Footer = the institutional index:** every space, plus research, press, impact, certificates, accessibility, language.
- **Breadcrumbs everywhere below top level** — because researchers arrive deep via links and must always know where they stand.

## Priorities at launch
**Build first:** Home · Origin · Genesis Chapter (+ timeline) · Artist Registry · Artwork Registry · People · Partners · Certificates (verification).
**Build next:** Library · Archive · Blog/Press · Research · Learning Hub.
**Architect-only (stubs):** Chapter Network (multi-chapter) · Impact Dashboard · /verify (blockchain).
