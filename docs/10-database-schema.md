# 10 · Database Schema

PostgreSQL via Supabase. Designed so the **Genesis Chapter is one row in a multi-chapter, multi-language, provenance-ready model** — nothing here assumes Abuja is the only chapter, and everything anticipates [13 blockchain](13-blockchain-strategy.md) and [14 certificates](14-certificate-system.md) without requiring them now.

## Conventions
- `uuid` primary keys (`id`), `slug` unique per entity for stable public URLs (citability).
- `created_at`, `updated_at` everywhere. Soft-delete via `archived_at` (we never hard-delete history).
- Media is referenced, not blobbed: rows point to storage/CDN keys + metadata.
- `consent_status` on people-bearing rows (`granted | pending | withheld`) gates publication.
- i18n: translatable text lives in `*_translations` tables keyed by `locale` (en first).

## Core entities

```
chapters
  id, slug, name ("Abuja"), city, country, status (genesis|active|planned),
  opened_on (2026-06-05), venue ("Nike Art Gallery, Abuja"),
  theme ("From Waste to Resource: Art that Changes Perspectives"),
  summary, hero_media_id, is_genesis (bool), created_at...

people                         -- ALL humans: artists, organizers, partners, crew, panelists
  id, slug, full_name, display_name, primary_role,   -- role enum is coarse; see roles join
  bio, short_bio, portrait_media_id, consent_status,
  contact_public (phone/email shown only if consented), socials jsonb, created_at...

roles                          -- a person can hold many roles in many chapters
  id, name ("Lead Facilitator","Ambassador","Panelist","Co-Performer","Photographer"...)
person_chapter_roles
  id, person_id, chapter_id, role_id, title_override, sort_order

organizations                  -- Royal Norwegian Embassy, Nike Art Foundation, NESREA,
  id, slug, name, type (embassy|gallery|foundation|ngo|company|govt|media),
  about, logo_media_id, website, created_at...
person_organizations
  id, person_id, organization_id, title
chapter_partners
  id, chapter_id, organization_id, partner_role (sponsor|host|media|partner), sort_order

artworks
  id, slug, title, artist_id (-> people), chapter_id,
  materials text[], medium ("Discarded items assemblage"),
  dimensions ("61cm x 61cm"), year (2026), statement (artist's words),
  primary_media_id, created_at...
artwork_media        (id, artwork_id, media_id, kind: plate|detail, sort_order)
materials            (id, name) ; artwork_materials (artwork_id, material_id)  -- normalized for the "reclaimed materials" index

media                          -- single registry for every asset
  id, kind (image|video|audio|pdf|doc), storage_key, mime, width, height,
  duration_s, alt_text, caption, credit ("Photo: Benjamin Oladapo"),
  source ("catalogue"|"edge media"|"NTA"|...), license, captions_vtt_key, created_at...

timeline_events                -- the immersive Genesis timeline
  id, chapter_id, sort_order, phase
  ("Preparation","Road Walk","Workshop","Creation","Installation",
   "Opening","Exhibition","Panel","Performance","Certificates","Media"),
  title, date, description, hero_media_id
event_media   (event_id, media_id, sort_order)
event_people  (event_id, person_id, role_note)

performances                   -- Òdàlè Dà'lẹ̀
  id, chapter_id, title, yoruba_title, description, curator_id (-> people),
  photo_credit, primary_media_id
performance_performers (performance_id, person_id, billing: lead|co_performer)

panels         (id, chapter_id, title, moderator_id, description)
panel_speakers (panel_id, person_id, sort_order)

press                          -- the blog/press record (3 URLs to start)
  id, chapter_id, outlet ("The Nation","Tribune","Punch"), title, url,
  published_on, excerpt, screenshot_media_id

posts                          -- blog / journal (CMS-authored, see Sanity option)
  id, slug, title, body, author_id, chapter_id?, cover_media_id, published_at

certificates                   -- see doc 14
  id, public_id ("PB-ABJ-2026-002"), person_id, chapter_id,
  role_at_issue, artwork_id?, issued_on, status (issued|revoked),
  verification_hash, soulbound_ref (nullable, filled when on-chain), pdf_media_id

impact_metrics                 -- for the dashboard (architected, light now)
  id, chapter_id, metric ("artists","artworks","waste_diverted_kg","press_mentions"),
  value, unit, as_of, source

founding_council               -- Principle V: a HISTORICAL record, not a governing body
  id, person_id (-> people), chapter_id (-> chapters, the chapter they helped establish),
  council_category (founding_artist | gallery_leadership | embassy_representative
                    | organizer | curator | key_collaborator),
  citation (one line: why they are foundational), inducted_on, sort_order,
  is_charter_member (bool, true for the Genesis cohort), notes
  -- expandable over time; future chapters add members; never deletes the Genesis cohort
```

## Relationships at a glance
- `chapter` 1—* `timeline_events`, `artworks`, `certificates`, `chapter_partners`, `press`.
- `person` *—* `chapter` via `person_chapter_roles` (multi-role, multi-chapter).
- `artwork` *—1 `person` (artist), *—* `materials`, 1—* `media`.
- `person`/`artwork`/`chapter` ⇄ `certificate` ⇄ (future) `soulbound_ref`.
- Everything publishable carries `consent_status` / `license` so we never publish without permission or attribution.

## Why this shape
- **People are first-class and reusable** — Yusuf Durodola is one `people` row with roles as facilitator, artist, panelist, and performer; no duplication.
- **Provenance-ready** — `certificates.verification_hash` + nullable `soulbound_ref` means we can mint later without migration.
- **Citable forever** — stable `slug`/`public_id`; soft-delete only.
- **Network-ready** — add a chapter = insert one `chapters` row; nothing is hardcoded to Abuja.
