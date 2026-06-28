# 15 · AI & Blockchain Readiness

Both are **architected now, implemented later**. The platform exposes the right structure so these become additive capabilities, never rewrites.

## AI-ready
The goal: every object is machine-understandable, addressable, and traversable — ready for semantic search, assistants, recommendations, auto-tagging, and future AI curation.

**Structured metadata everywhere**
- Stable **Registry IDs** + a **self-describing API** (OpenAPI at `/api/v1/openapi.json`).
- **JSON-LD / schema.org** projection per public resource (`?format=jsonld`) — `CreativeWork`/`VisualArtwork`/`Person`/`Organization`/`Event` — so external knowledge graphs and crawlers ingest Planet B cleanly.
- The **relationship engine** ([07](07-registry-and-relationships.md)) *is* a knowledge graph; AI agents traverse `/public/graph/{registryId}`.

**Semantic search (reserved, low-cost to enable)**
- `embedding vector(1536)` column already reserved on cultural/media tables (pgvector). Enable by: backfill embeddings (statements, bios, captions, tags) → add an ANN index → expose `search?q=…&mode=semantic`. No schema change required.
- Search sits behind a `SearchRepository` interface → FTS today, pgvector or external vector DB later, swappable.

**Auto-tagging / enrichment (pipeline-ready)**
- The media ingestion pipeline ([05](05-storage-strategy.md)) has an async enrichment step where image/caption models can propose `tags`, alt-text drafts, and `entity_links` suggestions — always **human-approved** before publish (curatorial authority preserved).

**Assistant / NL queries**
- A future "ask the archive" assistant uses: OpenAPI (tools) + graph traversal + semantic search + JSON-LD context. All read-only, RLS-bounded (it can never see drafts/PII).

**Guardrails**
- AI **proposes, curators dispose** — no autonomous publishing.
- Provenance of AI-generated metadata is recorded (audit + a `source: 'ai'` marker) so it's distinguishable from human/catalogue facts. Truth and attribution first (Principles VI/VIII).

## Blockchain-ready (NOT implemented)
Per the brief, design only. Builds directly on the existing certificate model ([../14 cert system](../14-certificate-system.md), [13 blockchain strategy](../13-blockchain-strategy.md)).

**Already in place**
- `certificates.verification_hash` — off-chain verification works today (recompute canonical hash, compare).
- `certificates.soulbound_ref` — **nullable**, reserved for an on-chain token id; no migration needed to mint later.
- `CertificateClaimV1` — a **versioned canonical serialization** of exactly what gets hashed, so a hash minted in 2026 still validates in 2050.

**Future phases (when/if approved)**
1. **Anchor** — periodically write a Merkle root of all certificate hashes to a public chain → tamper-evidence, no per-cert gas.
2. **Mint Soulbound (non-transferable) tokens** — one per certificate; fill `soulbound_ref`; custodial wallets for artists without one (inclusion first — no wallet/fee required).
3. **Extend provenance** — artwork provenance, artist identity, chapter lineage, impact attestations as verifiable claims, all keyed by Registry ID.

**Principles that constrain the chain**
- Soulbound, not tradable — recognition of history, never speculation.
- Environmentally appropriate chain (it would be absurd for this movement otherwise).
- The chain *proves* history; it never gates access or monetizes identity.
- `verify(registryId|certId)` stays one service interface with two resolvers (hash now, chain later) — clients never change.

## Net effect
Turning on semantic search or on-chain verification is a **feature flag + backfill + adapter**, not a redesign — exactly the maintainability mandate of Phase 2.
