# ADR-0011 — Knowledge graph as a core architectural principle

**Status:** Accepted

## Context

Planet B is not a collection of pages; it is a **connected graph**. An artwork means little without its artist, the chapter that exhibited it, the media that documents it, the certificate that honors it, and the stories that mention it. The founding law of the registry is *nothing exists in isolation* ([architecture/07 · Registry & Relationship Engine](../architecture/07-registry-and-relationships.md)) and Principle II (Genesis is sacred — connections are part of the record). The Phase 2 design re-states this as the third load-bearing evolution: **the knowledge graph is a core architectural principle, not a feature** ([00-README §Architectural evolution](../00-README.md)).

The mechanics already exist: the polymorphic `entity_links` edge table ([db/schema.ts](../../db/schema.ts)), a controlled `relations` vocabulary, and the query patterns in [03 · Knowledge Graph](../03-knowledge-graph.md). What this ADR settles is the *status* of the graph in the architecture — so it is treated as foundation that every domain participates in, rather than a bolt-on a single team owns. This decision pairs with [ADR-0009](0009-domain-driven-architecture.md) (domains own their entities) and depends on [ADR-0004](0004-repository-pattern.md) (graph access goes through repositories, never the raw driver).

```
   pages model (rejected)              graph model (this ADR)
   ┌────────┐ ┌────────┐               artwork ── created_by ──▶ artist
   │artwork │ │ artist │               artwork ── exhibited_in ─▶ chapter
   └────────┘ └────────┘               artwork ── documented_by ▶ media
   isolated records;                   certificate ── issued_to ─▶ person
   relationships are an                story ── mentions ───────▶ any
   afterthought                        nothing exists in isolation
```

## Decision

**The knowledge graph — `entity_links` governed by the controlled `relations` vocabulary — is a CORE architectural principle that every domain participates in.**

1. **Every domain is a graph participant.** Each of the 12 domains (Passport · Certificate · Artwork · Artist · Story · Chapter · Organization · Media · Registry · Verification · Blockchain · Impact) writes and reads relationships as part of its normal lifecycle. No domain is allowed to model itself as an island.
2. **A shared Graph capability owns traversal and edge-writing**, not each domain individually. The `graph.*` surface (`neighbors`, `path`, `related`) and edge mutation live in the shared kernel ([15 · Roadmap, Phase 2B](../15-implementation-roadmap.md)), behind the repository seam ([ADR-0004](0004-repository-pattern.md)). Domains call it; they do not hand-roll edge SQL.
3. **Edges are created and removed transactionally with the records they describe.** FK-backed relations (`created_by`, `exhibited_in`, `awarded`/`issued_to`, `measures`) are mirrored into `entity_links` **in the same transaction** as the owning record; the FK remains the source of truth and the mirror edge is the read-optimized graph projection. If the record write rolls back, its edges roll back with it ([03 §5.1](../03-knowledge-graph.md)).
4. **Soft-delete semantics apply to edges.** Nothing is hard-deleted — including relationships. `entity_links` gains `archived_at` (additive migration); retracting an edge sets `archived_at`, is audit-logged, and never deletes the row; re-asserting clears it while preserving the 5-tuple identity ([03 §5.2](../03-knowledge-graph.md), Principle II).
5. **The open graph is kept safe by the `relations` allow-list.** Edge writes are rejected unless the `relation` is a live (`active`) row and `(fromType → toType)` matches its declared signature, with both endpoints existing — the service-layer invariants of [03 §5.3](../03-knowledge-graph.md).
6. **The graph is design-stable across backbones.** Bounded recursive CTEs serve traversal on SQLite/Postgres today; the same `relations` vocabulary and `entity_links` shape map 1:1 onto a property-graph store later. Migration is a driver change behind the `graph.*` interface, not a remodeling ([03 §5.4](../03-knowledge-graph.md)).

## Consequences

- **Positive:** Discovery, provenance, the Passport projection ([ADR-0002](0002-passport-as-projection.md)), and Story "read next" ([ADR-0003](0003-story-first-class.md)) are all expressed as graph traversals over one uniform mechanism — *nothing exists in isolation* becomes mechanically true, not aspirational.
- **Positive:** One home for traversal and edge rules (the shared Graph capability) eliminates duplicated relationship logic across 12 domains and gives consistency invariants a single enforcement point.
- **Positive:** Soft-deleted edges preserve history — a mis-asserted or retracted connection remains a recorded fact, honoring Principle II and the audit trail.
- **Positive:** The graph survives a century of tooling change: same vocabulary on SQLite, Postgres recursive CTEs, or a dedicated graph engine.
- **Negative / cost:** Mirror edges can drift from their FKs; this mandates transactional writes plus a reconciliation job/test in CI ([15 · R-4](../15-implementation-roadmap.md)).
- **Negative / cost:** Deep traversal must always be bounded (depth cap + visited-set + `LIMIT`); unbounded "whole graph" reads are forbidden from the Experience layer.
- **Negative / cost:** Every domain now carries a graph responsibility, raising the bar for what "done" means in each domain service.

## Alternatives considered

1. **Graph as a feature (a module a single team owns).** Rejected: relationships are intrinsic to the meaning of every record; isolating the graph in one feature recreates the islands problem and lets other domains ignore connectivity. The graph must be a shared principle, not an owned feature.
2. **Adopt a dedicated graph database now (Neo4j / PG AGE / pgrouting).** Rejected for *now*: it adds operational weight before the scale that justifies it and risks the portable, century-readable SQLite archive ([ADR-0001](0001-data-backbone.md)). The `relations`/`entity_links` design is deliberately 1:1 with property-graph edges so this remains a clean, deferred driver swap rather than a rewrite.
3. **Pure relational foreign keys only (no `entity_links`).** Rejected: typed FKs guarantee integrity for the known core relations but cannot express the emergent long tail (`mentions`, `responds_to`, `same_series`, `cites`) without a schema migration per relation. The hybrid — FKs for integrity, `entity_links` for openness, mirror edges to unify traversal — keeps both safety and openness.
