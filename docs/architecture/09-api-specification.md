# 09 · API Specification (API-first)

One backend, many clients (website, admin, mobile, kiosks, public API, AI). REST is the primary contract; GraphQL is offered for graph-shaped reads. **Versioned, validated, documented, rate-limited.**

## Surfaces
| Surface | Base | Auth | Audience |
|---------|------|------|----------|
| Public Read API | `/api/v1/public/*` | none / API key | website, AI, third parties, kiosks |
| Admin API | `/api/v1/admin/*` | session (JWT) + RBAC | admin console |
| Verify API | `/api/v1/verify/*` | none | certificate verification |
| GraphQL (read) | `/api/v1/graphql` | key/session | graph traversal, flexible reads |
| Webhooks (out) | configurable | HMAC-signed | integrations, search, cache |

Versioning: URL-prefixed (`/v1`). Breaking changes → `/v2`; `/v1` supported with a deprecation window. Responses carry `X-PlanetB-API-Version`.

## Conventions
- **Resource = registry type**, addressed by Registry ID: `/public/artworks/PB-ARTWORK-000001`.
- **JSON:API-ish envelope**: `{ data, meta, links, included? }`. Errors RFC 7807 `{ type, title, status, detail, instance }`.
- **Keyset pagination**: `?limit=50&cursor=…` → `meta.next_cursor` (stable at 250k rows). No deep offset.
- **Filtering/sort**: `?filter[chapter]=PB-CHAPTER-000001&filter[status]=published&sort=-created_at`.
- **Sparse fields / includes**: `?fields[artwork]=title,year&include=artist,media`.
- **Idempotency**: mutations accept `Idempotency-Key`.
- **Validation**: every request body/query validated by **zod** at the gateway; one schema reused for types + OpenAPI.
- **Read-only by default**: public API never exposes drafts, archived rows, PII, or consent-pending records (RLS-backed).

## Core endpoints (representative)
```
# Public (published only)
GET  /api/v1/public/chapters
GET  /api/v1/public/chapters/{registryId}
GET  /api/v1/public/artists?filter[chapter]=…&include=artworks
GET  /api/v1/public/artists/{registryId}
GET  /api/v1/public/artworks/{registryId}?include=artist,media,relationships
GET  /api/v1/public/media/{registryId}
GET  /api/v1/public/stories            # resolved Sanity + Supabase
GET  /api/v1/public/impact?filter[chapter]=…
GET  /api/v1/public/graph/{registryId}?relations=depicts,featured_in&depth=1
GET  /api/v1/public/search?q=…         # full-text now; semantic later (doc 15)

# Verify (no auth)
GET  /api/v1/verify/{certPublicId}     # → { hashValid, onChain, soulboundRef }

# Admin (JWT + RBAC + RLS)
POST   /api/v1/admin/artworks
PATCH  /api/v1/admin/artworks/{registryId}
POST   /api/v1/admin/artworks/{registryId}:publish
POST   /api/v1/admin/artworks/{registryId}:archive
POST   /api/v1/admin/artworks/{registryId}:restore
GET    /api/v1/admin/artworks/{registryId}/revisions
POST   /api/v1/admin/artworks/{registryId}/revisions/{n}:restore
POST   /api/v1/admin/media                       # upload → DAM pipeline
POST   /api/v1/admin/certificates:issue          # MFA + audit
POST   /api/v1/admin/certificates/{id}:revoke
POST   /api/v1/admin/links                        # create entity_links edge
GET    /api/v1/admin/audit?filter[actor]=…
```
Note: `:action` sub-resources express non-CRUD verbs explicitly (publish/archive/restore/issue) — clearer and auditable than overloading PATCH.

## GraphQL (reads)
Backed by Supabase `pg_graphql` (or a thin gateway). Ideal for relationship traversal:
```graphql
query { artwork(registryId:"PB-ARTWORK-000001") {
  title year artist { fullName registryId }
  media { altText url }
  related(relation: FEATURED_IN) { ... on Story { title } }
} }
```

## Contracts & docs
- **OpenAPI 3.1** generated from the zod schemas → published at `/api/v1/openapi.json` + Swagger UI.
- **Typed client** generated for the web/admin/mobile from OpenAPI → no hand-written fetchers, no drift.
- **Contract tests** ([13](13-testing-strategy.md)) assert handlers match the spec.

## Cross-origin, limits, caching
- Public API: API-key tiers, per-key **rate limiting** + burst control, CORS allow-list.
- Caching: public GETs are edge-cacheable (`Cache-Control` + `ETag`); mutations purge tags.
- All responses expose `registry_id` and a `self` link → stable, citable, AI-addressable.

## AI & machine consumption ([15](15-ai-and-blockchain-readiness.md))
- Every public resource also offers **JSON-LD / schema.org** (`?format=jsonld`) for knowledge-graph ingestion.
- `/.well-known/` discovery + the OpenAPI doc make the platform self-describing for agents.
