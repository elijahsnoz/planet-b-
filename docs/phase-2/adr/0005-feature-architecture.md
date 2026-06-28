# ADR-0005 — Feature-based architecture

**Status:** Superseded by [ADR-0009](0009-domain-driven-architecture.md) — Domain-Driven Architecture.

> This ADR's intent (cohesive modules instead of layer-first scatter, an incremental migration off `app`/`lib`, repositories as the persistence seam) is carried forward by [ADR-0009](0009-domain-driven-architecture.md). The change: the top-level unit is now a **business domain** (the institution's language), and the repository becomes an **implementation detail inside each domain** rather than a top-level concept. The `src/features/*` layout below is replaced by `src/domains/*` (+ `src/shared`, `src/platform`, `src/intelligence`). See [13 · Domain Architecture](../13-domain-architecture.md).

---

**(Original, superseded) Status:** Proposed

## Context

Phase 1 used the conventional Next.js layout: routes under `app/`, shared logic under `lib/`, types in `models/`. At Phase 1 scale this is fine. Phase 2 adds many cohesive domains — Passport, Stories, Certificates + claiming, Media/Assets, Blockchain, Verification, i18n — each with its own use-cases, validation, repositories, and UI. In a layer-first layout these spread thin across `app/`, `lib/`, and `components/`, so a single domain change touches many directories and the boundaries between domains blur. The Repository Pattern ([ADR-0004](0004-repository-pattern.md)) already wants a clear home for each domain's interfaces and services.

## Decision

**Adopt a feature-based architecture under `src/features/*`, migrating from the current `app`/`lib` layout.**

- Each domain is a self-contained module: `src/features/<domain>/` holding its use-cases/services, zod schemas, repository interfaces + implementations, view-models, and feature-local UI.
- Cross-feature code (truly shared primitives — auth, env, registry, audit) stays in a shared layer; domain logic does not.
- `app/` keeps only routing/composition (Server Components wire feature use-cases to pages and actions); `app/` does not hold business logic.
- The migration is **incremental**: new Phase 2 domains are born in `src/features/*`; existing Phase 1 code (`lib/auth.ts`, `lib/validation.ts`, admin actions) moves feature-by-feature, not in a big-bang rewrite.

## Consequences

- **Positive:** High cohesion, low coupling — a domain change lives in one folder; boundaries are explicit and reviewable; pairs naturally with the repository seam ([ADR-0004](0004-repository-pattern.md)).
- **Positive:** Features are independently testable and ownable; scales to the Phase 2 domain count without `lib/` becoming a junk drawer.
- **Negative / cost:** A transitional period where both layouts coexist; risk of confusion about where code belongs until the migration completes. Mitigated by a documented module convention and moving incrementally.
- **Negative:** Requires discipline on what is "shared" vs "feature" to avoid a new dumping ground.

## Alternatives considered

1. **Keep the layer-first `app`/`lib`/`components` layout.** Rejected: domain logic scatters across layers; cross-cutting edits touch many folders as the domain count grows.
2. **Big-bang refactor to `src/features/*` up front.** Rejected: high risk against a working Phase 1 app for no immediate user value; incremental migration captures the benefit safely.
3. **Group by technical type within `app/` (hooks/, services/, schemas/).** Rejected: still layer-first; same scatter problem at a smaller scale.
