# 07 · Blockchain Abstraction Interface

> **Status: DESIGN — awaiting approval.** Type signatures only — **no implementations**. The interface ships designed; the providers are built later behind it. The app depends on this interface, never on a chain SDK.

**Purpose.** Define the single, provider-agnostic `BlockchainService` interface (and its result/error types) that the entire application talks to for trust operations — so the chain is a **replaceable implementation detail**. Any provider (none, off-chain hashing, Solana, Ethereum/Polygon/…) can be selected by config without touching a feature, repository, route, or component. This is the contract that makes [13](../13-blockchain-strategy.md)'s "design now, build later" and the [06 Solana plan](06-solana-integration-plan.md) actually decoupled.

**Extends.** [13 · Blockchain Strategy](../13-blockchain-strategy.md) (one `verify()` interface, two/three resolvers; custody-optional) and [architecture/15 · AI & Blockchain Readiness](../architecture/15-ai-and-blockchain-readiness.md) (versioned canonical serialization; flag + adapter, not redesign). Reuses `VerificationResult`, `Certificate`, `CertificateClaimV1` from [models/index.ts](../../models/index.ts) and the canonical tables `chain_anchors` / `onchain_refs` / `verification_events` + `PB-ANCHOR-…` from [00-README.md](00-README.md). Realized by the providers in [06](06-solana-integration-plan.md); decision recorded in [ADR-0007](adr/0007-blockchain-abstraction.md).

---

## 1. Where it lives (feature-based architecture)

```
src/features/blockchain/
├── index.ts                     # public surface: getBlockchainService(), types
├── blockchain.types.ts          # OnchainRef, AnchorResult, MintResult, errors, capabilities
├── blockchain.service.ts        # the BlockchainService interface (this doc)
├── blockchain.config.ts         # provider selection from env/flags (zod-validated)
├── serialization/
│   └── claim.canonical.ts       # versioned canonical serialization rule (§8)
└── providers/
    ├── noop.provider.ts         # DEFAULT — chain disabled, app fully works
    ├── hashonly.provider.ts     # off-chain signed manifest
    ├── solana.provider.ts       # later (Phase B/C) — the ONLY file that imports a Solana SDK
    └── evm.provider.ts          # illustrative — Ethereum/Polygon, same interface
```

**Decoupling rule (enforced by lint/boundary check):** *only* `providers/*.provider.ts` may import a chain SDK. Everything else — features, repositories, server actions, routes, components — imports `getBlockchainService()` and the **types**, never a chain library. The rest of the app cannot tell which chain (if any) is live.

```
   Routes / Server Actions / Components
                 │  (depend on interface + types only)
                 ▼
        VerificationRepository ─────────────▶ getBlockchainService(): BlockchainService
        CertificateRepository                          │  (selected by config flag)
                 │                          ┌──────────┼───────────┬───────────┐
                 │ (read/write archive)     ▼          ▼           ▼           ▼
                 ▼                       Noop      HashOnly      Solana       EVM…
        Storage (Postgres/SQLite)      (default)  (manifest)  (Phase B/C)  (illustrative)
        chain_anchors · onchain_refs · verification_events
```

The Repository/service layer is the **only** caller of `BlockchainService`. A feature asks its repository to "issue + (maybe) anchor a certificate"; the repository persists to the archive (source of truth) and *then* asks the service to anchor/mint. If the service is `Noop`, the archive write still succeeds and the app is fully functional — the chain is purely additive.

---

## 2. Result & error types (no exceptions for expected outcomes)

All chain operations are fallible and frequently *intentionally skipped* (Noop). They return an explicit **result union**, never throw for expected conditions, so business logic always has a defined path and the app never breaks when the chain is off.

```ts
// src/features/blockchain/blockchain.types.ts
import type { VerificationResult } from "@/models"; // reused, not redefined

/** Which provider produced a result (matches chain_anchors.provider / onchain_refs.provider). */
export type BlockchainProviderId = "noop" | "hashonly" | "solana" | "evm" | (string & {});

/** The on-chain kinds Planet B recognizes (mirrors onchain_refs.kind). */
export type OnchainRefKind = "sbt" | "anchor" | "attestation";

/** Entities that can be anchored/credentialed (mirrors onchain_refs.entity_type). */
export type AnchorableEntityType = "certificate" | "artist" | "artwork" | "chapter";

/** A generic, provider-agnostic pointer to something on a chain (row shape of onchain_refs). */
export interface OnchainRef {
  entityType: AnchorableEntityType;
  entityId: string;            // Registry ID, e.g. "PB-CERT-000002"
  provider: BlockchainProviderId;
  kind: OnchainRefKind;
  tokenRef: string;            // PDA / token id / attestation id (opaque to callers)
  mintedAt?: string;           // ISO; absent until confirmed
}

/** A Merkle inclusion proof returned by /verify once a cert is anchored (Phase B+). */
export interface MerkleProof {
  anchorId: string;            // PB-ANCHOR-…
  leaf: string;                // the certificate verificationHash
  root: string;                // chain_anchors.merkle_root
  siblings: string[];          // ordered sibling hashes
  txRef: string;               // chain_anchors.tx_ref — independently checkable
  provider: BlockchainProviderId;
}

/** Typed, non-throwing error categories. */
export type BlockchainErrorCode =
  | "DISABLED"            // provider is Noop / feature flag off → expected no-op
  | "NOT_FOUND"          // no on-chain ref for this entity
  | "NOT_SUPPORTED"      // provider lacks this capability (see CapabilityMatrix)
  | "UNVERIFIED"         // hash/proof did not validate
  | "CHAIN_UNAVAILABLE"  // RPC/network failure — degrade to off-chain
  | "TX_FAILED"          // submitted but not confirmed
  | "MISCONFIGURED"      // bad keys/config — fail safe to Noop
  | "REVOKED";           // entity is revoked on-chain/off-chain

export interface BlockchainError {
  code: BlockchainErrorCode;
  message: string;
  retriable: boolean;
  provider: BlockchainProviderId;
  cause?: unknown;
}

/** Discriminated result so callers branch exhaustively and never crash on a disabled chain. */
export type Ok<T> = { ok: true; value: T; provider: BlockchainProviderId };
export type Err = { ok: false; error: BlockchainError };
export type Result<T> = Ok<T> | Err;

/** Lifecycle of a batch anchor (mirrors chain_anchors.status). */
export type AnchorStatus = "skipped" | "pending" | "submitted" | "confirmed" | "failed";

export interface AnchorResult {
  anchorId: string;            // PB-ANCHOR-…
  status: AnchorStatus;        // "skipped" when provider is Noop
  merkleRoot?: string;
  memberCount: number;
  txRef?: string;
  anchoredAt?: string;         // ISO
  provider: BlockchainProviderId;
}

export type MintStatus = "skipped" | "pending" | "minted" | "failed";

export interface MintResult {
  ref?: OnchainRef;            // present when minted
  status: MintStatus;          // "skipped" when provider is Noop
  custodial: boolean;          // true when minted to a Planet-B custodial wallet
  provider: BlockchainProviderId;
}
```

---

## 3. The `BlockchainService` interface

The methods from the brief — `verifyCertificate`, `mintCredential`, `verifyArtwork`, `verifyChapter`, `hashArchive` — plus `anchorBatch` and `resolve`. Every method returns a `Result<…>`; none throw for expected conditions. `verify*` reuses `VerificationResult` from models.

```ts
// src/features/blockchain/blockchain.service.ts
import type { VerificationResult, CertificateClaimV1 } from "@/models";
import type {
  Result, OnchainRef, AnchorResult, MintResult, MerkleProof,
  AnchorableEntityType, BlockchainProviderId,
} from "./blockchain.types";
import type { CapabilityMatrix } from "./blockchain.capabilities";

/** Verification enriched with optional chain proofs. Off-chain fields come from
 *  models.VerificationResult; chain fields are populated only at Phase B/C. */
export interface ChainVerification extends VerificationResult {
  proof?: MerkleProof;         // present once anchored (Phase B+)
  ref?: OnchainRef;            // present once minted (Phase C)
}

/** A request to anchor a batch of certificate hashes (Phase B). */
export interface AnchorRequest {
  members: Array<{ entityId: string; hash: string }>; // leaf set (sorted by entityId)
  entityType: AnchorableEntityType;                    // typically "certificate"
}

/** A request to mint one Soulbound credential (Phase C). custody-optional. */
export interface MintRequest {
  entityType: AnchorableEntityType;
  entityId: string;            // Registry ID
  hash: string;                // the certificate verificationHash
  holderAddress?: string;      // omitted ⇒ provider creates/uses a custodial wallet
}

/**
 * The one interface the whole app depends on. Providers implement it.
 * No method throws for expected conditions — they return Result<…>.
 */
export interface BlockchainService {
  /** Self-describing: who am I and what can I do (drives feature flags + /verify UI). */
  readonly providerId: BlockchainProviderId;
  capabilities(): CapabilityMatrix;

  // ── verification (read) — works at every phase, degrades gracefully ──────────
  /** Resolve a certificate's trust: off-chain hash now; +Merkle (B); +SBT (C). */
  verifyCertificate(publicId: string): Promise<Result<ChainVerification>>;
  /** Provenance verification for an artwork (Registry ID), future-extended. */
  verifyArtwork(registryId: string): Promise<Result<ChainVerification>>;
  /** Lineage verification for a chapter (Registry ID), future-extended. */
  verifyChapter(registryId: string): Promise<Result<ChainVerification>>;

  // ── hashing / serialization — available even with the chain OFF ─────────────
  /** Canonical, versioned hash of a single claim (the Phase A baseline). */
  hashClaim(claim: CertificateClaimV1): Promise<Result<string>>;
  /** Hash a snapshot of the whole archive (or a subset) → a manifest root for
   *  signed-manifest publication / tamper-evidence even before anchoring. */
  hashArchive(input: ArchiveDigestInput): Promise<Result<ArchiveDigest>>;

  // ── anchoring (write) — Phase B; no-op under Noop ───────────────────────────
  /** Build a Merkle tree of member hashes and write ONLY the root on-chain. */
  anchorBatch(req: AnchorRequest): Promise<Result<AnchorResult>>;

  // ── minting (write) — Phase C; custody-optional; no-op under Noop ────────────
  /** Mint one non-transferable Soulbound credential. holderAddress optional. */
  mintCredential(req: MintRequest): Promise<Result<MintResult>>;

  // ── resolution (read) — Phase B/C ───────────────────────────────────────────
  /** Look up the live on-chain state for a stored OnchainRef (status, revoked…). */
  resolve(ref: OnchainRef): Promise<Result<ResolvedRef>>;
}

/** Input/Output for hashArchive — a stable, ordered digest of selected records. */
export interface ArchiveDigestInput {
  entityType?: AnchorableEntityType;   // omit ⇒ certificates (default scope)
  asOf?: string;                       // ISO snapshot boundary
}
export interface ArchiveDigest {
  root: string;                        // Merkle root of the selected, canonicalized set
  memberCount: number;
  algorithm: "sha256";
  serializationVersion: number;        // see §8 — pinned, e.g. 1
  generatedAt: string;                 // ISO
}

/** Live, resolved view of an on-chain ref (for /verify display). */
export interface ResolvedRef {
  ref: OnchainRef;
  exists: boolean;
  transferable: false;                 // Soulbound — always non-transferable
  revoked: boolean;                    // mirrors certificate.status === "revoked"
  raw?: unknown;                       // provider-specific, opaque to callers
}
```

---

## 4. The swappable providers

All four implement the **same** `BlockchainService`. Selection is config-only.

| Provider | Phase | Behavior | Imports a chain SDK? |
|---|---|---|---|
| **`NoopProvider`** | A (default) | Chain disabled. `verify*` runs the **off-chain hash resolver only**; `anchorBatch`/`mintCredential` return `status:"skipped"`; `resolve` returns `NOT_FOUND`. **App fully works.** | No |
| **`HashOnlyProvider`** | A | Off-chain. Computes hashes, builds/serves a **signed manifest** (`hashArchive`), verifies by hash + manifest signature. Still no chain. | No |
| **`SolanaProvider`** | B / C | Real anchoring + minting (custodial-friendly). The **only** module allowed to import a Solana SDK. | Yes (isolated) |
| **`EvmProvider`** *(illustrative)* | B / C | Same interface on Ethereum/Polygon (low-emission L2) to prove portability. Would slot in identically. | Yes (isolated) |

**Adding Ethereum/Polygon/others** = create one `*.provider.ts` implementing `BlockchainService`, register its `providerId` in config, set the flag. **Zero changes** elsewhere. Historical anchors remain verifiable because each `chain_anchors` / `onchain_refs` row records its own `provider` + `tx_ref`.

### Selection via config / feature flag

```ts
// src/features/blockchain/blockchain.config.ts (zod-validated at boot)
export interface BlockchainConfig {
  provider: BlockchainProviderId;   // env BLOCKCHAIN_PROVIDER; default "noop"
  anchoringEnabled: boolean;        // env BLOCKCHAIN_ANCHORING_ENABLED; default false
  mintingEnabled: boolean;          // env BLOCKCHAIN_MINTING_ENABLED;   default false
  serializationVersion: number;     // pinned canonical version (§8); default 1
}

/** Factory — the single entry point the app uses. Falls back to Noop on
 *  MISCONFIGURED so a bad config never takes the app down. */
export declare function getBlockchainService(config?: BlockchainConfig): BlockchainService;
```

> Default config = `provider:"noop", anchoringEnabled:false, mintingEnabled:false`. **Out of the box, the app ships with no chain and works perfectly.**

---

## 5. Capability / feature-flag matrix

A provider declares what it supports; `/verify` and admin UI read this to show only honest affordances, and the repository layer guards calls (a `NOT_SUPPORTED` is impossible to mis-call).

```ts
// src/features/blockchain/blockchain.capabilities.ts
export interface CapabilityMatrix {
  hashClaim: boolean;
  hashArchive: boolean;
  signedManifest: boolean;
  anchorBatch: boolean;
  mintCredential: boolean;
  custodialWallets: boolean;
  resolveOnchain: boolean;
  revocationOnchain: boolean;
}
```

| Capability | Noop | HashOnly | Solana | Evm* |
|---|:--:|:--:|:--:|:--:|
| `hashClaim` (off-chain verify) | ✓ | ✓ | ✓ | ✓ |
| `hashArchive` | ✓ | ✓ | ✓ | ✓ |
| `signedManifest` | – | ✓ | ✓ | ✓ |
| `anchorBatch` (Merkle root) | – | – | ✓ | ✓ |
| `mintCredential` (SBT) | – | – | ✓ | ✓ |
| `custodialWallets` (custody-optional) | – | – | ✓ | ✓ |
| `resolveOnchain` | – | – | ✓ | ✓ |
| `revocationOnchain` | – | – | ✓ | ✓ |

`✓` = supported · `–` = `NOT_SUPPORTED` (or `DISABLED`) returned safely. Note: **off-chain verification (`hashClaim`) is supported by every provider including Noop** — the trust baseline never depends on a chain.

---

## 6. How `/verify` consumes it (graceful degradation)

```
  /verify/{publicId}
        │
        ▼
  VerificationRepository.verify(publicId)
        │  1) recompute canonical hash from live record  → hashValid  (ALWAYS)
        │  2) service.verifyCertificate(publicId)
        │         ├─ Noop      → hashValid only
        │         ├─ Solana B  → + MerkleProof (root, txRef)
        │         └─ Solana C  → + ResolvedRef (SBT live state)
        ▼
  ChainVerification → page shows: hash ✓, anchor ✓ (proof link), credential ✓
                      and writes a verification_events row (append-only audit)
```

If the chain call returns `CHAIN_UNAVAILABLE`, step 1's `hashValid` still renders — **trust degrades to baseline, the page never errors.**

---

## 7. How the repository stays decoupled (call shape)

```ts
// Illustrative SHAPE only — repository methods, not implementations.
export interface VerificationRepository {
  verify(publicId: string): Promise<ChainVerification>;          // hash + (chain if any)
  recordEvent(event: VerificationEventInput): Promise<void>;     // → verification_events
}

export interface CertificateRepository {
  issue(input: IssueCertificateInput): Promise<Certificate>;     // archive write (always)
  // anchoring/minting are SEPARATE, flag-gated, post-write steps — never block issue():
  anchorPending(): Promise<AnchorResult>;                        // batch worker entry (Phase B)
  mintFor(publicId: string, holderAddress?: string): Promise<MintResult>; // (Phase C)
}
```

`issue()` succeeds without any chain. `anchorPending()` / `mintFor()` are additive and call `BlockchainService`; under Noop they no-op. No repository imports a chain SDK.

---

## 8. Canonical, VERSIONED serialization (a 2026 hash still validates in 2050)

The one rule everything hashes through. It is **versioned** so old hashes remain reproducible forever even as the schema evolves.

```ts
// src/features/blockchain/serialization/claim.canonical.ts

/** Versioned canonical forms. v1 == models.CertificateClaimV1. A new field ⇒
 *  a NEW version (v2), never a mutation of v1 — old hashes stay reproducible. */
export type SerializationVersion = 1; // extend as a UNION (1 | 2 | …), never edit a past member

/** The deterministic serialization contract (rules, encoded as types/JSDoc):
 *  - UTF-8, JSON with keys in the FIXED order declared by CertificateClaimV1
 *  - no insignificant whitespace; no locale/number-format ambiguity
 *  - dates as ISO "YYYY-MM-DD"; null vs absent is explicit and stable
 *  - the leading `v` field pins the version that produced the hash
 *  - algorithm: sha256(canonicalBytes) → lowercase hex
 */
export interface CanonicalSerializer<TClaim> {
  readonly version: SerializationVersion;
  /** Stable byte serialization — deterministic for a given (version, claim). */
  serialize(claim: TClaim): Promise<Uint8Array>;
  /** sha256 of serialize() → lowercase hex; equals certificates.verificationHash. */
  digest(claim: TClaim): Promise<string>;
}

/** Resolve the serializer that produced a stored hash, by its pinned version,
 *  so verification in 2050 replays the exact 2026 rules. */
export declare function serializerFor(version: SerializationVersion): CanonicalSerializer<unknown>;
```

**Invariants:** (1) past versions are **frozen** — schema growth adds `v2`, never edits `v1`; (2) the version is stored alongside every hash/root (in `chain_anchors` and via the claim's `v`); (3) verification always replays the *original* version. This is the same `CertificateClaimV1` guarantee from [models/index.ts](../../models/index.ts), generalized to a versioned registry.

---

## Open questions for approval

1. **Result vs exceptions:** confirm the non-throwing `Result<T>` union (so a disabled chain is a normal code path) over try/catch at call sites.
2. **`hashArchive` scope:** default to certificates only, or support per-entity-type archive digests (artworks, chapters) from day one?
3. **`verifyArtwork` / `verifyChapter` data:** what exactly is hashed for provenance/lineage (which Registry-ID-keyed fields), and is that a `ClaimV?` schema we define now or at Phase C?
4. **Capability matrix surfacing:** expose `capabilities()` on the public API (`/api/v1`) so external verifiers can self-discover what's provable, or keep it internal?
5. **Provider registry:** allow third-party/partner providers to register at runtime, or restrict to a compiled allowlist for supply-chain safety?
6. **Custodial holder addressing:** when `holderAddress` is omitted, what is the custodial-wallet derivation/identity key — Passport ID (`PB-ID-…`) or a separate keystore id?
7. **Serialization version bump policy:** who approves a `v1 → v2` change, and do we re-anchor historical certs under the new version or leave them pinned to their original?
