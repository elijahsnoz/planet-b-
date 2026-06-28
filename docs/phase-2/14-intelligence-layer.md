# 14 · Intelligence Layer

> **Status: DESIGN — awaiting approval.** Type signatures only — **no implementations, no AI shipped.** The layer ships *designed*; providers are built later behind it. The application depends on the `IntelligenceService` interface, never on an AI SDK. The **default provider is a no-op**, so the entire institution works with zero intelligence enabled.

**Purpose.** Define the single, provider-agnostic **Intelligence Layer** — a cross-cutting `IntelligenceService` abstraction (and its sub-services) that the platform talks to for *understanding* the archive: semantic search, embeddings, OCR, metadata extraction, recommendations, AI-assisted curation, multilingual translation, accessibility enhancements, impact analytics, archive exploration, and a curator assistant. The layer is **independent of the application layer** — it sits *beside* the three institutional layers (Experience · Platform · Trust), never inside a domain. Any provider (none, OpenAI, Anthropic, a local model, pgvector, an external vector DB) can be selected by config without touching a domain, repository, route, or component. This is the contract that makes "designed now, implemented later" actually decoupled, so intelligence can be added **without restructuring the platform**.

**Extends.** [architecture/15 · AI & Blockchain Readiness](../architecture/15-ai-and-blockchain-readiness.md) (every object machine-understandable; *AI proposes, curators dispose*; `source:'ai'` provenance marker; reserved `embedding` column; `SearchRepository` FTS→pgvector→external escalation; flag + backfill + adapter, not a redesign). Mirrors the **provider-abstraction + Noop-default** discipline of [07 · Blockchain Abstraction Interface](07-blockchain-abstraction-interface.md). Aligns the **`OcrProvider`** interface already defined in [05 · Certificate Verification & Claim Spec](05-certificate-verification-spec.md) §B.3. Reads the **knowledge graph** ([03](03-knowledge-graph.md)) for recommendations/exploration and the **`translations`** overlay ([ADR-0006](adr/0006-i18n-strategy.md)) for multilingual output. Obeys the canon in [00-README.md](00-README.md): identifiers, table names, and states are used exactly. Decision recorded in [ADR-0010](adr/0010-intelligence-layer.md).

---

## 1. Motivation — why the archive needs an intelligence layer

Planet B is architected for **100+ countries, 500+ chapters, 50,000+ artists, 250,000+ artworks** ([00-README](00-README.md)), plus the long tail: certificates, videos, interviews, research essays, press, and media at preservation scale. At Genesis scale a human curator can hold the whole archive in their head and a `LIKE '%term%'` search suffices. At institutional scale neither is true:

- **Discovery breaks.** Keyword/FTS search cannot answer *"works that respond to displacement"* or *"interviews where an artist describes mentorship"* — the meaning is not in the literal tokens.
- **Curation cannot keep pace.** Tens of thousands of artworks each need alt-text, captions, tags, and `entity_links` suggestions. Manual-only enrichment will never finish.
- **The physical-to-digital bridge is manual.** Thousands of physical certificates must be read (OCR) and matched ([05](05-certificate-verification-spec.md)).
- **The archive is multilingual.** A century, 100+ countries — English-only excludes most of the movement ([ADR-0006](adr/0006-i18n-strategy.md)).
- **Accessibility is non-negotiable.** WCAG-grade alt-text/captions at scale ([00-README](00-README.md)).
- **Connections go unseen.** The knowledge graph ([03](03-knowledge-graph.md)) holds latent relationships a recommender/exploration tool can surface.

The answer is **not** to bake AI into the product now. The answer is to design the *seam* now so these capabilities become **additive** — `feature flag + backfill + adapter` ([architecture/15](../architecture/15-ai-and-blockchain-readiness.md)) — and never a rewrite.

```
        ┌──────────────────────────────────────────────────────────────┐
        │                    THE EXPERIENCE (Layer 1)                    │
        ├──────────────────────────────────────────────────────────────┤
        │                    THE PLATFORM (Layer 2)                      │
        │            src/domains/*  ·  repositories  ·  graph            │
        ├──────────────────────────────────────────────────────────────┤
        │                    THE TRUST LAYER (Layer 3)                   │
        └──────────────────────────────────────────────────────────────┘
              ▲ depends on interface + types only (never an AI SDK)
              │   reads archive/graph via repositories · writes back
              │   ordinary records / edges / embeddings
        ┌─────┴───────────────────  ✦  ──────────────────────────────────┐
        │              THE INTELLIGENCE LAYER  (src/intelligence/)         │
        │   IntelligenceService  →  Noop (default) | OpenAI | Anthropic    │
        │                            local-model | pgvector | external-vdb │
        └─────────────────────────────────────────────────────────────────┘
```

---

## 2. Capabilities to prepare for (DESIGN ONLY — none shipped)

| ✦ Capability | What it will do (later) | Reads | Writes back as |
|---|---|---|---|
| **Semantic search** | meaning-based query over the archive | embeddings + FTS | ranked results (no mutation) |
| **Vector embeddings** | turn records into vectors for similarity | record text | `embeddings` rows (§7) |
| **OCR processing** | read physical certificates | uploaded `media` | `claim_requests.ocr_text` ([05](05-certificate-verification-spec.md)) |
| **Metadata extraction** | propose tags/title/medium/dates | record + media | **draft** `media.tags`, suggested `entity_links` (`source:'ai'`) |
| **Recommendation engine** | "related to" / "read next" | knowledge graph ([03](03-knowledge-graph.md)) | ranked refs (no mutation) |
| **AI-assisted curation** | propose edges, groupings, summaries | graph + records | **proposals** queued for human approval |
| **Multilingual translation** | locale overlays | source (English) fields | **draft** `translations` rows ([ADR-0006](adr/0006-i18n-strategy.md)) |
| **Accessibility enhancements** | alt-text + caption generation | image/video `media` | **draft** `media.altText` / `media.caption` |
| **Impact analytics** | trends, reach, narrative summaries | `impact_metrics` + graph | analytics views (read) / report drafts |
| **Archive exploration** | guided "wander the graph" | knowledge graph | exploration sessions (read) |
| **Curator assistant** | NL "ask the archive" (read-only, RLS-bounded) | OpenAPI + graph + semantic search + JSON-LD | answers w/ citations (no mutation) |

**The two rules every capability obeys** (from [architecture/15](../architecture/15-ai-and-blockchain-readiness.md)):
1. **AI proposes, curators dispose** — nothing AI writes is ever published autonomously. Mutating outputs land as **drafts/proposals**, marked `source:'ai'`, awaiting human approval.
2. **Truth and attribution first** — AI output never overwrites a verified human/catalogue fact (Principle VI), and its provenance is always recorded.

---

## 3. The Independence Principle (how the layer is decoupled)

The Intelligence Layer is **not a domain** and is **not imported by domains as a hard dependency**. Five mechanisms enforce independence:

1. **Interface-only coupling.** The app/domains depend on the `IntelligenceService` interface and its **types**, obtained via `getIntelligenceService()`. They never import an AI SDK. (Mirrors the blockchain rule, [07](07-blockchain-abstraction-interface.md) §1.)
2. **One-way reads.** The layer **reads** the archive through the same **repositories** ([ADR-0004](adr/0004-repository-pattern.md)) and the **`graph.*`** service ([03](03-knowledge-graph.md)) that the app uses. Domains do not reach into the layer's internals; the layer does not reach around the repositories into the ORM.
3. **Out-of-band jobs.** Heavy work (embedding backfill, OCR, translation drafts, alt-text generation) runs **async / out-of-band** as workers — never on the request path. A page render never blocks on a model call. (Same posture as `anchorPending()` in [07](07-blockchain-abstraction-interface.md) §7.)
4. **Write-back as ordinary records.** Results are persisted as **plain platform records/edges/embeddings** — `embeddings` rows, draft `media.tags`/`altText`, draft `translations`, suggested `entity_links` (with `source:'ai'`). The Experience renders these as normal data; it cannot tell whether intelligence produced them, and **works identically whether or not intelligence ever ran.**
5. **Boundary enforcement.** A lint/boundary check forbids importing an AI SDK anywhere except `src/intelligence/providers/*`. The rest of the codebase cannot tell which provider (if any) is live.

```
   Routes / Server Actions / Components / Domains
                 │  (interface + types only — NEVER an AI SDK)
                 ▼
        getIntelligenceService(): IntelligenceService     ◀── config/flag selects provider
                 │                                              fail-safe → Noop
   reads ◀───────┤────────▶ writes back (out-of-band workers)
   Repositories  │          embeddings · draft tags/alt-text · draft translations
   graph.*       │          suggested entity_links (source:'ai') · proposals queue
                 ▼
        Storage (Postgres/SQLite)  ·  knowledge graph (entity_links)
```

**Where it lives** (mirrors [07](07-blockchain-abstraction-interface.md) §1, but at `src/intelligence/` with the `@intelligence/*` path alias):

```
src/intelligence/
├── index.ts                      # public surface: getIntelligenceService(), types
├── intelligence.types.ts         # Result<T>, errors, Capability matrix, shared DTOs
├── intelligence.service.ts       # the IntelligenceService interface (this doc)
├── intelligence.config.ts        # provider selection from env/flags (zod-validated)
├── services/                     # sub-service interfaces (no impls)
│   ├── search.ts                 # SearchIndex / SemanticSearch
│   ├── embeddings.ts             # EmbeddingProvider
│   ├── ocr.ts                    # OcrProvider (re-exports/aligns 05 §B.3)
│   ├── metadata.ts               # MetadataExtractor
│   ├── recommender.ts            # Recommender
│   ├── translator.ts             # Translator
│   ├── accessibility.ts          # AccessibilityAssistant
│   ├── analytics.ts              # ImpactAnalytics
│   └── curator.ts                # CuratorAssistant
└── providers/                    # the ONLY place an AI/vector SDK may be imported
    ├── noop.provider.ts          # DEFAULT — intelligence disabled, app fully works
    ├── openai.provider.ts        # later — embeddings/LLM behind the interface
    ├── anthropic.provider.ts     # later — LLM (curator assistant, summaries)
    ├── local.provider.ts         # later — on-box/offline model (sovereign)
    ├── pgvector.provider.ts      # later — Postgres-native ANN vector store
    └── external-vdb.provider.ts  # later — managed external vector DB
```

---

## 4. Result & error types (no exceptions for expected outcomes)

Intelligence operations are fallible and frequently **intentionally skipped** (Noop). They return an explicit **result union** — never throw for expected conditions — so business logic always has a defined path and the app never breaks when intelligence is off. This is the same `Result<T>` shape as [07](07-blockchain-abstraction-interface.md) §2, reused for consistency.

```ts
// src/intelligence/intelligence.types.ts

/** Which provider produced a result (also stored as the `source`/`model` marker). */
export type IntelligenceProviderId =
  | "noop" | "openai" | "anthropic" | "local" | "pgvector" | "external-vdb" | (string & {});

/** Entities the layer can reason over — the knowledge-graph node types ([03]). */
export type IntelEntityType =
  | "artist" | "person" | "artwork" | "chapter" | "event"
  | "organization" | "certificate" | "media" | "story" | "research" | "passport";

/** A provenance-bearing reference to any archive record (no PII copied). */
export interface EntityRef {
  type: IntelEntityType;
  id: string;                  // Registry ID, e.g. "PB-ARTWORK-000002"
}

/** Typed, non-throwing error categories (parallels blockchain.types). */
export type IntelligenceErrorCode =
  | "DISABLED"           // provider is Noop / capability flag off → expected no-op
  | "NOT_SUPPORTED"      // provider lacks this capability (see CapabilityMatrix)
  | "NOT_INDEXED"        // no embedding/index for this entity yet
  | "LOW_CONFIDENCE"     // result below the human-review floor → must be reviewed
  | "RATE_LIMITED"       // provider throttled — retry later
  | "BUDGET_EXCEEDED"    // cost ceiling hit — degrade gracefully
  | "PROVIDER_UNAVAILABLE" // network/model failure — degrade to baseline
  | "MISCONFIGURED";     // bad keys/config — fail safe to Noop

export interface IntelligenceError {
  code: IntelligenceErrorCode;
  message: string;
  retriable: boolean;
  provider: IntelligenceProviderId;
  cause?: unknown;
}

/** Discriminated result so callers branch exhaustively and never crash when off. */
export type Ok<T> = { ok: true; value: T; provider: IntelligenceProviderId };
export type Err = { ok: false; error: IntelligenceError };
export type Result<T> = Ok<T> | Err;

/**
 * Provenance envelope attached to every *mutating* output so the platform can
 * mark records `source:'ai'`, never overwrite verified human facts (Principle VI),
 * and audit/replay the generation. Stored alongside the draft it produced.
 */
export interface AiProvenance {
  source: "ai";
  provider: IntelligenceProviderId;
  model: string;               // e.g. "text-embedding-3-large", "claude-*", "local-…"
  generatedAt: string;         // ISO
  confidence?: number;         // 0–1 where the provider reports it
  reviewState: "draft" | "approved" | "rejected"; // never "approved" without a human
  reviewedBy?: string;         // users.id (set on human approval)
}
```

---

## 5. The `IntelligenceService` interface (and sub-services)

The top-level service is a **thin façade** that self-describes its capabilities and exposes the sub-services. Each sub-service is a small, independently-swappable interface. **All methods return `Result<…>`; none throw for expected conditions.**

```ts
// src/intelligence/intelligence.service.ts
import type {
  Result, EntityRef, IntelEntityType, IntelligenceProviderId, AiProvenance,
} from "./intelligence.types";
import type { CapabilityMatrix } from "./intelligence.capabilities";

export interface IntelligenceService {
  /** Self-describing: who am I, what can I do (drives feature flags + admin UI). */
  readonly providerId: IntelligenceProviderId;
  capabilities(): CapabilityMatrix;

  // Sub-services — each is independently swappable and may itself be Noop.
  readonly search: SemanticSearch;
  readonly embeddings: EmbeddingProvider;
  readonly ocr: OcrProvider;                 // aligned with 05 §B.3
  readonly metadata: MetadataExtractor;
  readonly recommender: Recommender;
  readonly translator: Translator;
  readonly accessibility: AccessibilityAssistant;
  readonly analytics: ImpactAnalytics;
  readonly curator: CuratorAssistant;
}
```

### 5.1 SearchIndex / SemanticSearch

```ts
// src/intelligence/services/search.ts
export interface IndexableDocument {
  ref: EntityRef;
  /** Concatenated, locale-tagged text to embed/index (bios, statements, captions…). */
  text: string;
  locale?: string;             // default "en"
  /** Filterable facets (chapter, year, role, kind) — never PII. */
  facets?: Record<string, string | number | boolean>;
}

export interface SearchHit {
  ref: EntityRef;
  score: number;               // 0–1 relevance
  snippet?: string;            // highlight, generated from public text only
  matchedOn?: "fts" | "vector" | "hybrid";
}

export interface SearchQuery {
  q: string;
  mode?: "keyword" | "semantic" | "hybrid";  // escalates FTS → pgvector → external (§7)
  filters?: Record<string, string | number | boolean>;
  locale?: string;
  limit?: number;              // bounded; default + max enforced
  cursor?: string;
}

export interface SearchResults {
  hits: SearchHit[];
  total?: number;
  cursor?: string;
  mode: "keyword" | "semantic" | "hybrid";
}

export interface SemanticSearch {
  /** Upsert a document into the search index (out-of-band; idempotent by ref). */
  indexDocument(doc: IndexableDocument): Promise<Result<{ indexed: true; ref: EntityRef }>>;
  /** Remove a document (e.g. on archive/soft-delete of its entity). */
  removeDocument(ref: EntityRef): Promise<Result<{ removed: true }>>;
  /** Query. Under Noop, falls back to keyword/FTS only; never errors the page. */
  query(query: SearchQuery): Promise<Result<SearchResults>>;
}
```

### 5.2 EmbeddingProvider

```ts
// src/intelligence/services/embeddings.ts
export interface EmbeddingInput {
  ref: EntityRef;
  text: string;
  locale?: string;
}
export interface Embedding {
  ref: EntityRef;
  model: string;               // pins which model produced the vector
  dims: number;                // e.g. 1536
  vector: number[];            // serialized to the `embeddings` table (§7)
}
export interface EmbeddingProvider {
  readonly model: string;
  readonly dims: number;
  /** Embed one or many inputs (batched out-of-band). */
  embed(inputs: EmbeddingInput[]): Promise<Result<Embedding[]>>;
}
```

### 5.3 OcrProvider (aligned with [05](05-certificate-verification-spec.md) §B.3)

The Intelligence Layer **re-exports the exact `OcrProvider` contract** already defined for the certificate-claim flow, so OCR is a single seam used by both the Claim feature and the layer. No second definition.

```ts
// src/intelligence/services/ocr.ts  — same shape as 05 §B.3 (interface only)
export interface OcrResult {
  fullText: string;            // → claim_requests.ocr_text
  blocks: { text: string; bbox: [number, number, number, number]; conf: number }[];
  provider: string;            // → claim_requests.ocr_provider
  raw?: unknown;               // retained for replay
}
export interface OcrProvider {
  readonly name: string;
  /** mediaRef points at the stored upload; the source is never modified. */
  recognize(mediaRef: { storagePath: string; mime: string }): Promise<OcrResult>;
}
```

### 5.4 MetadataExtractor

```ts
// src/intelligence/services/metadata.ts
export interface MetadataSuggestion {
  ref: EntityRef;
  /** Proposed field-level drafts — NEVER applied without human approval. */
  tags?: string[];
  title?: string;
  medium?: string;
  materials?: string[];
  /** Suggested graph edges (vocabulary-validated downstream, [03]). */
  edges?: Array<{ relation: string; to: EntityRef; weight?: number }>;
  provenance: AiProvenance;    // source:'ai', model, confidence, reviewState:'draft'
}
export interface MetadataExtractor {
  /** Propose metadata for a record (+optional media). Output is a draft proposal. */
  extract(ref: EntityRef, hints?: { mediaIds?: string[] }): Promise<Result<MetadataSuggestion>>;
}
```

### 5.5 Recommender (traverses the knowledge graph)

```ts
// src/intelligence/services/recommender.ts
export interface Recommendation {
  ref: EntityRef;
  score: number;               // 0–1
  reason?: string;             // e.g. "same series", "2-hop via Genesis chapter"
}
export interface RecommendOptions {
  types?: IntelEntityType[];   // restrict result types (e.g. only stories)
  limit?: number;              // bounded
  /** Blend signals: graph proximity ([03]) and/or embedding similarity (§7). */
  strategy?: "graph" | "vector" | "hybrid";
}
export interface Recommender {
  /** "Related to" — powers profiles, "read next", exploration. Reads the graph. */
  relatedTo(entity: EntityRef, opts?: RecommendOptions): Promise<Result<Recommendation[]>>;
}
```

### 5.6 Translator (aligned with [ADR-0006](adr/0006-i18n-strategy.md) `translations` overlay)

```ts
// src/intelligence/services/translator.ts
export interface TranslateRequest {
  ref: EntityRef;
  field: string;               // → translations.field
  text: string;                // source (English is canonical)
  targetLocale: string;        // → translations.locale
}
export interface TranslationDraft {
  ref: EntityRef;
  field: string;
  locale: string;
  value: string;               // → translations.value (status defaults 'draft')
  provenance: AiProvenance;    // marks the overlay as AI-authored, pending review
}
export interface Translator {
  /** Produce a DRAFT translations overlay; English source is never mutated. */
  translate(req: TranslateRequest): Promise<Result<TranslationDraft>>;
}
```

### 5.7 AccessibilityAssistant (alt-text / caption generation)

```ts
// src/intelligence/services/accessibility.ts
export interface ImageDescription {
  mediaId: string;
  altText: string;             // → DRAFT media.altText (concise, WCAG)
  longDescription?: string;
  provenance: AiProvenance;
}
export interface CaptionTrack {
  mediaId: string;
  vtt: string;                 // WebVTT → DRAFT captions track
  locale: string;
  provenance: AiProvenance;
}
export interface AccessibilityAssistant {
  /** Draft alt-text/long-description for an image. Human-approved before publish. */
  describeImage(mediaRef: { storagePath: string; mime: string; mediaId: string })
    : Promise<Result<ImageDescription>>;
  /** Draft captions (WebVTT) for audio/video. Human-approved before publish. */
  caption(mediaRef: { storagePath: string; mime: string; mediaId: string }, opts?: { locale?: string })
    : Promise<Result<CaptionTrack>>;
}
```

### 5.8 ImpactAnalytics

```ts
// src/intelligence/services/analytics.ts
export interface ImpactQuery {
  scope?: { chapterId?: string; country?: string; from?: string; to?: string };
  metrics?: string[];          // e.g. ["artists","artworks","waste_diverted_kg"]
}
export interface ImpactInsight {
  metric: string;
  value: number;
  unit?: string;
  trend?: "up" | "down" | "flat";
  /** Optional narrative summary — flagged AI-authored; never a verified fact. */
  narrative?: string;
  provenance?: AiProvenance;
}
export interface ImpactAnalytics {
  /** Read-only analytics over impact_metrics + graph. No mutation of records. */
  summarize(query: ImpactQuery): Promise<Result<ImpactInsight[]>>;
}
```

### 5.9 CuratorAssistant (NL "ask the archive", read-only, RLS-bounded)

```ts
// src/intelligence/services/curator.ts
export interface CuratorAsk {
  question: string;
  /** Always bounded by the caller's permissions — never sees drafts/PII. */
  actorId?: string;
  locale?: string;
}
export interface CuratorAnswer {
  answer: string;
  /** Every claim is grounded in archive records the user is allowed to see. */
  citations: EntityRef[];
  confidence?: number;
  provenance: AiProvenance;
}
export interface CuratorAssistant {
  /** Read-only Q&A grounded in OpenAPI + graph + semantic search + JSON-LD. */
  ask(input: CuratorAsk): Promise<Result<CuratorAnswer>>;
}
```

---

## 6. Providers & the capability matrix

All providers implement the **same** interfaces; selection is **config-only**. Business logic is **never** coupled to a vendor.

| Provider | Default? | Behavior | Imports an AI/vector SDK? |
|---|:--:|---|:--:|
| **`NoopIntelligenceService`** | ✓ (default) | Everything disabled. `query()` degrades to keyword/FTS; embed/extract/translate/describe return `DISABLED`/`status:"skipped"`; `relatedTo()` falls back to pure graph traversal ([03]). **App fully works, zero AI.** | No |
| **`OpenAiProvider`** | – | Embeddings + LLM (extraction, summaries) behind the interface. | Yes (isolated) |
| **`AnthropicProvider`** | – | LLM for curator assistant / summaries / translation drafts. | Yes (isolated) |
| **`LocalModelProvider`** | – | On-box/offline model — sovereign, archive-aligned, low external dependency. | Yes (isolated) |
| **`PgvectorProvider`** | – | Postgres-native ANN vector store for semantic search (§7). | Yes (isolated) |
| **`ExternalVdbProvider`** | – | Managed external vector DB at large scale. | Yes (isolated) |

Providers compose: e.g. `PgvectorProvider` (vector store) + `OpenAiProvider` (embeddings) + `AnthropicProvider` (curator) behind one `IntelligenceService`. **Adding a vendor = one `*.provider.ts` + a config flag; zero changes elsewhere.**

```ts
// src/intelligence/intelligence.config.ts (zod-validated at boot)
export interface IntelligenceConfig {
  provider: IntelligenceProviderId;     // env INTELLIGENCE_PROVIDER; default "noop"
  // per-capability flags — each defaults OFF; nothing AI runs out of the box
  semanticSearchEnabled: boolean;       // default false (keyword/FTS always works)
  embeddingsEnabled: boolean;           // default false
  ocrEnabled: boolean;                  // default false
  metadataExtractionEnabled: boolean;   // default false
  recommendationsEnabled: boolean;      // default false (graph-only fallback works)
  translationEnabled: boolean;          // default false
  accessibilityEnabled: boolean;        // default false
  analyticsEnabled: boolean;            // default false
  curatorAssistantEnabled: boolean;     // default false
  // cost/ethics controls (§9)
  monthlyBudgetUsd?: number;            // hard ceiling → BUDGET_EXCEEDED
  humanInLoop: boolean;                 // default true — AI proposes, curators dispose
  embeddingModel?: string;              // pins model into embeddings.model (§7)
}

/** Factory — single entry point. Falls back to Noop on MISCONFIGURED so a bad
 *  config never takes the app down. */
export declare function getIntelligenceService(config?: IntelligenceConfig): IntelligenceService;
```

```ts
// src/intelligence/intelligence.capabilities.ts
export interface CapabilityMatrix {
  semanticSearch: boolean;
  embeddings: boolean;
  ocr: boolean;
  metadataExtraction: boolean;
  recommendations: boolean;
  translation: boolean;
  accessibility: boolean;
  impactAnalytics: boolean;
  curatorAssistant: boolean;
}
```

| Capability | Noop | OpenAI | Anthropic | Local | pgvector | external-vdb |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| keyword/FTS search (baseline) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `semanticSearch` | – | ✓ | – | ✓ | ✓ | ✓ |
| `embeddings` | – | ✓ | – | ✓ | ✓¹ | ✓¹ |
| `ocr` | – | ✓ | ✓ | ✓ | – | – |
| `metadataExtraction` | – | ✓ | ✓ | ✓ | – | – |
| `recommendations` (graph) | ✓² | ✓ | ✓ | ✓ | ✓ | ✓ |
| `translation` | – | ✓ | ✓ | ✓ | – | – |
| `accessibility` | – | ✓ | ✓ | ✓ | – | – |
| `impactAnalytics` | ✓² | ✓ | ✓ | ✓ | ✓ | ✓ |
| `curatorAssistant` | – | ✓ | ✓ | ✓ | – | – |

`✓` = supported · `–` = `NOT_SUPPORTED`/`DISABLED` returned safely. ¹ vector *stores* hold embeddings produced by an embedding provider. ² **Noop still does graph-based recommendations and raw analytics** — the baseline never depends on AI.

---

## 7. Data design for later (embeddings + search escalation)

**Where embeddings live.** A dedicated, additive **`embeddings`** table — designed Postgres-ready (pgvector), serialized in SQLite now ([ADR-0001](adr/0001-data-backbone.md)). This generalizes the reserved `embedding vector(1536)` note in [architecture/15](../architecture/15-ai-and-blockchain-readiness.md) into a typed, multi-model home, so different entity types and models coexist and a re-embed is a backfill, not a migration.

```
embeddings (Postgres-ready; SQLite stores `vector` as serialized JSON/blob)
┌──────────────┬──────────────────────────────────────────────────────────┐
│ id           │ uuid pk                                                    │
│ entity_type  │ text   — IntelEntityType (artist|artwork|story|media|…)    │
│ entity_id    │ text   — Registry ID (PB-…)                                │
│ model        │ text   — pins the producing model (e.g. text-embedding-3)  │
│ dims         │ int    — vector length (e.g. 1536)                         │
│ vector       │ Postgres: vector(dims) (pgvector) · SQLite: blob/json      │
│ locale       │ text   — default 'en' (multilingual embeddings later)      │
│ source       │ text   — always 'ai' (provenance)                          │
│ created_at   │ text                                                       │
└──────────────┴──────────────────────────────────────────────────────────┘
  uq_embedding UNIQUE(entity_type, entity_id, model, locale)  -- re-embed = upsert
  ix_embedding_entity(entity_type, entity_id)
  (Postgres, later) ANN index (ivfflat/hnsw) on `vector`
```

`embeddings` is read by `SemanticSearch`/`Recommender` and written **only** by the out-of-band embedding worker. It is purely additive: deleting every row degrades semantic search to keyword/FTS — the app still works.

**How semantic search escalates** (consistent with `SearchRepository` in [architecture/15](../architecture/15-ai-and-blockchain-readiness.md) and the graph scale ladder in [03](03-knowledge-graph.md) §5.4):

```
   mode=keyword            mode=semantic / hybrid              at scale
 ┌───────────────┐   →   ┌─────────────────────┐   →   ┌────────────────────────┐
 │ Postgres FTS  │       │ pgvector ANN over    │       │ external vector DB     │
 │ (LIKE/FTS now)│       │ `embeddings` (PG)    │       │ (managed, sharded)     │
 └───────────────┘       └─────────────────────┘       └────────────────────────┘
   always available        feature-flag + backfill        provider swap only
```

Escalation is a **driver change, not a rewrite**: `SemanticSearch.query()` is stable; swapping FTS → pgvector → external touches only a provider. `hybrid` blends FTS rank with vector similarity.

---

## 8. How the platform consumes it (graceful degradation)

```
  /search?q=…&mode=semantic
        │
        ▼
  SearchRepository.search(q, mode)
        │  1) Postgres FTS                         → keyword hits (ALWAYS works)
        │  2) intelligence.search.query(...)
        │        ├─ Noop / DISABLED  → keyword hits only
        │        ├─ pgvector enabled → + vector hits, hybrid-ranked
        │        └─ PROVIDER_UNAVAILABLE → degrade to keyword; page never errors
        ▼
  SearchResults → rendered identically regardless of which provider ran
```

```
  Media ingest (out-of-band worker, never on the request path)
   media row created → enqueue jobs:
     intelligence.embeddings.embed([...])      → embeddings rows
     intelligence.accessibility.describeImage  → DRAFT media.altText  (source:'ai')
     intelligence.metadata.extract(...)        → DRAFT tags + suggested edges
   → all land in the human review/approval queue ("AI proposes, curators dispose")
   → if intelligence is Noop, jobs no-op; media still publishes with human metadata
```

The repository/service layer is the **only** caller of `IntelligenceService` (same discipline as [07](07-blockchain-abstraction-interface.md) §7). A render never blocks on a model; a disabled or unavailable provider is a normal, defined code path.

---

## 9. Privacy · ethics · cost · environment

- **Human-in-the-loop for curation (Principle VI).** Every *mutating* output is a **draft/proposal** with `reviewState:'draft'`; it is never `approved` without a human (`reviewedBy`). `humanInLoop` defaults `true`. AI **proposes, curators dispose** ([architecture/15](../architecture/15-ai-and-blockchain-readiness.md)).
- **Provenance of AI-generated metadata.** Every AI-authored field carries `AiProvenance` (`source:'ai'`, model, confidence) and is **audit-logged** + snapshotted to `revisions` like any write. AI output is always distinguishable from verified human/catalogue facts.
- **Never overwrite verified human records (Principle VI).** AI writes only to draft/overlay surfaces — `translations` overlays (never the English source), draft `media.altText`/`tags`, suggested (un-applied) `entity_links`. A record where `verified = true` is never silently mutated by AI.
- **Privacy / RLS.** The CuratorAssistant and analytics are **read-only and RLS-bounded** — they can never surface drafts or PII (consent gates, Principle IV). No PII is sent off-box when `LocalModelProvider` is selected; remote providers receive only the minimum public text required.
- **Cost controls.** `monthlyBudgetUsd` is a hard ceiling → `BUDGET_EXCEEDED` degrades gracefully (fall back to FTS/graph). All model work is **batched, out-of-band, idempotent** (re-embed = upsert) so cost is bounded and predictable. `RATE_LIMITED` is retriable.
- **Environmental posture.** Embeddings are computed once and cached (`embeddings` upsert); a `LocalModelProvider` keeps compute on-box; nothing runs on the request path. This mirrors the chain's "environmentally appropriate" constraint ([architecture/15](../architecture/15-ai-and-blockchain-readiness.md)) — intelligence serves memory, it does not waste.

`Technology serves memory. Technology serves trust. Technology serves people.`

---

## Open questions for approval

1. **`embeddings` as a single shared table** (this doc §7) vs the per-table reserved `embedding vector(1536)` column sketched in [architecture/15](../architecture/15-ai-and-blockchain-readiness.md)? (A shared table supports multi-model + multilingual embeddings without touching every table — recommended; confirm.)
2. **First concrete provider stack.** Embeddings: OpenAI vs local model (sovereign)? Vector store: pgvector (in-DB, simpler ops) vs external VDB (scale)? Curator assistant LLM: Anthropic vs local? (Interface is provider-agnostic either way.)
3. **OcrProvider ownership.** Confirm the layer **re-exports** the [05](05-certificate-verification-spec.md) §B.3 `OcrProvider` (one seam) rather than defining a parallel one.
4. **Auto-apply ceiling.** Is any AI output ever auto-applied (e.g. very-high-confidence alt-text for accessibility coverage), or is `humanInLoop` always required? (Default: always human.)
5. **Translation review workflow.** Do AI translation drafts enter the same `draft → in_review → published` workflow as content, and who approves per-locale (chapter-scoped reviewers)?
6. **Cost & residency policy.** Set `monthlyBudgetUsd`, and confirm a data-residency stance (which fields, if any, may be sent to a remote provider; default to local-only for PII-adjacent text).
7. **Capability surfacing.** Expose `capabilities()` on the public API (`/api/v1`) so external clients/agents self-discover what's enabled, or keep it internal? (Parallels [07](07-blockchain-abstraction-interface.md) open question 4.)
