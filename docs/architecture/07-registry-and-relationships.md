# 07 · Planet B Registry & Relationship Engine

Two institutional guarantees: **every object has a permanent identity**, and **nothing exists in isolation**.

## The Registry — permanent identifiers
Format: `PB-{TYPE}-{NNNNNN}` (zero-padded, grows past 6 digits naturally).

| Type | Prefix | Example |
|------|--------|---------|
| Artist / Person | `PB-ARTIST-` | `PB-ARTIST-000001` |
| Artwork | `PB-ARTWORK-` | `PB-ARTWORK-000001` |
| Chapter | `PB-CHAPTER-` | `PB-CHAPTER-000001` |
| Certificate | `PB-CERT-` | `PB-CERT-000001` |
| Organization | `PB-ORG-` | `PB-ORG-000001` |
| Event | `PB-EVENT-` | `PB-EVENT-000001` |
| Story | `PB-STORY-` | `PB-STORY-000001` |
| Media | `PB-MEDIA-` | `PB-MEDIA-000001` |

Rules:
- **Minted once** on insert (Postgres sequence + trigger, [03](03-supabase-schema.md)); **immutable** (a trigger blocks any change).
- **Decoupled from everything mutable** — separate from the uuid PK (internal) and the slug (URL, human-editable). A retitle changes the slug, never the registry ID.
- **The public citation key.** Certificates ([14 cert system](../14-certificate-system.md)), URLs, QR codes, API lookups, AI references, and the Sanity↔Supabase bridge all use it.
- **Cross-system stable.** Sanity references entities by registry ID; the certificate `PB-CERT-*` already follows this pattern (`PB-ABJ-2026-001` is the chapter-scoped human form; the global `PB-CERT-NNNNNN` is the registry form — both stored).

> Note: today's `data/genesis/certificates.json` uses the readable `PB-ABJ-2026-NNN` form. Migration keeps it as `human_id` and additionally mints the global `PB-CERT-NNNNNN` registry id. Both are permanent.

## The Relationship Engine — the knowledge graph
Planet B is a graph. Two complementary mechanisms:

1. **Typed joins (integrity):** FK join tables for well-known relations — `artwork.artist_id`, `person_chapter_roles`, `chapter_partners`, `artwork_media`, `panel_speakers`, `performance_performers`, `founding_council`. These enforce referential integrity and power the core UI.

2. **`entity_links` (openness):** one polymorphic edge table for the long tail and emergent connections:
```
(from_type, from_id, relation, to_type, to_id, weight, metadata)
```
Relations are a controlled vocabulary, e.g.:
```
depicts · created_by · exhibited_in · featured_in · about · references
sponsored_by · hosted_by · performed_in · documented_by · awarded
mentored_by · same_series · responds_to · located_at · cites
```

### The canonical graph (the brief's chain, realized)
```
ARTIST ──created_by──▶ ARTWORK ──depicts──▶ MEDIA
   │                      │
   │ awarded              │ exhibited_in
   ▼                      ▼
CERTIFICATE           CHAPTER ──hosted_by/sponsored_by──▶ ORGANIZATION
   │                      │
   │ documented_by        │ measures
   ▼                      ▼
 MEDIA                IMPACT_METRIC
ARTIST ──featured_in──▶ STORY ──references──▶ {ARTWORK, EVENT, RESEARCH}
EVENT (timeline) ──documented_by──▶ MEDIA ; ──about──▶ ARTWORK/ARTIST
```

### Why both?
Typed FKs guarantee a thing can't reference a missing artist. `entity_links` lets curators connect *anything to anything* (an artwork "responds_to" another chapter's work; a story "cites" research) without a schema migration per relation — exactly the "everything connects" mandate, kept safe by a relation allow-list and FK-checked endpoints in the service layer.

## Graph access (service layer)
```ts
graph.neighbors(registryId, { relations?, depth=1, direction='both' }) // adjacency
graph.path(fromRegistryId, toRegistryId)                              // shortest path
graph.related(registryId, 'artwork')                                  // typed slice
```
Backed by indexed `entity_links` queries (recursive CTE for depth > 1, bounded). Powers "related works", "people of this chapter", provenance trails, and AI traversal ([15](15-ai-and-blockchain-readiness.md)).

## Integrity guarantees
- Registry IDs never reused, never deleted (archived rows keep their ID forever).
- `entity_links` endpoints validate that both ends exist and the relation is in the vocabulary.
- Deleting is impossible; archiving an entity keeps its edges but hides it from public traversal.
