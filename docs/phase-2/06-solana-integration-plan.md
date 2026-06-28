# 06 · Solana Integration Plan

> **Status: DESIGN — awaiting approval.** Nothing on-chain ships until the founder approves. The app must function perfectly **without** any chain; the chain only *adds* trust.

**Purpose.** Make the phased blockchain path of [13-blockchain-strategy.md](../13-blockchain-strategy.md) concrete on a chosen public chain (Solana-first), without ever coupling Planet B's business logic to that chain. This plan describes *what* gets anchored and minted, *when*, *how* the data is modelled, and *how* `/verify` resolves at each phase — while keeping the chain a replaceable implementation detail behind the [`BlockchainService`](07-blockchain-abstraction-interface.md) interface.

**Extends.** [13 · Blockchain Strategy](../13-blockchain-strategy.md) (phased hash→anchor→mint; Soulbound-not-tradable; custody-optional; environmental integrity) and [architecture/15 · AI & Blockchain Readiness](../architecture/15-ai-and-blockchain-readiness.md) (versioned canonical serialization; one `verify()` interface, two resolvers). Uses the canonical tables `chain_anchors`, `onchain_refs`, `verification_events` and the `PB-ANCHOR-…` identifier defined in [00-README.md](00-README.md). Companion to [07 · Blockchain Abstraction Interface](07-blockchain-abstraction-interface.md) and [ADR-0007](adr/0007-blockchain-abstraction.md).

---

## 1. The non-negotiables (inherited, restated as constraints on this plan)

1. **Blockchain is never built first.** Phase A ships with no chain at all. The default runtime provider is `NoopProvider` ([07](07-blockchain-abstraction-interface.md)); turning the chain on is a *feature flag + backfill + adapter*, never a redesign.
2. **No tight coupling to Solana.** No feature, repository, route, or component imports a Solana SDK. They depend only on `BlockchainService`. This file describes the `SolanaProvider` that lives *behind* that interface.
3. **Custody-optional.** An artist with no wallet is never excluded. Anchoring (Phase B) requires zero wallets from anyone. Minting (Phase C) offers a custodial wallet so a non-crypto-native artist gets the same credential as a crypto-native one.
4. **Environmental integrity first.** The chain must be low-emission (proof-of-stake or equivalent). A high-emission chain disqualifies itself regardless of any other merit (Principle: *it would be absurd for an environmental movement to use a high-emission chain*).
5. **Privacy.** Only **hashes and Merkle roots** ever touch the chain. **No PII, no bios, no images, no certificate bodies** are written on-chain. The chain proves *that a record existed and is unaltered*; the archive holds *what the record says*.
6. **The chain proves history; it never gates access or monetizes identity.** Soulbound = non-transferable. No marketplace, no floor price, no resale.

---

## 2. The phased path, made concrete

```
        OFF-CHAIN TRUST                ON-CHAIN TAMPER-EVIDENCE            ON-CHAIN CREDENTIAL
   ┌───────────────────────┐      ┌───────────────────────────┐     ┌─────────────────────────┐
   │  PHASE A  (NOW)        │      │  PHASE B  (LATER)         │     │  PHASE C  (FUTURE)      │
   │  Hash + signed manifest│ ───▶ │  Merkle-batch anchoring   │ ──▶ │  Soulbound credentials  │
   │  NoopProvider /        │      │  SolanaProvider.anchorBatch│     │  SolanaProvider.        │
   │  HashOnlyProvider      │      │  → chain_anchors          │     │  mintCredential         │
   │                        │      │  → verification_events    │     │  → onchain_refs         │
   │  verify = hash compare │      │  verify = hash + Merkle   │     │  verify = hash+Merkle+SBT│
   └───────────────────────┘      └───────────────────────────┘     └─────────────────────────┘
        no wallet, no chain            no wallet for anyone              custodial wallet optional
        fully functional               one tx per BATCH (not per cert)   one SBT per cert/identity
```

### Phase A — Off-chain hash + signed manifest (ships now)
- Every certificate already stores `verificationHash` = `sha256(canonical(CertificateClaimV1))` ([models/index.ts](../../models/index.ts)).
- Provider: `NoopProvider` (chain disabled, default) or `HashOnlyProvider` (publishes a **signed manifest** — a server-signed JSON listing `{publicId → verificationHash}` for issued certificates, plus a manifest version + signature).
- `/verify/{publicId}` recomputes the canonical hash from the live record and compares. `VerificationResult.hashValid` reflects this; `onChain` is `false`.
- **No wallet, no chain, no gas. Fully functional verification today.** This is the baseline Phase 2 ships with.

### Phase B — Merkle-batch anchoring (first on-chain step)
- A scheduled **anchoring batch worker** collects all certificate hashes issued/changed since the last anchor, builds a **Merkle tree**, and writes **only the Merkle root** to the chain in **one transaction per batch** (not per certificate → no per-cert gas).
- Persists a `chain_anchors` row (`anchor_id = PB-ANCHOR-…`, `merkle_root`, `member_count`, `provider`, `tx_ref`, `anchored_at`, `status`) and appends `verification_events` rows.
- `/verify` now returns, in addition to the off-chain hash check, a **Merkle inclusion proof**: the leaf (`verificationHash`) + sibling path + the anchored root + the on-chain `tx_ref`. Anyone can independently confirm the certificate's hash was committed at anchor time and has not changed since.
- **Still custody-free for artists.** No artist needs a wallet; only the platform's anchoring key signs the batch tx.

### Phase C — Mint Soulbound credentials
- When the network/partners want it, mint **one non-transferable credential per certificate (and, later, per identity / artwork / chapter)** to a holder address — or to a **custodial wallet** for those without one.
- Fills the generic `onchain_refs` table (`entity_type`, `entity_id`, `provider`, `token_ref`, `kind = 'sbt'`, `minted_at`) — the typed, generalized home for `certificates.soulbound_ref`. The legacy `certificates.soulbound_ref` column is kept in sync as a denormalized convenience but `onchain_refs` is the source of truth across entity types.
- `/verify` resolves all three layers: off-chain hash + Merkle inclusion + live SBT lookup (`resolve(onchainRef)`).

> Phases are independent feature flags. Phase B can run for a year before Phase C is ever enabled. Disabling Phase C (or B) is a no-op that reverts `/verify` to the earlier resolver set — see §8.

---

## 3. Why Solana — and why it stays a *choice*

Solana is the **recommended first implementation**, **not** an architectural commitment. It is selected against the inherited criteria in [13](../13-blockchain-strategy.md):

| Criterion (from Phase 1) | Why Solana fits | What it does **not** lock us into |
|---|---|---|
| Low/zero fees | Sub-cent tx; batch anchoring makes per-cert cost effectively zero | We still batch, so any chain's fee is amortized |
| Energy posture | Proof-of-stake; low energy per tx (publishes a sustainability/energy report) | Criterion #4 is the gate — any compliant PoS chain qualifies |
| SBT / credential standards | Non-transferable token patterns via `freeze`/non-transfer extensions; emerging verifiable-credential tooling | Modelled conceptually (§5) so it ports to other VC standards |
| Custodial-friendly | Cheap account creation makes custodial wallets feasible at scale | Custody is our concept, not Solana's; portable |
| Longevity / ecosystem | Active ecosystem + grant programs aligned with public goods (§9) | Grant-readiness is a bonus, not a dependency |

**What would make us switch** (documented so the decision is reversible):
- Solana's energy posture regresses or a materially greener compliant chain emerges.
- A standardized, widely-verified **W3C Verifiable Credential** rail (with a green settlement layer) becomes the interoperable norm — we would prefer the standard over a chain-specific SBT.
- Fee, uptime, or finality characteristics degrade below our anchoring SLA.
- A partner/grantor requires a specific chain.

Because everything lives behind `BlockchainService`, switching is **add a new provider + re-anchor going forward**; historical anchors remain independently verifiable via their recorded `provider` + `tx_ref`.

---

## 4. On-chain vs off-chain — the data boundary (privacy)

```
   OFF-CHAIN (Planet B archive — Postgres/SQLite + Storage)     ON-CHAIN (public ledger)
   ┌───────────────────────────────────────────────┐           ┌──────────────────────────┐
   │ certificates  (publicId, person, role, …)      │           │  Merkle ROOT (32 bytes)  │
   │ CertificateClaimV1  (the canonical hashed doc) │  hash ──▶  │  per chain_anchors batch │
   │ verification_hash  (sha256 of the claim)       │           │                          │
   │ PII / bios / images / PDF certificate          │  NEVER ──▶ │  (nothing — never)       │
   │ chain_anchors (root, tx_ref, member_count)     │ ◀── tx_ref│  SBT account / PDA       │
   │ onchain_refs  (token_ref per entity)           │ ◀── token │  (holds only an id/hash) │
   └───────────────────────────────────────────────┘           └──────────────────────────┘
```

**Rule:** the chain stores the *minimum proof* — a 32-byte Merkle root per batch, and (Phase C) a credential account whose on-chain payload is at most an identifier + the certificate hash. Everything human-readable stays off-chain. Reversing a hash to recover PII is infeasible; a root reveals nothing about members. This satisfies Principle IV (no one is exposed) and data-protection obligations even though the ledger is public.

---

## 5. SBT modelling on Solana (conceptual)

Described at a conceptual level only — no SDK, no implementation; the `SolanaProvider` realizes this behind the interface.

- A **credential** is a **non-transferable** token: once issued to a holder/custodial address, transfer is disabled (frozen / non-transfer extension). It is recognition, not a tradable asset.
- Each credential is addressed by a deterministic **PDA (Program Derived Address)** derived from a stable seed set — conceptually `seeds = ["planet-b-cred", entity_type, registry_id, version]` — so the same certificate always maps to the same credential account, and `resolve()` can find it without an off-chain index.
- The credential account's on-chain data is limited to: a **schema/version tag**, the **entity reference** (Registry ID), and the **certificate hash** (the same `verificationHash`). No PII.
- Revocation is expressed on-chain as a **status flag** (or a revocation attestation), mirroring `certificate.status = 'revoked'` off-chain — **never a burn/delete** (Principle: nothing is hard-deleted; revocation is a status).
- `onchain_refs.kind` distinguishes `sbt` (credential), `anchor` (batch membership), and `attestation` (e.g. impact/provenance claims, future).

```
  Certificate (off-chain)              Credential PDA (on-chain, non-transferable)
  ┌────────────────────────┐          ┌─────────────────────────────────────────┐
  │ publicId PB-ABJ-2026-002│  seed ─▶ │ PDA(["planet-b-cred","cert",            │
  │ verificationHash 0x…    │          │      "PB-CERT-000002", v1])             │
  │ status issued|revoked   │ ───────▶ │ { schemaV, registryId, certHash,        │
  └────────────────────────┘          │   nonTransferable: true, revoked: false}│
            │                          └─────────────────────────────────────────┘
            └── onchain_refs(entity=cert, kind='sbt', token_ref=PDA, provider='solana')
```

---

## 6. Merkle anchoring design

- **Leaf** = `verificationHash` of a certificate (already canonical & versioned via `CertificateClaimV1`). Leaves are sorted by `publicId` for deterministic tree construction.
- **Tree** = binary Merkle tree over the leaf set of one batch; domain-separated leaf/node hashing to prevent second-preimage attacks.
- **Root** → written on-chain in one tx; recorded in `chain_anchors.merkle_root` + `tx_ref`.
- **Proof** = for any certificate, `/verify` returns the leaf + sibling path + root + `tx_ref`. The proof is independently checkable by a third party with no access to Planet B systems.
- **Membership index** = `onchain_refs` (or a batch-membership join) records which anchor a certificate belongs to, so `/verify` can locate the proof in O(1).
- **Append-only**: a new batch never rewrites an old root. A re-issued/corrected certificate gets a **new hash** and is included in a **future** batch; the prior anchor still truthfully attests the prior state (history is preserved, not erased).

---

## 7. Operational design

**Anchoring batch worker (Phase B+).**
- Cadence: **configurable**; default a scheduled job (e.g. daily or on threshold of N pending certificates, whichever first). Cadence is a config value, not code.
- Idempotent: re-running with no new/changed hashes is a no-op; a crashed run resumes from `chain_anchors.status` (`pending → submitted → confirmed | failed`).
- Writes `verification_events` for every submit/confirm/fail.

**Key management.**
- Phase B: a single **anchoring key** (platform-held, HSM/KMS-backed) signs batch txs. It can write roots; it cannot touch certificates or identities.
- Phase C: a **minting key** plus, for custodial holders, a **custodial-wallet keystore** (KMS-encrypted, per-holder derivation). Keys are rotatable; rotation is recorded in `verification_events`. No private key is ever stored in the app DB or repo.

**Cost model.**
- Phase A: $0 (off-chain).
- Phase B: ~one tx per batch → cost is **per batch, not per certificate**; at 250,000 certificates this is still a handful of tx/day. Effectively negligible on a low-fee chain.
- Phase C: one tx per credential mint (amortizable; custodial account rent is small on Solana). Minting is opt-in/partner-driven, so cost scales with intent.

**What `/verify` resolves at each phase.**

| Phase | Resolvers run | `VerificationResult` |
|---|---|---|
| A | Off-chain hash compare | `hashValid`, `onChain=false`, `soulboundRef=null` |
| B | Hash compare **+** Merkle inclusion proof (root + tx_ref) | `hashValid`, plus anchor proof block; `onChain` reflects anchor presence |
| C | Hash + Merkle **+** live SBT `resolve(onchainRef)` | `hashValid`, `onChain=true`, `soulboundRef` filled |

**Feature flags.** `BLOCKCHAIN_PROVIDER` (`noop | hashonly | solana | …`), `BLOCKCHAIN_ANCHORING_ENABLED`, `BLOCKCHAIN_MINTING_ENABLED`. See the capability matrix in [07 §capability matrix](07-blockchain-abstraction-interface.md).

**Rollback / no-op when chain is disabled.**
- Setting provider to `noop` makes every chain method a safe no-op: `anchorBatch` returns "skipped", `mintCredential` returns "skipped", `resolve` returns "not found", and `verifyCertificate` falls back to the off-chain hash resolver. **No route, page, or repository changes; the app is fully functional.**
- Disabling minting after Phase C does not invalidate already-minted credentials; `/verify` simply stops attempting new mints. Disabling anchoring leaves historical anchors verifiable.

---

## 8. Failure & degradation behavior

- **Chain unreachable / tx fails:** anchoring marks the batch `failed` and retries next cadence; `/verify` transparently degrades to the off-chain hash resolver. Trust is *reduced to baseline*, never broken.
- **Provider misconfigured:** falls back to `NoopProvider` (fail-safe to "app works, no chain"), logs a `verification_events` warning.
- **Mint fails for a custodial holder:** certificate remains valid off-chain; the credential is retried; the artist is never blocked.

---

## 9. Grant-readiness (Solana ecosystem & public-goods funders)

This plan is structured to make Planet B a strong candidate for public-goods / cultural-heritage grants:

- **Verifiable credentials for culture:** non-transferable, privacy-preserving recognition of real human contribution — a public-goods use of an SBT, not speculation.
- **Transparent, low-emission impact:** environmental-impact attestations and anchored certificate roots make the movement's claims independently auditable on a low-energy chain — coherent with the movement's own thesis.
- **Open verification:** `/verify` is public, and proofs are independently checkable without Planet B's servers (root + Merkle path + tx_ref). This "don't trust, verify" property is exactly what ecosystem grants reward.
- **Inclusion by design:** custodial wallets demonstrate onboarding of non-crypto-native creators across 100+ countries — a credible adoption + accessibility story.
- **Open, documented architecture:** this design package + the provider abstraction show the work is reproducible and not vendor-locked.

> Grant funding is a *benefit of* the architecture, never a *driver of* it. If no grant materializes, Phases A–B still ship and still add trust.

---

## Open questions for approval

1. **Provider for Phase B first run:** start anchoring with `SolanaProvider`, or stand up `HashOnlyProvider` (signed manifest) as an intermediate public artifact first?
2. **Anchoring cadence default:** time-based (daily) vs threshold-based (every N certificates) vs hybrid — and what N / interval?
3. **Custodial wallet policy (Phase C):** do we custody by default for everyone and let artists "export" later, or only custody on explicit request?
4. **Scope of credentials in Phase C:** certificates only first, or also identity (Passport) / artwork provenance / chapter lineage at the same time?
5. **Revocation on-chain:** status-flag on the credential account vs a separate revocation attestation — which better satisfies auditors?
6. **Signed-manifest publication:** where is the Phase A/B manifest hosted (in-app route, IPFS/Arweave mirror, both) and how is the signing key disclosed for public verification?
7. **Energy reporting:** do we commit to publishing a periodic energy/emissions note for our anchoring activity as part of the impact layer?
