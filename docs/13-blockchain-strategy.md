# 13 · Blockchain Strategy

> **Design now. Build later.** Nothing on-chain ships at launch. The architecture must make minting a later addition, never a rebuild.

## Purpose (what the chain is *for*)
Independent, long-horizon verification of authenticity for:
- Founding **certificates** (participation, role)
- **Artist identity** (this person was a founder of this chapter)
- **Artwork provenance** (this work, these materials, this chapter, this year)
- **Chapter lineage** (Abuja is genesis; chapter N descends from the network)
- **Environmental impact** attestations
- **Historical authenticity** (the record hasn't been altered)

## Core decision: Soulbound, not tradable
Certificates and identity records are **Soulbound Tokens (SBTs)** — non-transferable. This is a *recognition of history*, not a speculative asset. No marketplace, no floor price, no "owning" a founder's identity. (Artworks themselves are physical; if provenance NFTs are ever wanted, that's a separate, later, explicit decision.)

## Phased path
1. **Now — Hash & anchor (off-chain trust).** Each certificate stores a `verification_hash` (canonical JSON of {public_id, name, role, chapter, issued_on}). Publish a signed manifest; `/verify` checks the hash. No wallet, no chain, fully functional verification today.
2. **Later — Anchor batches.** Periodically write a Merkle root of all certificate hashes to a public chain → tamper-evidence without per-cert gas.
3. **Future — Mint SBTs.** When the network/partners want it, mint one SBT per certificate to a holder address (or custodial wallet for those without one), filling `certificates.soulbound_ref`. The public `/verify` page resolves both off-chain hash and on-chain token.

## Chain selection criteria (defer the pick)
Low/zero fees, longevity, energy-appropriate (it would be absurd for an environmental movement to use a high-emission chain), good SBT/standards support, custodial-friendly for non-crypto-native artists. Evaluate at Phase 2/3 — do not couple the app to any chain SDK before then.

## Architectural guarantees today
- `certificates.verification_hash` (filled) + `certificates.soulbound_ref` (nullable).
- A `verify(public_id)` service interface with two resolvers (hash now, chain later) behind one API.
- Canonical, versioned serialization for what gets hashed — so a hash minted in 2026 still validates in 2050.
- `/verify` route exists at launch as the off-chain verifier; the on-chain path is feature-flagged.

## Principles
Environmental integrity first · custody-optional (never exclude an artist who has no wallet) · permanence over novelty · the chain proves history, it does not monetize it.
