# Planet B — Sanity (curatorial layer) groundwork

Per the Phase-1 decision, **Sanity** is the editorial/curatorial CMS and **Supabase/Postgres** is the system of record for identity, auth, and certificates ([docs/11](../docs/11-cms-structure.md)).

This folder is **groundwork**, not a running Studio. The schema files in `schemaTypes/` are plain,
framework-agnostic objects that mirror [docs/10 schema](../docs/10-database-schema.md) and the
[seed data](../data/genesis/). They are intentionally free of any `sanity` import so the Next.js
build stays clean before Sanity is installed.

## To stand up the Studio later
```sh
npm create sanity@latest -- --project <id> --dataset production
# then wrap each exported object with defineType() and register in sanity.config.ts:
#   import { chapter } from "./sanity/schemaTypes/chapter"
#   schema: { types: [chapter, person, artwork, timelineEvent, certificate, ...] }
```

## Editorial guardrails to enforce (validation) — from docs/11
- `consentStatus` must be `granted` before a person/artwork publishes (Principle IV).
- `alt` required on every image; `credit` + `source` required on media.
- Slugs lock after first publish (URL stability); versioning on (the archive shows its own history).
- The Genesis Chapter document is protected from deletion (Principle II).
