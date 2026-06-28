# ADR-0004 — Repository Pattern for storage independence

**Status:** Proposed

## Context

[ADR-0001](0001-data-backbone.md) commits to running on SQLite now and migrating to Postgres/Supabase later. That promise is only credible if the migration is a *driver change, not a rewrite*. Today, server actions and admin code import Drizzle and the SQLite client directly (e.g. `db.select().from(...)` in `lib/auth.ts`). If feature code keeps reaching into the ORM, every feature becomes coupled to SQLite semantics and the backbone swap touches the whole codebase. The same seam is what lets us unit-test features without a database and keep Postgres-only concerns (RLS, full-text search) out of business logic.

## Decision

**Adopt the Repository Pattern: features never import the DB driver.**

- Every storage need is expressed as a **repository interface** (e.g. `PeopleRepository`, `StoryRepository`, `CertificateRepository`) returning typed view-models from [models/index.ts](../../models/index.ts) — never raw rows.
- Concrete implementations (a Drizzle/SQLite repository now, a Supabase/Postgres repository later) live behind those interfaces; the service/use-case layer depends only on the interface.
- **Business logic, server actions, and feature modules must not import Drizzle, the SQLite client, or the Supabase client.** Driver imports are confined to the repository implementations.
- The repository is where storage-specific behavior is encapsulated: registry-ID minting, soft-delete, audit/revision writes, and (post-migration) RLS-aware queries.

## Consequences

- **Positive:** The Postgres migration becomes swapping one set of repository implementations for another — the design-for-Postgres promise of [ADR-0001](0001-data-backbone.md) is mechanically enforced.
- **Positive:** Features are unit-testable with in-memory/fake repositories; no DB needed for most tests.
- **Positive:** Cross-cutting concerns (audit, soft-delete, consent filtering) have one home, reducing duplicated logic.
- **Negative / cost:** More indirection and boilerplate (interfaces + implementations) than calling Drizzle inline; a real upfront cost for small queries.
- **Negative:** A leaky repository (returning ORM rows, or exposing driver types) silently defeats the pattern; needs a lint/review rule that bans driver imports outside `repositories/`.

## Alternatives considered

1. **Call Drizzle directly in features (status quo).** Rejected: couples every feature to SQLite and makes the [ADR-0001](0001-data-backbone.md) migration a rewrite.
2. **A thin generic DAO / active-record per table.** Rejected: leaks table shape and driver semantics into callers; doesn't isolate Postgres-only concerns.
3. **Wait and refactor at migration time.** Rejected: the coupling compounds with every Phase 2 feature; the seam is cheapest to install before the new tables land.
