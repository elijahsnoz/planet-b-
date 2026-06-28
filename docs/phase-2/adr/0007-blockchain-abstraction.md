# ADR-0007 — Blockchain abstraction, Solana-first, custody-optional

**Status:** Proposed

## Context

Planet B's Trust Layer wants verifiable, tamper-evident provenance — but Principle VII is explicit: **blockchain-ready, not now**. A real institution cannot have its core archive depend on a volatile chain, a custodial wallet, or a single vendor. Phase 1 already encodes this: `certificates.verification_hash` works off-chain today, `soulbound_ref` is nullable until a token is minted later. Phase 2 must design the on-chain story without coupling the app to it: the archive must work fully with the chain switched off, the chain choice must be swappable, and we must not be forced into custody decisions prematurely.

## Decision

**Introduce a `BlockchainService` abstraction; target Solana first; make custody optional; the app works without any chain.**

- All on-chain interaction goes through a single `BlockchainService` interface (anchor a Merkle batch, mint/attest, resolve a reference, verify). Features depend on the interface, never on a chain SDK — the same discipline as the Repository Pattern ([ADR-0004](0004-repository-pattern.md)).
- **Solana-first** as the initial concrete provider ([06 · Solana Integration Plan](../06-solana-integration-plan.md)); other providers (or a no-op) can be dropped in behind the interface.
- **Custody-optional:** the design supports both members holding their own wallets and a custodial model; custody is a configuration/provider choice, not an architectural assumption. Custodial keys, if used, live in HSM/KMS and never touch the app DB or environment ([11 · Security](../11-security-review.md) §2.6).
- **Chain-off by default:** anchoring/minting sits behind a feature flag. With it off, `verification_hash` provides off-chain verification and the whole institution operates normally. On-chain data is **hashes/roots only, never PII**.
- Persistence is typed and chain-agnostic: `chain_anchors` (`anchor_id = PB-ANCHOR-…`, `merkle_root`, `member_count`, `provider`, `tx_ref`, `status`), `onchain_refs` (`entity_type`, `entity_id`, `provider`, `token_ref`, `kind = sbt | anchor | attestation`), and `verification_events` (append-only log of verify/claim/anchor/mint).

## Consequences

- **Positive:** Honors Principle VII — the chain is additive tamper-evidence, never a dependency; the archive survives any chain's failure or our decision to switch.
- **Positive:** Vendor- and custody-decisions are deferred and reversible; Solana can be replaced without touching feature code.
- **Positive:** Privacy-by-design and grant-readiness: only hashes on chain means full public transparency with zero PII exposure ([11 · Security](../11-security-review.md) §4).
- **Negative / cost:** An abstraction layer over a fast-moving ecosystem must be kept lean to avoid lowest-common-denominator APIs; Merkle batching/anchoring is real engineering deferred, not free.
- **Negative:** Two verification states (off-chain hash vs on-chain anchor) must be presented coherently at `/verify`.

## Alternatives considered

1. **Integrate a Solana SDK directly in features now.** Rejected: couples the archive to one chain and to "now," violating Principle VII.
2. **No blockchain at all.** Rejected: forgoes the tamper-evidence and verifiable-credential story that underpins institutional and grant credibility.
3. **EVM/another chain first.** Deferred, not rejected: the abstraction makes the provider swappable; Solana is the chosen first target per [06](../06-solana-integration-plan.md), and the interface keeps the door open.
