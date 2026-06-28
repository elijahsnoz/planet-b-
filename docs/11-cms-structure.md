# 11 · CMS Structure (Sanity)

Curators (not engineers) must be able to add an artist, an artwork, a chapter, or a timeline event — and preserve history — without touching code. Sanity Studio mirrors the [schema](10-database-schema.md).

> **Data ownership:** Supabase/Postgres is the system of record for relational + auth + certificates. Sanity is the **editorial/curatorial layer** for narrative content and media curation. Two viable patterns — decide at build time:
> 1. **Sanity-primary for content** (chapters, people, artworks, posts, timeline) synced/queried into the app; Supabase for auth, certificates, verification.
> 2. **Postgres-primary**, with a lightweight admin instead of Sanity.
> Recommendation: **Sanity for the archive's curatorial content** (rich editing, image pipeline, versioning) + Supabase for identity/certificates. The schema doc maps 1:1 so either works.

## Document types
- **chapter** — name, city, country, status, openedOn, venue, theme, summary (portable text), hero image, isGenesis, partners[] (→organization + role), gallery[].
- **person** — fullName, displayName, slug, roles[] (→role + chapter + title), bio (portable text), shortBio, portrait, consentStatus, contactPublic, socials, quotes[].
- **organization** — name, type, about, logo, website.
- **artwork** — title, slug, artist (→person), chapter (→chapter), medium, materials[], dimensions, year, statement (portable text), plate image, detail images[], appearsIn[] (→media/video).
- **timelineEvent** — chapter (→chapter), phase (predefined list), title, date, description, media[], people[].
- **performance** — title, yorubaTitle, description, curator (→person), performers[] (→person + billing), media[].
- **panel** — title, moderator (→person), speakers[] (→person), description.
- **post** (blog/journal) — title, slug, author (→person), cover, body (portable text), chapter?, publishedAt.
- **pressItem** — outlet, title, url, publishedOn, excerpt, screenshot.
- **media asset** — handled via Sanity's asset pipeline; require **alt + caption + credit + source + license** as mandatory fields (custom asset metadata).

## Editorial guardrails (validation)
- `consentStatus` must be `granted` before a person/artwork can be published.
- `alt` text required on every image (accessibility + archive integrity).
- `credit` + `source` required on media (e.g. *Photo: Benjamin Oladapo*; *Source: catalogue / Edge Media / NTA*).
- Slugs locked after first publish (URL stability); changing one creates a redirect, never a break.
- **Versioning on:** every edit is retained — the archive must show its own provenance.

## Roles in the Studio
- **Curator** — full content edit.
- **Contributor** — draft only, cannot publish.
- **Translator** — edit `*_translations` / localized fields only.
- **Viewer** — read (for partners/researchers reviewing pre-launch).

## Localization
Field-level i18n (start `en`; structure ready for additional languages, e.g. Norwegian for the embassy audience and Nigerian languages). Yoruba terms (*Òdàlè Dà'lẹ̀*, proverbs) stored with original + translation, never flattened.
