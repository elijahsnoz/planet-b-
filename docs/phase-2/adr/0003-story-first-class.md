# ADR-0003 — Story as a first-class connective object

**Status:** Proposed

## Context

Phase 1 treated narrative as page content. Phase 2 makes **Stories the primary way to experience the archive** (Layer 1, the Experience): a feature on an artist, an exhibition write-up, a dispatch from a chapter, an essay that ties artworks, people, organizations, and events together. If a Story is just CMS body text, it cannot be queried, linked into the knowledge graph, versioned, governed, translated, or anchored — it is a dead end. The archive already has a polymorphic graph (`entity_links`) and a governance/soft-delete/audit convention shared by every cultural entity. Stories should be a peer of `artworks` and `people`, not a sibling of a marketing page.

## Decision

**Make Story a first-class connective object: a new `stories` table joined to everything via `entity_links`.**

- `stories` carries the standard `governance()` columns (`id`, `registry_id` = `PB-STORY-…`, `slug`, `status`, `verified`, audit/soft-delete) plus `title`, `subtitle`, `dek`, `body` (block JSON), `cover_media`, `chapter_id?`, `kind` (`feature | exhibition | profile | dispatch | essay`), `status`.
- Stories connect to any entity through **`entity_links`** using the controlled relations `features | mentions | belongs_to` (vocabulary governed by `relations`, [03](../03-knowledge-graph.md)).
- A Story therefore inherits the full institutional machinery for free: registry ID, draft→in_review→published→archived workflow, revisions, audit, soft-delete, i18n via `translations` ([ADR-0006](0006-i18n-strategy.md)), and (later) anchoring via `onchain_refs`.

## Consequences

- **Positive:** Stories are queryable, linkable graph citizens — "all stories that feature this artist," "the story this artwork belongs_to" — powering the Experience layer and the knowledge graph as one system.
- **Positive:** No new governance/versioning/translation machinery; Stories reuse exactly what cultural entities use, keeping the system uniform (no duplicated logic).
- **Negative / cost:** Editorial `body` is block JSON, which must be sanitized on render (XSS) and validated; richer than plain text to author and to migrate.
- **Negative:** Connecting via `entity_links` means a Story's relationships live outside the row, so reads that need them require graph joins.

## Alternatives considered

1. **Stories as CMS/Sanity pages only.** Rejected: not queryable, not graph-linkable, no shared governance/versioning — cannot be a primary archive surface.
2. **Reuse `timeline_events` for narrative.** Rejected: timeline events are chapter-scoped, ordered, fact-grain records, not authored long-form narrative with cover media and editorial kinds.
3. **Hard-code story↔entity links as foreign keys on `stories`.** Rejected: a Story relates to many entity *types*; the polymorphic `entity_links` graph already exists for exactly this, and FKs would not scale to new relations.
