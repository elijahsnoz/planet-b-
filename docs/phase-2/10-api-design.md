# 10 · API Design (the institution's contract)

**Purpose.** Define the complete API surface for the Planet B institution — the resource endpoints, the public/admin/internal split, the canonical `/verify` contract, conventions (versioning, pagination, filtering, errors, auth, CORS, rate limiting), and how every handler sits on the Repository layer rather than the DB driver. The API is how researchers, museums, embassies, grant reviewers, AI agents, and our own clients *read the archive* and how staff *steward it* — so it must be open where it should be open, locked where it must be locked, citable forever, and contract-first. *Will this help preserve the history, credibility, and future of the movement?* A self-describing, open-data-ready API is what makes the archive credible to institutions and durable beyond any single front-end.

**Extends.** [architecture/09 — API Specification](../architecture/09-api-specification.md) (surfaces, versioning, JSON:API-ish envelope, keyset pagination, RFC 7807 errors, OpenAPI, GraphQL). This document **amends and concretizes** that spec for Phase 2's full resource set (passports, stories, certificates+claim, blockchain/verify) and pins the `/verify` contract to [models/index.ts](../../models/index.ts). It assumes the canon ([00-README.md](00-README.md)): Repository Pattern ([ADR-0004](adr/0004-repository-pattern.md)), design-for-Postgres ([ADR-0001](adr/0001-data-backbone.md)), Registry IDs, certificate Public IDs, and `verification_events`.

---

## 1. Surfaces & where each runtime applies

Next.js gives us three execution shapes. Choosing correctly is a design decision, not an accident:

| Surface | Base path | Runtime | Auth | Audience |
|---------|-----------|---------|------|----------|
| **Public Read API** | `/api/v1/public/*` | Route Handlers | none / API key | researchers, museums, AI, kiosks, third parties, grant reviewers |
| **Verify API** | `/api/v1/verify/*` | Route Handlers | none | anyone holding a certificate Public ID |
| **Admin API** | server actions + `/api/v1/admin/*` | Server Actions (mutations) · Route Handlers (machine clients) | session + RBAC | admin console, staff tooling |
| **Internal** | not HTTP-exposed | in-process repositories | n/a | jobs, search index, derivative pipeline |

**Rule of thumb for the runtime:**
- **Server Actions** for admin mutations driven by the admin UI (create/update/publish/issue). They are typed, colocated with the feature, CSRF-safe, and never expose a public URL. This is the default for staff writes.
- **Route Handlers** for (a) the entire public read API, (b) `/verify`, (c) machine-facing admin endpoints (bulk import, external integrations) that need a stable HTTP contract + API keys.
- **Internal repositories** for everything in-process (the DAM pipeline in [09](09-media-management-strategy.md), search re-index, fixity). No HTTP hop.

Versioning is URL-prefixed (`/api/v1`); breaking changes → `/v2` with a deprecation window; every response carries `X-PlanetB-API-Version`.

---

## 2. The API sits on the Repository layer — always

No handler or server action ever imports Drizzle/SQLite or a Supabase client. The flow is fixed:

```
  HTTP / Server Action
        │  (zod-validated input)
        ▼
  ┌───────────────┐   authn + RBAC (lib/rbac) + consent gate
  │  Handler /    │   shapes JSON:API envelope, errors (RFC 7807)
  │  Server Action│   NEVER touches the DB driver
  └──────┬────────┘
         │  calls
         ▼
  ┌───────────────┐   ArtworkRepository · PassportRepository · CertificateRepository
  │  Repository   │   StoryRepository · MediaRepository · GraphRepository · VerifyRepository
  │  (ADR-0004)   │   the ONLY layer that imports the ORM/driver
  └──────┬────────┘
         │  driver
         ▼
   SQLite (now)  →  Postgres/Supabase (later)   — a driver swap, not a rewrite
```

This is what lets the same API run on the portable SQLite file today and on Supabase later. Contract-first: handlers validate with **zod** at the boundary; the same schemas generate **OpenAPI 3.1** (`/api/v1/openapi.json` + Swagger UI) and a **typed client** for web/admin/mobile — no hand-written fetchers, no drift.

---

## 3. Conventions (extends architecture/09)

- **Resource = registry type, addressed by stable ID.** `/public/artworks/PB-ARTWORK-000001`. Certificates are addressed by their **Public ID**: `/verify/PB-ABJ-2026-002`. Passports by `PB-ID-000001`.
- **Envelope:** `{ data, meta, links, included? }`. Lists carry `meta.next_cursor` + `links.self/next`.
- **Errors:** RFC 7807 `{ type, title, status, detail, instance }`.
- **Pagination:** keyset — `?limit=50&cursor=…` → `meta.next_cursor`. No deep offset (stable at 250k+ rows).
- **Filtering / sort:** `?filter[chapter]=PB-CHAPTER-000001&filter[status]=published&sort=-created_at`.
- **Sparse fields / includes:** `?fields[artwork]=title,year&include=artist,media`.
- **Idempotency:** mutations accept `Idempotency-Key`.
- **Read-only by default:** public API never returns drafts, `archived_at` rows, PII, or `consent_status != granted` records (RLS-backed later; repository-enforced now).
- **Auth:**
  - *Public:* anonymous (rate-limited by IP) or **API key** (higher tier, attributable). Keys are future-dated in canon (`session + future API keys/tokens`).
  - *Admin:* **session** (the existing `sessions` table) + **RBAC** (`lib/rbac`, `permissions` like `artwork.update`); MFA for sensitive verbs (certificate issue/revoke, see `users.mfa_required`).
  - *Verify:* none.
- **CORS:** public + verify allow-list `GET`/`OPTIONS` from anywhere (open data); admin is same-origin / no CORS.
- **Rate limiting:** per-IP for anonymous, per-key tiers for API keys, burst control (`lib/rate-limit.ts`). `429` with `Retry-After`.
- **Caching:** public GETs are edge-cacheable (`Cache-Control` + `ETag`); mutations purge tags.
- **Machine-readable:** every public resource also offers `?format=jsonld` (schema.org) for knowledge-graph ingestion; `/.well-known/` + OpenAPI make the platform self-describing for AI agents.

### Open data posture (grant-readiness)
| Resource | Public read | Why |
|----------|-------------|-----|
| chapters, artworks, artists/people (consent=granted), organizations, media (published, non-restricted), timeline, stories (published), impact, press, search, graph | **Open** (anon + key) | researchers, museums, grant reviewers — this is the archive's value as open data |
| certificate **verify**, blockchain **verify** | **Open** | trust must be publicly checkable |
| certificate **claim**, passport **claim** | **Authenticated** | a living contributor proving identity |
| research (internal datasets), full passport aggregation with PII, audit, revisions, all writes | **Admin / internal** | governance + privacy |

---

## 4. Resource endpoints

`{rid}` = Registry ID (e.g. `PB-ARTWORK-000001`). `{cid}` = certificate Public ID (`PB-ABJ-2026-002`). `{pid}` = passport ID (`PB-ID-000001`). `:verb` = non-CRUD action (auditable, explicit).

### 4.1 Public Read API — `/api/v1/public/*` (published only)
```
GET  /chapters                         GET  /chapters/{rid}
GET  /artists                          GET  /artists/{rid}?include=artworks,certificates
GET  /artworks                         GET  /artworks/{rid}?include=artist,media,relationships
GET  /organizations                    GET  /organizations/{rid}
GET  /stories                          GET  /stories/{rid}          # kind=feature|exhibition|profile|dispatch|essay
GET  /passports                        GET  /passports/{pid}        # public projection (no PII)
GET  /certificates/{cid}               # public certificate record (status, role, chapter, issuedOn)
GET  /media/{rid}                       # asset metadata + public derivative URLs
GET  /timeline?filter[chapter]={rid}
GET  /impact?filter[chapter]={rid}
GET  /press?filter[chapter]={rid}
GET  /graph/{rid}?relations=depicts,features,belongs_to&depth=1
GET  /search?q=…&type=artwork,story,person   # FTS now; semantic later (architecture/15)
```

### 4.2 Verify API — `/api/v1/verify/*` (no auth, the trust surface)
```
GET  /verify/{cid}                      # → VerificationResult (canonical, §5)
GET  /verify/{cid}/events               # append-only verification_events log for this cert
GET  /blockchain/anchor/{anchorId}      # PB-ANCHOR-* merkle batch status (onchain_refs/chain_anchors)
```

### 4.3 Admin API — server actions + `/api/v1/admin/*` (session + RBAC, audited)
Each verb writes `audit_logs` + a `revisions` snapshot; nothing is hard-deleted (`:archive` sets `archived_at`).
```
# Cultural records (same shape for artworks, artists/people, chapters, organizations, stories, timeline, press, impact)
POST   /admin/{type}                    PATCH  /admin/{type}/{rid}
POST   /admin/{type}/{rid}:publish      POST   /admin/{type}/{rid}:archive    POST /admin/{type}/{rid}:restore
GET    /admin/{type}/{rid}/revisions    POST   /admin/{type}/{rid}/revisions/{n}:restore

# Media / assets  (DAM pipeline, doc 09)
POST   /admin/media                      # upload → checksum → mint → derivative job → graph link
POST   /admin/media/{rid}:regenerate     # re-run derivative generation (idempotent)
POST   /admin/links                      # create entity_links edge (relation from controlled vocab, doc 03)

# Certificates  (Principle III; MFA on issue/revoke)
POST   /admin/certificates:issue         POST   /admin/certificates/{cid}:revoke      # revoke = status, never delete
POST   /admin/certificates/{cid}:reserve

# Passport & claims  (doc 04 / doc 05)
POST   /admin/passports:mint             # mint PB-ID for a people row
POST   /admin/passport-claims/{id}:approve   POST /admin/passport-claims/{id}:reject
POST   /admin/claim-requests/{id}:match      POST /admin/claim-requests/{id}:approve   POST /admin/claim-requests/{id}:reject

# Blockchain  (doc 06/07 — abstracted; designed now, executed later)
POST   /admin/blockchain/anchor          # build merkle batch → chain_anchors (PB-ANCHOR-*)
POST   /admin/blockchain/mint            # mint SBT/attestation → onchain_refs

# Governance
GET    /admin/audit?filter[actor]=…&filter[entity]=…
GET    /admin/research                   # internal datasets / exports (grant + scholarship)
```

### 4.4 Authenticated contributor endpoints (a living person, not staff)
```
POST   /api/v1/me/passport-claims        # claim my identity → passport_claims (pending)
POST   /api/v1/me/claim-requests         # upload my paper certificate → claim_requests (OCR → match → review)
GET    /api/v1/me/passport               # my full passport once claimed
```

### 4.5 Webhooks / events (out)
HMAC-signed, configurable. Fired from repository write paths:
```
media.published · certificate.issued · certificate.revoked · certificate.verified
passport.claimed · claim_request.matched · blockchain.anchored · blockchain.minted
```
`certificate.verified` and `blockchain.anchored` are backed by the append-only `verification_events` table — the same rows that `/verify/{cid}/events` returns. Consumers: search re-index, CDN purge, integrations.

---

## 5. The canonical `/verify` contract

The single most important endpoint — it is how the world checks a Planet B certificate. It is pinned **byte-for-byte** to `VerificationResult` in [models/index.ts](../../models/index.ts) (lines 283–288). Do not add or rename fields.

**Input:** the certificate **Public ID** (`publicId`), e.g. `PB-ABJ-2026-002`.
**Output:** `VerificationResult`.

```
GET /api/v1/verify/PB-ABJ-2026-002
```
```jsonc
// 200 OK  — shape is EXACTLY the VerificationResult interface
{
  "data": {
    "publicId":     "PB-ABJ-2026-002",   // string, never changes
    "hashValid":    true,                 // sha256 of CertificateClaimV1 matches certificates.verification_hash
    "onChain":      false,                // false until Blockchain Phase 3 (canon)
    "soulboundRef": null                  // string|null — filled only once an SBT is minted (onchain_refs)
  },
  "meta": { "checkedAt": "2026-06-28T10:00:00Z", "status": "issued" }  // certificates.status
}
```
- `hashValid` is computed by re-hashing the **versioned** `CertificateClaimV1` canonical JSON (models/index.ts lines 273–281) and comparing to `certificates.verification_hash`. Versioning means a 2026 hash still validates in 2050.
- `onChain` / `soulboundRef` are sourced from `onchain_refs` (the typed home generalizing `certificates.soulbound_ref`). Today both are `false`/`null` by design (Principle VII — blockchain-ready, not now).
- Every call appends a `verification_events` row (who/when/result) → audit trail + the `certificate.verified` webhook.
- A **revoked** certificate returns `200` with `meta.status="revoked"` and `hashValid` still reflecting the hash (revocation is a status, never a delete — the record and its history remain verifiable).
- Unknown `publicId` → `404` RFC 7807.

The `VerifyRepository.verify(publicId)` method owns this logic; the handler only validates input and shapes the envelope.

---

## 6. Sample request / response bodies

### 6.1 Passport (public projection — no PII)
```
GET /api/v1/public/passports/PB-ID-000001?include=certificates,artworks
```
```jsonc
{
  "data": {
    "passportId": "PB-ID-000001",
    "displayName": "Elijah Snoz",
    "country": "Nigeria",
    "passportStatus": "claimed",                       // unclaimed|claimed|linked
    "roles": ["Artist", "Storyteller", "Founding Narrator"],
    "chapters": ["PB-CHAPTER-000001"],
    "counts": { "certificates": 2, "artworks": 3, "contributions": 5 }  // computed from graph, not duplicated
  },
  "included": [
    { "type": "certificate", "publicId": "PB-ABJ-2026-002", "roleAtIssue": "Artist", "status": "issued" },
    { "type": "artwork", "registryId": "PB-ARTWORK-000007", "title": "…" }
  ],
  "links": { "self": "/api/v1/public/passports/PB-ID-000001" }
}
```

### 6.2 Certificate verify
```
GET /api/v1/verify/PB-ABJ-2026-002      →  (see §5 — VerificationResult)
```

### 6.3 Story
```
GET /api/v1/public/stories/PB-STORY-000004?include=cover_media,features
```
```jsonc
{
  "data": {
    "registryId": "PB-STORY-000004",
    "slug": "the-road-walk",
    "kind": "feature",                                 // feature|exhibition|profile|dispatch|essay
    "status": "published",
    "title": "The Road Walk",
    "subtitle": "How Abuja gathered its discards",
    "dek": "On a June morning the city's waste became its canvas.",
    "coverMedia": "PB-MEDIA-000012",
    "chapter": "PB-CHAPTER-000001",
    "body": [ { "type": "paragraph", "text": "…" } ]   // block JSON
  },
  "included": [
    { "type": "media",  "registryId": "PB-MEDIA-000012", "altText": "Artists walking the road", "url": "https://cdn/…/avif-1600.avif" },
    { "type": "artwork","registryId": "PB-ARTWORK-000007", "relation": "features" }   // entity_links edge
  ]
}
```

### 6.4 Search
```
GET /api/v1/public/search?q=mask&type=artwork,story&limit=2
```
```jsonc
{
  "data": [
    { "type": "artwork", "registryId": "PB-ARTWORK-000007", "title": "Mask of the River", "chapter": "PB-CHAPTER-000001", "score": 0.91 },
    { "type": "story",   "registryId": "PB-STORY-000004",   "title": "The Road Walk",      "chapter": "PB-CHAPTER-000001", "score": 0.62 }
  ],
  "meta": { "q": "mask", "total": 2, "next_cursor": null, "engine": "fts" }   // "semantic" later
}
```

### 6.5 Error (RFC 7807)
```jsonc
// 404
{ "type": "https://planetb.art/errors/not-found",
  "title": "Certificate not found", "status": 404,
  "detail": "No certificate with publicId PB-ABJ-2026-999",
  "instance": "/api/v1/verify/PB-ABJ-2026-999" }
```

---

## Open questions for approval

1. **Public base path.** architecture/09 uses `/api/v1/public/*`. Confirm we keep the `/public/` segment (clear, but verbose) rather than defaulting unprefixed routes to public.
2. **API keys at launch.** Canon says session now, keys *future*. Do public endpoints ship anonymous-only at first (IP rate-limited), with API keys added when a partner needs higher quota — or do we build the key tier now for grant-readiness?
3. **GraphQL.** architecture/09 offers a read GraphQL surface (`pg_graphql`). It depends on the Postgres migration. Keep it as a documented future surface, or commit to it as a Phase 2 deliverable for graph-heavy researcher queries?
4. **Passport public projection.** Exactly which fields are public vs claim-gated? Proposed public set is in §6.1 (no contact PII, no withheld facts). Confirm `country` and `roles` are always public.
5. **Verify rate limiting.** `/verify` is open and trust-critical. Confirm a generous anonymous limit + an unthrottled lane for known museum/partner keys, to avoid throttling legitimate bulk verification.
6. **Webhook delivery guarantees.** At-least-once with HMAC + retry/backoff, or also a polling fallback (`/verify/{cid}/events`) as the canonical record? Recommend: events table is canonical; webhooks are best-effort notifications on top.
7. **JSON-LD scope.** Emit schema.org for all public resources, or start with the highest-value ones (artwork, person, story, organization) for SEO + knowledge-graph ingestion?
