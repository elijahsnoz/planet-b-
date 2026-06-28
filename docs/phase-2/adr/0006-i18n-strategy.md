# ADR-0006 — Internationalization via `translations` overlay

**Status:** Proposed

## Context

Planet B is architected for 100+ countries. Content — story bodies, bios, captions, statements — will need to exist in many locales. Two structural options dominate: add per-locale columns/tables to every content table (e.g. `title_fr`, `title_yo`), or store translations separately. Per-locale columns force a schema change for every new language and bloat every table; they also make "which fields are translated, and are they current?" hard to answer. The archive's source of record is English (the catalogue, the Genesis material), and translations are *overlays* on that source, not co-equal forks — accuracy over completeness (Principle VI) means a missing translation must transparently fall back to the English source, never block publication.

## Decision

**Implement i18n via a single `translations` overlay table; English is the source, locales are overlays.**

- `translations` columns: `entity_type`, `entity_id`, `locale`, `field`, `value`, `status`. One row per translated field per locale.
- **English is the source of truth** stored on the base record; reading in a locale overlays any present `translations` rows and **falls back to English** for missing fields.
- Translations carry their own `status`, so a locale overlay can be drafted/reviewed/published independently of the source record, with the same workflow vocabulary.
- Adding a language is **data, not a migration** — no schema change, no new columns.

## Consequences

- **Positive:** New locales are zero-schema-change; every text field on any entity is translatable through one uniform mechanism; transparent English fallback respects Principle VI.
- **Positive:** Translation status is first-class and queryable ("what is untranslated/stale for French?").
- **Negative / cost:** Reads must join/merge overlays onto base rows; more query work and a caching concern at scale. Mitigated with per-locale materialized views post-Postgres.
- **Negative:** Field-level rows are verbose; bulk translation tooling must address `(entity_type, entity_id, field, locale)` correctly, and block JSON (`stories.body`) needs a field-addressing convention.

## Alternatives considered

1. **Per-locale columns on each table.** Rejected: schema change per language, table bloat, no per-translation status.
2. **A full duplicate row per locale (translated copy of the record).** Rejected: forks the source of truth, breaks the English-as-source/fallback model, and drifts (Principle VI violation).
3. **Translate only at the presentation layer (runtime MT).** Rejected: no editorial control, no review/status, not archival-quality for an institution.
