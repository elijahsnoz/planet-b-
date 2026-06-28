# ADR-0009 — Domain-Driven Architecture

**Status:** Accepted — **supersedes [ADR-0005](0005-feature-architecture.md)** (Feature-based architecture).

**Related:** strengthens [ADR-0004](0004-repository-pattern.md) (Repository Pattern); enables [ADR-0010](0010-intelligence-layer.md) (Intelligence Layer) and [ADR-0011](0011-knowledge-graph-core.md) (Knowledge graph as a core principle); honors [ADR-0001](0001-data-backbone.md) (design-for-Postgres, run-on-SQLite). Full map: [13 · Domain Architecture](../13-domain-architecture.md).

## Context

Phase 1 shipped on the conventional Next.js layout (`app/` + `lib/` + `models/`). [ADR-0005](0005-feature-architecture.md) proposed evolving to *feature folders* under `src/features/*` to fight the layer-first scatter as Phase 2 adds many cohesive areas (Passport, Stories, Certificates + claiming, Media, Blockchain, Verification, i18n). [ADR-0004](0004-repository-pattern.md) added the repository seam so business logic never imports Drizzle/SQLite directly, keeping the future Postgres migration a driver swap.

Two problems remained:

1. **"Feature" is not the institution's language.** A *feature* is a UI/delivery slice; the stable thing in Planet B is its **vocabulary** — Passport, Certificate, Story, Chapter, Registry, Verification, Provenance. The canon ([00-README.md](../00-README.md)) explicitly ratifies organizing the project around *the language of the institution, not the database*. Feature folders don't name those concepts; the database doesn't either (a "Passport" is a *projection* over `people`, `certificates`, `contributions`, and the graph — [ADR-0002](0002-passport-as-projection.md) — not the `passports` table).
2. **The repository was framed as a top-level concept.** [ADR-0004](0004-repository-pattern.md) and the Phase-1 [folder-architecture doc](../architecture/10-folder-architecture.md) place repositories at the top of the structure. That's the wrong altitude: the repository is *how* a domain persists, an implementation detail, not the organizing unit.

The founder has ratified a domain-driven evolution (canon § "Architectural evolution (Phase 2.1)"). This ADR records the structure and the dependency rules that make it enforceable.

## Decision

**Organize the codebase around business domains (the institution's language). Repositories remain mandatory but become an implementation detail inside each domain.**

1. **New code lives under `src/`** with path aliases `@domains/*` → `src/domains/*`, `@shared/*` → `src/shared/*`, `@platform/*` → `src/platform/*`, `@intelligence/*` → `src/intelligence/*`. The existing `@/*` → `./*` stays. The Next.js `app/` stays at the repo root and progressively delegates into domains.
2. **Twelve domains**, each named in the institution's vocabulary: **Passport, Certificate, Artwork, Artist, Story, Chapter, Organization, Media, Registry, Verification, Blockchain, Impact**. A physical table may serve several domains and a domain may span several tables; domains are *not* tables.
3. **Each domain has one standard internal layout:** `entities/` (domain types/aggregates), `<domain>.service.ts` (business rules/use-cases), `<domain>.repository.ts` (interface) + `<domain>.repository.sqlite.ts` (implementation — an implementation detail), `<domain>.validation.ts` (zod), `<domain>.api.ts` (server-action / route-handler adapters), `ui/` (where appropriate), and `index.ts` — **the domain's public contract, the only thing other code imports**.
4. **`src/shared/` is the shared kernel and depends on nothing:** `Result`/`Either`, the `DomainError` hierarchy, pagination, `Id`/`RegistryId`/`PassportId` value types, the base `Repository` interface, `Clock`, audit/preservation primitives, the knowledge-graph relation vocabulary, and a lightweight `DomainEvent`/`EventBus` contract.
5. **`src/platform/` is technical infrastructure behind interfaces and depends only on `@shared`:** `db` (Drizzle client — the only place that imports `db/client`), `storage` (`StorageService`), `blockchain` (`BlockchainService`), `search` (`SearchService`), `graph` (`GraphRepository` over `entity_links`), and `events` (in-process `EventBus`).
6. **`src/intelligence/` is the independent Intelligence Layer** — beside the domains, depending only on `@shared`, behind an `IntelligenceService` interface; nothing AI ships yet ([ADR-0010](0010-intelligence-layer.md)).
7. **Dependency rules (enforced by lint + review):**
   - A domain imports **only another domain's `index.ts`** — never its internals.
   - The shared kernel imports nothing but itself.
   - Platform imports only `@shared`; it never imports a domain.
   - A domain reaches the ORM only through its own `*.repository.sqlite.ts` via `@platform/db`; no business logic imports `db/client`.
   - `app/` is composition + thin adapters: routes/actions call domain **services** (never a repository, never the DB).
   - Cross-domain reads go through published contracts; side-effecting fan-out goes through **domain events**.
8. **The knowledge graph is owned by the shared/platform layer** (`@shared/graph` vocabulary + `@platform/graph` `GraphRepository`), so every domain can declare relations without owning `entity_links`, satisfying [ADR-0011](0011-knowledge-graph-core.md).
9. **Migration is incremental with back-compat re-export shims**, one domain at a time; **Registry is the reference domain, migrated first**. Each old `lib/*` file becomes a one-line re-export to its new domain home so `app/` keeps working until every caller is moved, then the shim is deleted. No big-bang rewrite.

## Consequences

**Positive**
- The directory tree reads like the institution; a contributor finds "Certificate" or "Passport" by name, not by guessing tables or layers.
- Boundaries are explicit and *mechanically enforceable* (one public `index.ts` per domain; lint rules on imports), so cross-domain coupling can't be written by accident.
- [ADR-0004](0004-repository-pattern.md) is strengthened, not lost: the repository interface/impl split lives inside each domain, so the [ADR-0001](0001-data-backbone.md) Postgres swap stays a driver change and services stay unit-testable against in-memory fakes.
- The Intelligence Layer and the knowledge graph slot in as first-class concerns ([ADR-0010](0010-intelligence-layer.md), [ADR-0011](0011-knowledge-graph-core.md)) without restructuring.
- Migration is safe: shims mean nothing breaks; PRs stay small and reversible.

**Negative / cost**
- More structure and ceremony than calling Drizzle inline — interfaces, services, `index.ts` contracts, and a tiny composition root per domain.
- A transitional period where `src/domains/*` and shimmed `lib/*` coexist; risk of a permanent dual layout if shims aren't deleted (mitigated by an explicit shim-removal deadline — open question #7 in [13](../13-domain-architecture.md)).
- Discipline required on what is "shared kernel" vs "platform" vs "domain" to avoid `@shared` becoming a new junk drawer; needs the dependency lint to hold the line.
- Picking domain boundaries for shared tables (Artist vs Passport over `people`) requires judgment and may need revisiting.

## Alternatives considered

1. **Keep feature folders ([ADR-0005](0005-feature-architecture.md)).** Rejected/superseded: "feature" is a delivery slice, not the institution's language; it doesn't name Passport/Certificate/Registry as the stable concepts and still implies the repository is a top-level idea. Domains capture the vocabulary the canon mandates.
2. **Keep the flat `app`/`lib`/`models` layout.** Rejected: domain logic scatters across layers; `lib/` becomes a junk drawer as the domain count grows; cross-cutting edits touch many folders. (This is the status quo we are leaving.)
3. **Full hexagonal / ports-and-adapters everywhere.** Rejected as the default: a ports/adapters ring around *every* domain (separate `ports/`, `adapters/`, `application/`, `domain/` folders per module) is more indirection than a century-archive team needs and slows delivery. We adopt the *useful* core of it — repository interfaces + platform service interfaces + a published contract — without the full ceremony in every domain. Domains that genuinely need multiple adapters (Blockchain, Storage, Intelligence) already get the ports/adapters shape via `@platform/*` interfaces.
4. **Big-bang refactor into `src/domains/*` up front.** Rejected: high risk against a working Phase 1 app for no immediate user value. Incremental migration with shims (Decision #9) captures the benefit safely.
