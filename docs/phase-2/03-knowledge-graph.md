# 03 · Knowledge Graph Diagram

**Purpose.** Define Planet B as a single connected **knowledge graph** in which every cultural record — artists, artworks, chapters, events, partners, certificates, media, stories, timelines, impact — is a *node*, and every meaningful connection between them is a typed, weighted *edge* stored in the existing `entity_links` table. This artifact specifies the controlled **relation vocabulary** (the canon `relations` table), the node model, the query patterns the Experience layer needs, and the consistency rules that keep the graph trustworthy at archive scale. Its governing law: *nothing exists in isolation* — [architecture/07](../architecture/07-registry-and-relationships.md).

**Extends.** [docs/architecture/07 · Registry & Relationship Engine](../architecture/07-registry-and-relationships.md) (the `entity_links` polymorphic edge table and the `graph.*` service) and [db/schema.ts](../../db/schema.ts) (`entityLinks`). Adds the canon `relations` controlled-vocabulary table named in [00-README · New Phase 2 records](00-README.md). Obeys [00-PRINCIPLES](../00-PRINCIPLES.md): II (Genesis sacred — edges never deleted), IV (no one invisible — consent gates traversal output, not the edge), VI (accuracy — `verified`/`weight` carry confidence), VIII (a century of witnesses — recursive CTEs today, graph store later, same vocabulary).

---

## 1. The graph in one screen

Two complementary mechanisms already exist (architecture/07):

1. **Typed foreign keys** (integrity) — `artworks.artistId`, `artworks.chapterId`, `certificates.personId`, `timelineEvents.chapterId`, etc. They guarantee a record can never reference a missing entity, and they power the core UI.
2. **`entity_links`** (openness) — one polymorphic edge table for the long tail and emergent connections, so curators can connect *anything to anything* without a schema migration, kept safe by a relation allow-list.

This artifact governs mechanism (2). Every edge is the row:

```
entity_links(
  fromType, fromId,        -- source node  (type + registry/uuid id)
  relation,                -- a verb from the `relations` vocabulary
  toType,   toId,          -- target node
  weight,                  -- confidence / strength (default 1)
  metadata                 -- JSON: role, sortOrder, year, source, note...
)
-- uq_edge UNIQUE(fromType, fromId, relation, toType, toId)
-- ix_edge_from(fromType, fromId)  ·  ix_edge_to(toType, toId)
```

> Edge identity is the 5-tuple. `weight` and `metadata` are *attributes* of that edge, not part of its identity — re-asserting an edge updates them, it does not duplicate the edge.

### Node types (the vertices)

Every node is an existing record keyed by its permanent **Registry ID** (`PB-<KIND>-<NNNNNN>`). `fromType`/`toType` use the singular core-record name:

| Node type      | Backing table        | Registry kind        |
|----------------|----------------------|----------------------|
| `artist`/`person` | `people`          | `PB-ARTIST-*`        |
| `artwork`      | `artworks`           | `PB-ARTWORK-*`       |
| `chapter`      | `chapters`           | `PB-CHAPTER-*`       |
| `event`        | `timeline_events`    | `PB-EVENT-*`         |
| `organization` | `organizations`      | `PB-ORG-*`           |
| `certificate`  | `certificates`       | `PB-CERT-*`          |
| `media`/`asset`| `media` (+ `assets`) | `PB-MEDIA-*`         |
| `story`        | `stories`            | `PB-STORY-*`         |
| `research`     | `stories` (`kind=essay`) | `PB-STORY-*`     |
| `impact`       | `impact_metrics`     | —                    |
| `passport`     | `passports`          | `PB-ID-*`            |

---

## 2. The relation vocabulary (the canon `relations` table)

`relations` is the controlled allow-list for `entity_links.relation` ([00-README](00-README.md)). The service layer rejects any edge whose `relation` is not a live row here, and validates that `fromType → toType` matches the declared signature. This is what makes an open graph safe.

### `relations` table shape

```
relations(
  relation        TEXT PRIMARY KEY,   -- the verb, e.g. 'created'
  from_type       TEXT NOT NULL,      -- allowed source node type
  to_type         TEXT NOT NULL,      -- allowed target node type
  cardinality     TEXT NOT NULL,      -- 1:1 | 1:N | N:1 | N:N
  directionality  TEXT NOT NULL,      -- directed | symmetric
  inverse         TEXT,               -- the verb you traverse backwards
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'active'  -- active | deprecated
)
```

### Controlled verbs

| relation        | from → to                  | cardinality | directionality | inverse           |
|-----------------|----------------------------|-------------|----------------|-------------------|
| `created`       | artist → artwork           | 1:N         | directed       | `created_by`      |
| `created_by`    | artwork → artist           | N:1         | directed       | `created`         |
| `exhibited_in`  | artwork → chapter          | N:1         | directed       | `features`        |
| `features`      | chapter/story → artwork/artist | N:N     | directed       | `featured_in`     |
| `featured_in`   | artist/artwork → story/chapter | N:N     | directed       | `features`        |
| `partnered_with`| organization → chapter     | N:N         | directed       | `hosted_by` / `sponsored_by` |
| `hosted_by`     | chapter → organization     | N:N         | directed       | `partnered_with`  |
| `sponsored_by`  | chapter → organization     | N:N         | directed       | `partnered_with`  |
| `mentions`      | story → any                | N:N         | directed       | `mentioned_in`    |
| `belongs_to`    | story/event → chapter      | N:1         | directed       | `features`        |
| `mentored`      | person → person            | N:N         | directed       | `mentored_by`     |
| `mentored_by`   | person → person            | N:N         | directed       | `mentored`        |
| `awarded`       | certificate → person/org   | 1:1         | directed       | `issued_to` (inv.)|
| `issued_to`     | certificate → person/org   | 1:1         | directed       | `holds`           |
| `descends_from` | chapter → chapter          | N:1         | directed       | `gave_rise_to`    |
| `depicts`       | artwork/media → any        | N:N         | directed       | `depicted_in`     |
| `documented_by` | any → media                | N:N         | directed       | `documents`       |
| `photographed_by`| artwork/event/chapter → person | N:N    | directed       | `photographed`    |
| `measures`      | impact → chapter           | N:1         | directed       | `measured_by`     |
| `same_series`   | artwork → artwork          | N:N         | symmetric      | `same_series`     |
| `responds_to`   | artwork/story → artwork/chapter | N:N    | directed       | `responded_to_by` |
| `cites`         | story/research → story/research | N:N    | directed       | `cited_by`        |

Notes:
- **Symmetric** relations (`same_series`) store one row and traverse both directions; the service treats `from`↔`to` as interchangeable.
- **`awarded`/`issued_to`** are the graph projection of the FK `certificates.personId`/`organizationId`. The FK is the source of truth; the edge exists so a certificate is reachable in graph traversals (e.g. "this person's whole record"). See §5 on keeping them in lock-step.
- Backwards-compat: the architecture/07 starter verbs (`created_by`, `depicts`, `exhibited_in`, `featured_in`, `documented_by`, `hosted_by`, `sponsored_by`, `mentored_by`, `awarded`, `same_series`, `responds_to`, `cites`, `located_at`, `about`, `references`) are all retained as `active` rows — Phase 2 *adds* verbs, it does not rename existing ones.

---

## 3. The node graph — "nothing exists in isolation"

```
                                  ┌─────────────┐
                       measures   │   IMPACT    │
                  ┌──────────────▶│  (metrics)  │
                  │               └─────────────┘
                  │
            ┌───────────┐  hosted_by / sponsored_by  ┌───────────────┐
            │  CHAPTER  │◀──────────────────────────▶│  ORGANIZATION  │
            │ (Genesis) │        partnered_with       │ (gallery/embassy│
            └───────────┘                             │   /sponsor)    │
            ▲   ▲    ▲  │                              └───────────────┘
   exhibited_in│    │  │ belongs_to
            │   │    │  └──────────────┐
            │   │    │ descends_from   ▼
    ┌───────────┐│    │           ┌──────────┐  belongs_to   ┌──────────┐
    │  ARTWORK  ││    └──────────▶│  EVENT   │◀──────────────│ TIMELINE │
    └───────────┘│   (future ch.) │(timeline)│   (ordered)   └──────────┘
      ▲   │  │   │                └──────────┘
created │  │  │depicts                 │ documented_by
        │  │  │                        ▼
    ┌───────────┐  awarded /     ┌──────────┐   depicts / photographed_by
    │  ARTIST   │  issued_to     │  MEDIA   │◀───────────────────────────┐
    │ (person)  │───────────┐    │ (asset)  │                            │
    └───────────┘           │    └──────────┘                            │
      ▲   │  ▲              ▼         ▲                                   │
      │   │  │mentored ┌──────────────┐ documented_by                    │
      │   │  └─────────│ CERTIFICATE  │                                  │
      │   │            │ (PB-CERT-*)  │                                  │
      │   │            └──────────────┘                                  │
      │   │ features / featured_in                                       │
      │   ▼                                                              │
    ┌──────────────────────┐  mentions / cites / responds_to            │
    │  STORY / RESEARCH     │────────────────────────────────────────────┘
    │  (PB-STORY-*)         │
    └──────────────────────┘
              ▲
              │ projects (read-only)
    ┌──────────────────────┐
    │  PASSPORT (PB-ID-*)   │  ← the lifelong identity view over a person's
    │  see 04-passport-spec │     whole sub-graph (artworks, certs, events…)
    └──────────────────────┘
```

Every arrow is an `entity_links` row whose `relation` is a vocabulary verb. The **Passport** ([04](04-planet-passport-spec.md)) is not a separate cluster — it is a *projection* that walks a single person's neighborhood across all of these edges.

---

## 4. Graph query patterns the Experience needs

All four are served today by the existing `graph.*` service (architecture/07): `graph.neighbors(registryId, {relations?, depth, direction})`, `graph.path(a, b)`, `graph.related(registryId, type)`. Examples below are illustrative SQL over `entity_links`; in code they go through the repository (no direct ORM in features — [ADR-0004](adr/0004-repository-pattern.md)).

### 4.1 A person's whole life-record (powers the Passport + profile)

Walk every edge incident to a person, one hop, both directions:

```sql
-- "Everything connected to PB-ARTIST-000002"
SELECT relation, to_type, to_id, weight, metadata
FROM entity_links
WHERE from_type = 'artist' AND from_id = 'PB-ARTIST-000002'
UNION ALL
SELECT relation, from_type, from_id, weight, metadata
FROM entity_links
WHERE to_type   = 'artist' AND to_id   = 'PB-ARTIST-000002';
```

Traversal sketch:

```
PB-ARTIST-000002 (Ajayi Elijah Snoz)
  ├─ created ───────▶ PB-ARTWORK-000002  "The Watchful Eye"
  ├─ awarded ◀──────  PB-CERT-000002      (issued_to this person)
  ├─ featured_in ───▶ PB-STORY-000007     "Voices of Genesis"
  ├─ photographed ◀─  PB-EVENT-000011     opening night
  └─ mentored ──────▶ PB-ARTIST-000009
```

### 4.2 An artwork's provenance chain (recursive)

Follow `created_by → exhibited_in → documented_by → awarded → onchain` to assemble where a work came from, where it was shown, who shot it, and which certificate honors it:

```sql
WITH RECURSIVE provenance(from_type, from_id, relation, to_type, to_id, depth) AS (
  SELECT from_type, from_id, relation, to_type, to_id, 1
  FROM entity_links
  WHERE from_type = 'artwork' AND from_id = 'PB-ARTWORK-000002'
  UNION ALL
  SELECT e.from_type, e.from_id, e.relation, e.to_type, e.to_id, p.depth + 1
  FROM entity_links e
  JOIN provenance p
    ON e.from_type = p.to_type AND e.from_id = p.to_id
  WHERE p.depth < 4                      -- bounded depth (safety)
    AND e.relation IN ('created_by','exhibited_in','documented_by','depicts')
)
SELECT * FROM provenance;
```

```
PB-ARTWORK-000002
  └─created_by─▶ PB-ARTIST-000002
  └─exhibited_in─▶ PB-CHAPTER-000001 (Genesis / Abuja)
        └─hosted_by─▶ PB-ORG-000001 (Nike Art Gallery)
  └─documented_by─▶ PB-MEDIA-000044 (plate scan)
```

### 4.3 A chapter's full cast (typed slice)

```sql
-- Everyone and everything that belongs to the Genesis Chapter
SELECT relation, from_type, from_id
FROM entity_links
WHERE to_type = 'chapter' AND to_id = 'PB-CHAPTER-000001'
  AND relation IN ('exhibited_in','belongs_to','features','partnered_with');
```

Returns the artworks shown, artists featured, stories/events that belong, and partner orgs — the chapter's complete dramatis personae in one query.

### 4.4 Related stories (the Experience's "read next")

```sql
-- Stories that mention or cite the same nodes a given story touches (2-hop)
WITH seeds AS (
  SELECT to_type, to_id FROM entity_links
  WHERE from_type = 'story' AND from_id = 'PB-STORY-000007'
    AND relation IN ('features','mentions','cites','belongs_to')
)
SELECT DISTINCT e.from_id AS related_story
FROM entity_links e
JOIN seeds s ON e.to_type = s.to_type AND e.to_id = s.to_id
WHERE e.from_type = 'story' AND e.from_id <> 'PB-STORY-000007';
```

---

## 5. How the graph stays consistent

### 5.1 Edges are created/removed *transactionally* with records

Edges that mirror a typed FK (e.g. `created_by` for `artworks.artistId`, `awarded`/`issued_to` for `certificates.personId`, `exhibited_in` for `artworks.chapterId`) are written **in the same transaction** as the owning record, in the repository layer:

```
BEGIN
  INSERT artworks(..., artistId = P, chapterId = C)
  UPSERT entity_links (artwork A, created_by,   artist P)   -- mirror FK
  UPSERT entity_links (artwork A, exhibited_in, chapter C)  -- mirror FK
  INSERT audit_logs(action='artwork.create', after=...)
  INSERT revisions(entityType='artwork', snapshot=...)
COMMIT
```

If the record write rolls back, its edges roll back with it. The FK is always the **source of truth**; the mirror edge is a denormalized read-optimization for graph traversal. A consistency job (and an integration test) reconciles: *every FK has its mirror edge, and every mirror edge has its FK.*

### 5.2 Soft-delete semantics for edges (nothing is hard-deleted)

Per [00-README](00-README.md) and Principle II, **nothing is hard-deleted** — including edges.

- Today (`entity_links` has no `archived_at` column): when an entity is archived (`archivedAt` set), its edges are **retained**. Public traversal **hides** edges whose endpoint is archived (the service filters on the endpoint's `archivedAt IS NULL`), exactly as architecture/07 states ("archiving an entity keeps its edges but hides it from public traversal").
- **Recommended Phase 2 amendment** (open question A): add `archived_at` to `entity_links` so a *relationship* can be retracted (e.g. a mis-asserted `mentored` edge) without losing the historical fact that it once existed. Retraction sets `archived_at`; it is audit-logged; it never deletes the row. Curator-facing "remove connection" becomes a soft retraction.
- Re-asserting a retracted edge clears `archived_at` and updates `weight`/`metadata` — the 5-tuple identity is preserved, so history is continuous.

### 5.3 Validation invariants (enforced in the service layer)

1. `relation` MUST be a live (`status='active'`) row in `relations`.
2. `(fromType → toType)` MUST match that relation's signature.
3. Both endpoints MUST exist (FK-checked lookup) before the edge is written.
4. The `uq_edge` unique index prevents duplicate edges; writes are UPSERTs.
5. Symmetric relations are stored once and normalized (canonical ordering of endpoints) to avoid `(A,B)` and `(B,A)` duplicates.
6. Every edge write/retraction emits an `audit_logs` row.

### 5.4 Postgres now vs a graph store later (scale)

The graph is designed for **100+ countries, 500+ chapters, 50k+ artists, 250k+ artworks** ([00-README](00-README.md)).

| Concern            | Today — SQLite / Postgres                              | At scale — Postgres (Supabase)                          | Future — dedicated graph store        |
|--------------------|--------------------------------------------------------|---------------------------------------------------------|----------------------------------------|
| 1-hop adjacency    | `ix_edge_from` / `ix_edge_to` index scan              | same, trivially fast                                    | native adjacency                       |
| Deep traversal     | recursive CTE, bounded `depth`                          | recursive CTE, bounded `depth` + `LIMIT`                | native multi-hop / variable-length     |
| Shortest path      | bidirectional BFS in service, depth-capped             | `WITH RECURSIVE` + visited-set, depth-capped            | `shortestPath()` primitive             |
| Whole-graph reads  | fine at Genesis scale                                   | partition `entity_links` by `from_type`; covering idx   | offload analytics to graph engine      |

Migration is a **driver change, not a rewrite** ([ADR-0004](adr/0004-repository-pattern.md)): the `graph.*` interface is stable, so swapping the recursive-CTE implementation for a graph engine (or PG `pgrouting`/AGE) touches only the repository. The `relations` vocabulary and `entity_links` shape map 1:1 onto property-graph edges, so no remodeling is required.

**Safety rails for deep traversal:** every recursive query is bounded (`depth < N`), carries a visited-set to prevent cycles (e.g. `mentored` chains, `same_series` symmetry), and applies `LIMIT`. Unbounded "show me the whole graph" is never issued from the Experience layer.

---

## Open questions for approval

1. **Edge soft-delete (§5.2):** add `archived_at` to `entity_links` so relationships can be retracted without losing history? (Recommended — aligns with Principle II.) This is a small, additive, Postgres-ready migration.
2. **Mirror-edge policy:** confirm that FK-backed relations (`created_by`, `awarded`/`issued_to`, `exhibited_in`, `measures`) should be *auto-mirrored* into `entity_links` by the repository, vs. computed on read. (Auto-mirror is recommended for uniform graph traversal; the reconciliation job guarantees they never drift.)
3. **`relations` seed list:** approve the verb set in §2 as the initial controlled vocabulary, including the new Phase 2 verbs (`partnered_with`, `mentored`, `descends_from`, `issued_to`, `photographed_by`). New verbs are additive and require founder sign-off before becoming `active`.
4. **Default traversal depth + per-relation weights:** set the global recursive-CTE `depth` cap (proposed: 4 for provenance, 2 for related-stories) and whether `weight` should influence related-content ranking.
5. **`person` vs `artist` node type:** the registry uses `PB-ARTIST-*` for all people, but not every person is an artist. Confirm `entity_links.fromType`/`toType` uses `person` as the canonical node type with `artist` as a role expressed via `metadata`/`roles`, to avoid two names for one node.
