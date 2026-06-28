# 10 · Folder Architecture (feature-based, repository pattern)

Enterprise standards: **feature-based modules**, **strict TypeScript**, **repository pattern**, **no hardcoded values**, **no duplicated logic**, **no tightly coupled modules**. A future contributor should find everything about "artworks" in one place.

## Monorepo (pnpm/turbo workspaces)
A monorepo lets the public site, admin, and shared logic evolve together with one type system.
```
planet-b/
├─ apps/
│  ├─ web/                 # public website (Next.js)            → consumes packages/*
│  └─ admin/               # admin console (Next.js)             → consumes packages/*
├─ packages/
│  ├─ core/                # framework-agnostic domain
│  │  ├─ domain/           # entities, value objects (models/ moves here)
│  │  ├─ repositories/     # INTERFACES only (ArtworkRepository, …)
│  │  ├─ services/         # use-cases (IssueCertificate, PublishArtwork, GraphService)
│  │  ├─ validation/       # zod schemas (shared by API, forms, OpenAPI)
│  │  ├─ errors/           # typed error hierarchy
│  │  └─ events/           # domain events
│  ├─ data-supabase/       # SupabaseRepository implementations (adapters)
│  ├─ data-sanity/         # SanityRepository implementations (adapters)
│  ├─ data-json/           # JsonRepository (current seed) — the dev/fallback adapter
│  ├─ api-client/          # generated typed client from OpenAPI
│  ├─ ui/                  # design-system components (tokens-driven, RegistryGrid, …)
│  ├─ config/              # env loading + validation (zod), feature flags
│  └─ tsconfig / eslint /  # shared configs
├─ supabase/               # migrations/, seed/, policies/, functions/ (edge)
├─ sanity/                 # studio + schemaTypes/ (already started)
├─ data/ archive/ docs/    # existing: seed, masters, architecture & strategy docs
└─ tokens/                 # design tokens (source of truth)
```
> The current single app becomes `apps/web`; `components/` → `packages/ui`; `lib/data.ts` → `packages/core/repositories` (interface) + `packages/data-json` (impl). Additive migration; pages keep their imports via `@planetb/*` aliases.

## The repository pattern (replaceable backends)
```ts
// packages/core/repositories/artwork.repository.ts  (INTERFACE — depended upon)
export interface ArtworkRepository {
  byRegistryId(id: RegistryId): Promise<Artwork | null>;
  list(q: ArtworkQuery): Promise<Page<Artwork>>;
  create(input: NewArtwork, ctx: AuthCtx): Promise<Artwork>;
  update(id: RegistryId, patch: ArtworkPatch, ctx: AuthCtx): Promise<Artwork>;
  archive(id: RegistryId, ctx: AuthCtx): Promise<void>;   // never delete
  restore(id: RegistryId, ctx: AuthCtx): Promise<void>;
  revisions(id: RegistryId): Promise<Revision[]>;
}
```
```ts
// packages/data-supabase/artwork.repository.ts  (IMPLEMENTATION — swappable)
export class SupabaseArtworkRepository implements ArtworkRepository { /* … */ }
```
Services depend on the **interface**, never on Supabase/Sanity directly (**dependency injection** via a small composition root in `packages/config`). Swapping data sources, adding caching, or sharding = a new adapter. **Use-cases never change.**

## Feature slice (inside an app)
```
apps/admin/features/artworks/
├─ components/      # ArtworkTable, ArtworkEditor, RelationshipsTab …
├─ hooks/          # useArtworks, useArtworkMutations
├─ schema.ts       # re-exports core/validation zod
├─ routes.ts       # module routes
└─ index.ts        # public surface of the feature
```
Cross-feature reuse goes to `packages/ui` or `packages/core` — **never** feature→feature imports (prevents coupling). Lint rule enforces it.

## Conventions (enforced, not aspirational)
- **Strict TS** (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`); no `any` (lint error).
- **No hardcoded values** — content from backend; constants from `packages/config`; design values from `tokens/`.
- **Validation at every boundary** — one zod schema reused for API input, form, and OpenAPI.
- **Errors are typed** and mapped to RFC-7807 at the API edge.
- **Server/client split** explicit; secrets only in server modules.
- **Conventional Commits** + changesets for versioned packages; PR template references the architecture doc a change touches.
- **Path aliases** `@planetb/core`, `@planetb/ui`, … (no deep relative imports).
