# ADR-0010 — Intelligence Layer as an independent abstraction

**Status:** Accepted

## Context

Planet B is architected for **100+ countries, 500+ chapters, 50,000+ artists, 250,000+ artworks** ([00-README](../00-README.md)) plus certificates, videos, interviews, research, press, and media at preservation scale. At that scale, manual search and manual curation do not hold: keyword/FTS cannot answer meaning-based questions, tens of thousands of artworks each need alt-text/captions/tags, thousands of physical certificates must be read and matched ([05](../05-certificate-verification-spec.md)), and the archive is multilingual across a century ([ADR-0006](0006-i18n-strategy.md)).

The institution therefore needs to *prepare* for semantic search, embeddings, OCR, metadata extraction, recommendations, AI-assisted curation, translation, accessibility (alt-text/captions), impact analytics, archive exploration, and a curator assistant. But Principle VII (*blockchain-ready, not now*) and the same discipline applied to AI ([architecture/15 · AI & Blockchain Readiness](../../architecture/15-ai-and-blockchain-readiness.md)) demand that **no AI ships now**, that the archive works fully with intelligence switched off, that no vendor is baked into business logic, and that these capabilities can be added later as `feature flag + backfill + adapter` — **not a rewrite**. We must design the seam now without coupling any domain to an AI SDK or a specific model.

## Decision

**Introduce an independent Intelligence Layer behind a single `IntelligenceService` abstraction; the default provider is a `NoopIntelligenceService`; no AI is shipped.**

- The layer lives **beside** the application at `src/intelligence/` (path alias `@intelligence/*`), as a **cross-cutting `✦` layer** independent of Experience · Platform · Trust ([00-README](../00-README.md)). It is **not a domain** and is not a hard dependency of any domain.
- The whole app talks to **one `IntelligenceService` interface** (and its sub-services: `SemanticSearch`, `EmbeddingProvider`, `OcrProvider`, `MetadataExtractor`, `Recommender`, `Translator`, `AccessibilityAssistant`, `ImpactAnalytics`, `CuratorAssistant`). Domains, repositories, routes, and components depend on the interface and its **types**, obtained via `getIntelligenceService()` — **never on an AI SDK**. Only `src/intelligence/providers/*` may import a model/vector SDK (lint/boundary-enforced). This is the same discipline as the Repository Pattern ([ADR-0004](0004-repository-pattern.md)) and the Blockchain abstraction ([ADR-0007](0007-blockchain-abstraction.md)).
- **Noop by default; nothing AI runs out of the box.** `NoopIntelligenceService` is the default provider and every per-capability flag defaults OFF. Baseline keyword/FTS search, pure-graph recommendations ([03](../03-knowledge-graph.md)), and raw analytics still work under Noop. A bad config fails safe to Noop.
- **Providers are swappable and config/flag-driven** — OpenAI, Anthropic, a local/offline model, pgvector, and an external vector DB all slot behind the same interface and may be composed (embeddings + vector store + LLM). Adding a vendor is one `*.provider.ts` + a flag; zero changes elsewhere. **Business logic is never coupled to a vendor.**
- **Independence is structural:** the layer **reads** the archive through the existing repositories and the `graph.*` service; heavy work runs **out-of-band** (workers, never the request path); results are written back as **ordinary records/edges/embeddings** (an additive `embeddings` table, draft `media.altText`/`tags`, `translations` overlays, suggested `entity_links`). The Experience renders these as normal data and works identically whether or not intelligence ever ran.
- **AI proposes, curators dispose (Principle VI).** Every mutating output is a **draft/proposal** carrying `AiProvenance` (`source:'ai'`, model, confidence), is audit-logged + snapshotted to `revisions`, and is **never** auto-published or allowed to overwrite a verified human/catalogue fact. `humanInLoop` defaults true.
- Methods return a non-throwing `Result<T>` union (mirroring [07](../07-blockchain-abstraction-interface.md)), so a disabled/unavailable provider is a normal code path, not an error.

Full interface signatures and the data design are specified in [14 · Intelligence Layer](../14-intelligence-layer.md).

## Consequences

- **Positive:** Honors *AI-ready, not now* — intelligence is purely additive; the archive survives any provider's failure or our decision to switch, and ships today with zero AI.
- **Positive:** Vendor/model decisions are deferred and reversible; OpenAI/Anthropic/local/pgvector/external-VDB are swappable without touching any domain, route, or component.
- **Positive:** No restructuring later — turning on semantic search, OCR, translation, or the curator assistant is `flag + backfill + adapter` ([architecture/15](../../architecture/15-ai-and-blockchain-readiness.md)), exactly the maintainability mandate of Phase 2.
- **Positive:** Truth and provenance preserved — AI output is always flagged, audited, human-gated, and unable to overwrite verified facts (Principles VI/VIII).
- **Positive:** Privacy/cost/environment controllable by design — read-only RLS-bounded assistant, batched/cached/out-of-band compute, hard budget ceiling, local-model option for sovereignty.
- **Negative / cost:** An abstraction over a fast-moving AI ecosystem must be kept lean to avoid a lowest-common-denominator API; the sub-service surface is broader than the blockchain one and must be governed.
- **Negative:** A human-review queue and provenance/`reviewState` machinery is real engineering deferred (not free) before any AI output can be trusted into publication.
- **Negative:** Two result states (baseline vs intelligence-enhanced, e.g. keyword vs semantic search) must be presented coherently.

## Alternatives considered

1. **Bake AI into domains directly (import a model SDK inside features now).** Rejected: couples the archive to one vendor and to "now," scatters AI calls across the codebase, makes provider/model changes a rewrite, and risks AI mutating records without a review gate — violating the AI-ready-not-now and *curators dispose* principles.
2. **Per-feature ad-hoc AI calls (no shared abstraction).** Rejected: duplicates provider wiring, cost controls, provenance, and human-in-the-loop logic per feature; guarantees drift and inconsistent privacy/audit behavior; contradicts the *no duplicated logic* and *everything configurable* mandates ([00-README](../00-README.md)).
3. **Defer all design until AI is actually needed.** Rejected: without the seam designed now, adding intelligence later becomes a structural rewrite — the exact outcome Phase 2 ("build infrastructure before features", *flag + backfill + adapter*) exists to prevent. Designing the interface costs little now and preserves the option fully.
4. **A single monolithic "AIService" method bag** (no sub-services). Rejected: capabilities (search, OCR, translation, accessibility…) have independent providers, flags, and cost profiles; collapsing them prevents composing (e.g. pgvector + OpenAI + Anthropic) and independent Noop fallback per capability.
