# Phase 2 · The Digital Institution — Design Package

> **Status: DESIGN — awaiting approval. No feature code ships from this package until the founder approves.**
> This package *extends* the Phase 1 founding documents. It never overwrites them. Where a Phase 1 doc already covers something ([docs/architecture/](../architecture/), [docs/experience/](../experience/), [docs/10-database-schema.md](../10-database-schema.md), [13](../13-blockchain-strategy.md), [14](../14-certificate-system.md)), Phase 2 references and amends it rather than restating it.

Read [docs/00-PRINCIPLES.md](../00-PRINCIPLES.md) first — it is the constitution and overrides everything here.

---

## What Phase 2 is

Phase 1 preserved the Genesis Chapter and shipped a beautiful, navigable archive on a portable SQLite file. Phase 2 turns that archive into an **institution**: lifelong contributor identities (the Planet Passport), a first-class Story layer, a connected knowledge graph, a digital asset library, a certificate verification + claim workflow, and a blockchain abstraction that is designed now and implemented later (Solana-first). It is architected for **100+ countries, 500+ chapters, 50,000+ artists, 250,000+ artworks** without a rewrite.

**Final test for every artifact and every future line of code:** *Will this help preserve the history, credibility, and future of the Planet B movement?* If not, redesign it.

---

## The three layers (the institution)

| Layer | Name | Contains | Phase 2 focus |
|-------|------|----------|---------------|
| 1 | **The Experience** | visitors, artists, researchers, sponsors, museums, embassies, students | Stories as the primary way to experience the archive; the Eye as navigation + seal |
| 2 | **The Platform** | Next.js · Supabase (Postgres + Auth + Storage) · Sanity · search · admin · API | **domain-driven modules**; repositories as implementation details; design-for-Postgres |
| 3 | **The Trust Layer** | Planet Registry · Certificates · Digital Identity · Blockchain · Verification · Provenance · Audit Trail | Passport, verification/claim flow, `BlockchainService` abstraction |

…with one **cross-cutting layer** that is independent of all three:

| Layer | Name | Contains | Phase 2 focus |
|-------|------|----------|---------------|
| ✦ | **The Intelligence Layer** | semantic search · embeddings · OCR · metadata extraction · recommendations · AI curation · translation · accessibility · impact analytics · archive exploration · curator assistant | **designed now, implemented later** — `IntelligenceService` abstraction, no AI shipped yet ([14](14-intelligence-layer.md), [ADR-0010](adr/0010-intelligence-layer.md)) |

`Technology serves memory. Technology serves trust. Technology serves people.`

---

## Architectural evolution (Phase 2.1 — ratified by the founder)

After review, Planet B's architecture evolves in three load-bearing ways. These supersede the corresponding earlier framing and govern all implementation:

1. **Domain-Driven Architecture replaces feature-folder/repository-centric structure.** The project is organized around the **language of the institution** — business domains, not the database. Each domain (Passport · Certificate · Artwork · Artist · Story · Chapter · Organization · Media · Registry · Verification · Blockchain · Impact) owns its entities, services, repositories, validation, business rules, API handlers, and (where appropriate) UI. **Repositories remain essential but become an implementation detail inside each domain**, not the top-level structure. See [13 · Domain Architecture](13-domain-architecture.md) and [ADR-0009](adr/0009-domain-driven-architecture.md) (which supersedes [ADR-0005](adr/0005-feature-architecture.md)).
2. **The Intelligence Layer is a first-class, independent layer.** It sits beside the application (never inside it) behind an `IntelligenceService` abstraction so semantic search, embeddings, OCR, translation, recommendations, and curator-assistance can be added **without restructuring the platform**. Nothing AI ships yet. See [14 · Intelligence Layer](14-intelligence-layer.md) and [ADR-0010](adr/0010-intelligence-layer.md).
3. **The knowledge graph is a core architectural principle**, not a feature. Every record is discoverable through relationships; nothing exists in isolation. The graph ([03](03-knowledge-graph.md)) is woven into every domain. See [ADR-0011](adr/0011-knowledge-graph-core.md).

**Build infrastructure before features.** Implementation proceeds **foundation outward** — domain architecture, database, admin foundation, APIs, media infrastructure, registry, auth, permissions, audit, storage abstraction, blockchain abstraction, intelligence interfaces — *before* expanding the public experience. See [15 · Implementation Roadmap](15-implementation-roadmap.md).

---

## Backbone decision (locked for this package)

**Design for Postgres/Supabase; keep SQLite running now.** See [ADR-0001](adr/0001-data-backbone.md).

- The **portable SQLite archive** (`db/planet-b.db`) remains the working backbone through Phase 2 development. It is the inheritable, century-readable file.
- All Phase 2 schema is authored to be **Postgres-ready**: every new table maps 1:1 to a Supabase/Postgres table, and we adopt a **Repository Pattern** ([ADR-0004](adr/0004-repository-pattern.md)) so business logic never imports Drizzle/SQLite or Supabase directly. Swapping the backbone becomes a driver change, not a rewrite.
- Supabase Auth/Storage/RLS and Postgres full-text search are **designed** in these docs and **adopted when the migration is approved** — not before.

---

## Canonical vocabulary (every artifact MUST use these exact names)

### Identifiers
- **Registry ID** — `PB-<KIND>-<NNNNNN>`, minted atomically and permanent ([lib/registry.ts](../../lib/registry.ts), `registry_counters`). Kinds: `artist`, `artwork`, `chapter`, `cert`, `org`, `event`, `story`, `media`, **`id`** (Passport), **`asset`** (alias of media where useful), **`anchor`** (chain batch).
- **Passport ID** — `PB-ID-<NNNNNN>` (e.g. `PB-ID-000001`). The lifelong identity number. One per `people` row that represents a real contributor.
- **Certificate Public ID** — `PB-<CHAPTER>-<YEAR>-<NNN>` (e.g. `PB-ABJ-2026-002`). Never changes. Permalink `/certificates/{publicId}`.

### Core records (existing — do not rename)
`chapters · people · organizations · artworks · media · timeline_events · certificates · entity_links · impact_metrics · press · founding_council` plus RBAC (`users · roles · permissions · role_permissions · user_roles · sessions`) and governance (`audit_logs · revisions · registry_counters`). Full definitions: [db/schema.ts](../../db/schema.ts), [models/index.ts](../../models/index.ts).

### New Phase 2 records (additive — designed Postgres-ready, mirrored in SQLite)
- **`passports`** — projection/extension of `people`: `passport_id (PB-ID-…)`, `country`, `passport_status` (`unclaimed | claimed | linked`), aggregation is computed from graph + certificates (not duplicated). A Passport is **not** a user account.
- **`passport_claims`** — links a `users` account ⇆ a `people`/passport (a living contributor claiming their identity); fields: user, person, status (`pending | approved | rejected`), evidence, reviewer, decided_at.
- **`stories`** — first-class narrative: `governance()` columns + `title`, `subtitle`, `dek`, `body` (block JSON), `cover_media`, `chapter_id?`, `kind` (`feature | exhibition | profile | dispatch | essay`), `status`. Connected to everything via `entity_links` (`relation = 'features' | 'mentions' | 'belongs_to'`).
- **`contributions`** — life-events that grow a Passport over time: `person_id`, `kind` (`exhibition | award | mentorship | interview | research | talk | residency | role_change`), `title`, `occurred_on`, `chapter_id?`, `source`, `verified`. (Aggregated onto the Passport; certificates and artworks remain their own tables and are joined in.)
- **`assets`** — NOT a new table. "Assets" is the Digital Asset Management *lens* over the existing `media` table (see [09](09-media-management-strategy.md)), which we **extend** with `usage_rights`, `rights_holder`, `derivative_of`, `variant`. We extend `media`; we never fork it.
- **`claim_requests`** — certificate verification/claim workflow ([05](05-certificate-verification-spec.md)): uploaded file ref, OCR text, parsed fields, `matched_certificate_id?`, `confidence`, `status` (`uploaded | ocr_done | matched | needs_review | claimed | rejected`), `submitted_by`, `reviewer`.
- **`chain_anchors`** — Merkle batch anchoring ([06](06-solana-integration-plan.md)): `anchor_id (PB-ANCHOR-…)`, `merkle_root`, `member_count`, `provider`, `tx_ref`, `anchored_at`, `status`.
- **`onchain_refs`** — generic on-chain pointer for any entity: `entity_type`, `entity_id`, `provider`, `token_ref`, `kind` (`sbt | anchor | attestation`), `minted_at` (the typed home for `certificates.soulbound_ref` generalized to artworks/chapters).
- **`verification_events`** — append-only log of every verify/claim/anchor/mint action (feeds the audit trail and `/verify`).
- **`translations`** — i18n: `entity_type`, `entity_id`, `locale`, `field`, `value`, `status`. English is the source; locales are overlays ([ADR-0006](adr/0006-i18n-strategy.md)).
- **`relations`** — controlled vocabulary for `entity_links.relation` (see [03](03-knowledge-graph.md)).

### Workflow + states (do not invent new enums)
- Lifecycle `status`: `draft → in_review → published → archived` (already on `governance()`). Approval workflow uses these transitions + `audit_logs` + an optional `assigned_to`/`review_requests` (see [08](08-admin-wireframes.md)).
- `consent_status`: `granted | pending | withheld` (gates publication of people, Principle IV).
- `certificate.status`: `draft | issued | revoked | reserved`. Revocation is a status, never a delete.
- **Nothing is hard-deleted.** Soft-delete via `archived_at`; every write is audit-logged and snapshotted to `revisions`.

---

## Cross-cutting engineering principles (every artifact assumes these)

Strict TypeScript · **Domain-Driven design** (`src/domains/*` organized by the institution's language, see [ADR-0009](adr/0009-domain-driven-architecture.md)) · **Repository Pattern as an implementation detail inside each domain** (no direct ORM leaks out of a domain) · an **independent Intelligence Layer** ([ADR-0010](adr/0010-intelligence-layer.md)) · the **knowledge graph as a core principle** ([ADR-0011](adr/0011-knowledge-graph-core.md)) · Server Components by default · zod validation at every boundary · RBAC + RLS-ready authorization · digital-preservation by default (provenance · version history · audit trail · soft-delete · restore · archival integrity) · testing (unit + integration + e2e) · accessibility (WCAG AA in admin, museum-grade public) · internationalization · documentation + ADRs · **no hardcoded content** · **no duplicated logic** · everything configurable, everything maintainable. **Build infrastructure before features.** Architecture before animation; meaning before motion; story before effects.

---

## The 12 artifacts (this package)

| # | Artifact | File | Extends (Phase 1) |
|---|----------|------|-------------------|
| 1 | System Architecture Diagram | [01-system-architecture.md](01-system-architecture.md) | architecture/01, /11 |
| 2 | Database ERD | [02-database-erd.md](02-database-erd.md) | architecture/02, /03; db/schema.ts |
| 3 | Knowledge Graph Diagram | [03-knowledge-graph.md](03-knowledge-graph.md) | architecture/07 |
| 4 | Planet Passport Specification | [04-planet-passport-spec.md](04-planet-passport-spec.md) | 14; models Person |
| 5 | Certificate Verification Specification | [05-certificate-verification-spec.md](05-certificate-verification-spec.md) | 14 |
| 6 | Solana Integration Plan | [06-solana-integration-plan.md](06-solana-integration-plan.md) | 13; architecture/15 |
| 7 | Blockchain Abstraction Interface | [07-blockchain-abstraction-interface.md](07-blockchain-abstraction-interface.md) | 13; architecture/15 |
| 8 | Admin Dashboard Wireframes | [08-admin-wireframes.md](08-admin-wireframes.md) | architecture/08 |
| 9 | Media Management Strategy | [09-media-management-strategy.md](09-media-management-strategy.md) | architecture/05 |
| 10 | API Design | [10-api-design.md](10-api-design.md) | architecture/09 |
| 11 | Security Review | [11-security-review.md](11-security-review.md) | architecture/14 |
| 12 | Architecture Decision Records | [adr/](adr/) | — |
| 13 | **Domain Architecture (DDD)** | [13-domain-architecture.md](13-domain-architecture.md) | architecture/10; supersedes feature-folder framing |
| 14 | **Intelligence Layer** | [14-intelligence-layer.md](14-intelligence-layer.md) | architecture/15 |
| 15 | **Implementation Roadmap (foundation-outward)** | [15-implementation-roadmap.md](15-implementation-roadmap.md) | architecture/00; docs/16 |

### ADR index
- [ADR-0001 — Data backbone: design-for-Postgres, run-on-SQLite](adr/0001-data-backbone.md)
- [ADR-0002 — Planet Passport as identity projection (not a user account)](adr/0002-passport-as-projection.md)
- [ADR-0003 — Story as a first-class connective object](adr/0003-story-first-class.md)
- [ADR-0004 — Repository Pattern for storage independence](adr/0004-repository-pattern.md)
- [ADR-0005 — Feature-based architecture](adr/0005-feature-architecture.md) *(superseded by ADR-0009)*
- [ADR-0006 — Internationalization via translations overlay](adr/0006-i18n-strategy.md)
- [ADR-0007 — Blockchain abstraction, Solana-first, custody-optional](adr/0007-blockchain-abstraction.md)
- [ADR-0008 — Certificate claiming via OCR + human review](adr/0008-certificate-claiming.md)
- [ADR-0009 — Domain-Driven Architecture](adr/0009-domain-driven-architecture.md) *(supersedes ADR-0005)*
- [ADR-0010 — Intelligence Layer as an independent abstraction](adr/0010-intelligence-layer.md)
- [ADR-0011 — Knowledge graph as a core architectural principle](adr/0011-knowledge-graph-core.md)

---

## Reconciliations needed before any build (raised by the design pass)

These are small, known gaps the design surfaced. None blocks review; each must be resolved (and approved) before the corresponding implementation. **No code changes have been made** — these are recorded here, not yet applied.

1. **`registry_counters.kind` comment is stale.** The new kinds `id` (Passport), `asset`, `anchor` (and `story`) must be addable. The minting function ([lib/registry.ts](../../lib/registry.ts)) is kind-agnostic so it already works; only the schema comment needs updating at build time.
2. **`MediaKind` drift.** [models/index.ts](../../models/index.ts) uses `image|video|audio|pdf|doc`; [db/schema.ts](../../db/schema.ts) `media.kind` uses `image|video|audio|document`. Pick one canonical vocabulary when DAM ([09](09-media-management-strategy.md)) is built. The docs follow the schema (`document`).
3. **`entity_links` has no `archived_at`.** "Nothing is hard-deleted" implies edges should soft-delete too. Add `archived_at` to `entity_links` as an additive migration ([03](03-knowledge-graph.md)).
4. **`people` has no `country`.** The Passport requires Country; it lives on `passports.country` ([04](04-planet-passport-spec.md)), not `people`.
5. **`assets` is an extension of `media`, not a separate table** (see the New Records note above). Decide: extend `media` with 4 columns vs a 1:1 `media_id`-keyed side table.
6. **Genesis Collection = 14 issued certificates + a reserved 15th.** The brief says "the 14 founding certificates"; Phase 1 says "15 founders." These reconcile: **14 certificates issued**, the **15th artist intentionally reserved** (Principle VI). The 15th gets **no** pre-minted `PB-ID` (a reserved number could imply a known person). Confirm.
7. **Canonical node type is `person`, role `artist`** — not every person is an artist; the registry's `PB-ARTIST-*` prefix is a legacy detail, not a second node type ([03](03-knowledge-graph.md)).
8. **`onchain_refs` is the source of truth**; `certificates.soulbound_ref` becomes a kept-in-sync convenience pointer ([06](06-solana-integration-plan.md), [07](07-blockchain-abstraction-interface.md)).

## How to read this package

1. This README (the canon) → 2. ADRs (the decisions) → 3. Artifacts 1–11 (the specifications).
Every artifact opens with a one-paragraph **Purpose**, states **what it extends**, and ends with **open questions for approval**. Diagrams are ASCII/Mermaid so they survive a century of tooling changes.
