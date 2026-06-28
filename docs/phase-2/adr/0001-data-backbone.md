# ADR-0001 — Data backbone: design-for-Postgres, run-on-SQLite

**Status:** Proposed

## Context

Phase 1 shipped the Genesis Chapter on a single portable SQLite file (`db/planet-b.db`) accessed through Drizzle ORM. SQLite gives Planet B a century-readable, inheritable, zero-infrastructure archive — a file you can hand to a successor. Phase 2 must scale the *institution* to 100+ countries, 500+ chapters, 50,000+ artists, and 250,000+ artworks, and wants Supabase capabilities (Auth, Storage, Postgres RLS, full-text search). The naive moves are both wrong: migrating to Postgres now adds operational weight before it is needed and risks the portable archive; staying on SQLite forever forecloses RLS and managed Auth/Storage. We need to commit to Postgres *as a design target* without paying for it yet.

## Decision

**Design for Postgres/Supabase; keep SQLite running now.** This is the locked backbone decision for the Phase 2 package.

- The portable **SQLite archive remains the working backbone** through Phase 2 development and stays the inheritable, century-readable file.
- **Drizzle stays the ORM.** All Phase 2 schema is authored **Postgres-ready**: every new table (`passports`, `passport_claims`, `stories`, `contributions`, `assets`, `claim_requests`, `chain_anchors`, `onchain_refs`, `verification_events`, `translations`, `relations`) maps 1:1 to a Supabase/Postgres table and is mirrored in SQLite.
- **Migration is deferred.** Supabase Auth/Storage/RLS and Postgres full-text search are *designed* in this package and *adopted only when the migration is approved* — not before.
- The migration is made a driver change, not a rewrite, by adopting the **Repository Pattern** ([ADR-0004](0004-repository-pattern.md)) so business logic never imports Drizzle/SQLite or Supabase directly.

## Consequences

- **Positive:** The portable archive is preserved as the cornerstone; no premature infrastructure; the schema is future-proof; swapping backbones later is a bounded, planned change behind the repository seam.
- **Positive:** RLS, consent gating, and managed Auth are *designed now* (see [11 · Security Review](../11-security-review.md)) so the migration inherits a finished security model.
- **Negative / cost:** We must avoid SQLite-specific patterns that have no Postgres analogue (no sequences → registry IDs minted via `registry_counters`; booleans as 0/1; ISO-text timestamps). RLS and full-text search cannot be *enforced* until migration — until then authorization is app-layer only ([F-1](../11-security-review.md), [F-5](../11-security-review.md)).
- **Negative:** Two dialects to keep in step; schema changes must be validated against both. Mitigated by Drizzle migrations and CI checks.

## Alternatives considered

1. **Migrate to Postgres/Supabase now.** Rejected: adds operational burden and migration risk before the scale that justifies it, and risks the portable archive that is a founding principle.
2. **Stay on SQLite indefinitely.** Rejected: forecloses RLS, managed Auth/Storage, and concurrent write scale needed at 500+ chapters.
3. **Dual-write to both backbones at runtime.** Rejected: doubles failure modes and consistency bugs for no Phase 2 benefit; the repository seam already makes the eventual swap cheap.
