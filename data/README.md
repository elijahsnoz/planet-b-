# Planet B — Normalized Genesis Data

Structured, source-of-truth records for the **Genesis Chapter (Abuja 2026)**, normalized from the catalogue and plates into the shape defined by [docs/10-database-schema.md](../docs/10-database-schema.md). These JSON files are the **seed** for the database and CMS — human-readable now, machine-loadable later.

## Files
```
data/genesis/
  chapter.json          one chapter record (the Genesis Chapter)
  organizations.json    Royal Norwegian Embassy, Nike Art Foundation, partners, media, panel orgs
  people.json           every named contributor (artists, team, embassy, panel, performers)
  artworks.json         the founding artworks (14 confirmed + 1 intentionally pending)
  timeline.json         the immersive Genesis timeline phases
  panel.json            the panel discussion
  performance.json      Òdàlè Dà'lẹ̀
  press.json            press coverage
  founding-council.json the Founding Council (Principle V) — historical record
  certificates.json     certificate records to be issued (contribution-based)
```

## Conventions
- `slug` is the stable public identifier; never change it after publish.
- `consent_status`: `granted | pending | withheld`. Default **pending** — the catalogue is a published *source*, but explicit consent to publish a Planet B **profile** is tracked separately. No profile goes live on `pending`/`withheld` ([Principle IV](../docs/00-PRINCIPLES.md)).
- **Privacy:** the artists' personal phone numbers printed in the catalogue are **intentionally omitted** here. They are PII and require consent before entering project data.
- `verified`: `true` only for facts confirmed from the catalogue/plates. Unverified facts are marked and, where a record is unknown, left **intentionally incomplete** rather than guessed ([Principle VI](../docs/00-PRINCIPLES.md)).
- Roles are open-ended strings so a person's standing can grow without schema change (e.g. Elijah Snoz).

## Status
14 of 15 founding artists confirmed by plate. The **15th is intentionally incomplete** — see `artworks.json` → `_pending`.
