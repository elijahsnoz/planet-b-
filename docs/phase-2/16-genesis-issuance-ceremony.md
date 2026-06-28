# 16 · The Genesis Issuance Ceremony (design — not yet implemented)

> **Status: DESIGN — prepared, deliberately not built.** Part of the [Phase 2 package](00-README.md).
> Issuance is **not** a database operation. It is a ceremonial institutional act that permanently seals the historical record. It will run only **after** the Planet Passport exists — which it now does ([04](04-planet-passport-spec.md), `@domains/passport`).

**Purpose.** Define the one-time workflow that turns the fourteen draft Genesis founding-artist certificates into the sealed, issued **Genesis Collection**, attaches them to their Planet Passports, and creates an immutable milestone in Planet B's history. This document prepares the ceremony so that, when the founder is ready, it can be performed with confidence and no redesign.

**Extends.** [05 · Certificate Verification](05-certificate-verification-spec.md), [06 · Solana Integration](06-solana-integration-plan.md), [13 · Blockchain Strategy](../13-blockchain-strategy.md), [14 · Certificate System](../14-certificate-system.md).

---

## Why it is not automated

A museum does not "bulk-activate" its founding collection. Issuance permanently fixes the verification hash of each certificate — the exact, ordered fields by which it will be authenticated for the next century. Doing that should feel like **preserving history**, not flipping a flag. So:

- The fourteen Genesis certificates remain `status = 'draft'` until the ceremony.
- The 15th founding artist stays **reserved** and is never part of the issued Collection (Principle VI).
- Signatories and high-resolution master scans should be attached **before** sealing, because they are part of the artifact's provenance — but they are recorded as relationships, never invented (Principle VI).

## Preconditions (all must hold before the ceremony runs)

1. Each of the fourteen certificates has `consent_status = granted` for its recipient.
2. Each recipient has a Planet Passport (✓ already minted, `PB-ID-…`).
3. Master scan (`has_master`) and signatories (`signed_by`) relationships attached where available; gaps explicitly acknowledged.
4. A second reviewer has confirmed the canonical fields (recipient, role, chapter, artwork, public ID) against the catalogue.
5. `PLANET_B_SESSION_SECRET` set; the acting user holds `certificate.issue`.

## The ceremony (sequence)

```
For each of the 14 Genesis certificates (in PB-ABJ-2026-001 … 014 order):

  1. SEAL    certificateService.issue(id, actor)
             → status: draft → issued
             → issuedOn stamped (the ceremony date — a shared milestone)
             → verificationHash = sha256(canonical CertificateClaimV1)   [permanent]
             → audit + revision + verification_event("mint")

  2. ATTACH  the certificate is now bound to its recipient's Planet Passport
             via the existing personId — the Passport shows it immediately,
             and the holder becomes a "Genesis Contributor". (No schema change.)

  3. RECORD  append to the Genesis Collection milestone (below)

After all 14:

  4. MILESTONE  write a single immutable history record:
                "The Genesis Collection was issued on <date>" (14 members,
                their hashes, the acting council) → revisions + verification_events.

  5. ELIGIBLE   the 14 hashes become eligible for Solana anchoring:
                blockchain.anchorBatch([...14 leaf hashes]) — still behind the
                BlockchainService flag (Noop today). Anchoring is itself a later,
                separate act ([06](06-solana-integration-plan.md)).
```

## What it must guarantee

- **Permanence.** Once sealed, a certificate's hash never changes; re-running the ceremony is a no-op (issue() rejects non-draft).
- **Atomicity per certificate.** Each seal is audited and snapshotted; a failure mid-ceremony leaves already-sealed certificates valid and the rest still draft (resumable).
- **Reversibility of nothing.** Issuance is not undone by deletion; only `revoke` (a status) exists, and revocation preserves the record.
- **Inclusivity.** No wallet, fee, or crypto knowledge is required of any artist at any point (custody-optional; anchoring is institutional).
- **Honesty.** The milestone records exactly which provenance was present and which gaps remained.

## What is already in place (so no redesign is needed later)

- `certificateService.issue()` seals the canonical hash today (per-certificate).
- The Passport aggregates a person's certificates and flags Genesis Contributors **now**, while the certs are still draft — proving the attach step needs no new code.
- `chain_anchors` / `onchain_refs` / `verification_events` tables exist; `blockchain.anchorBatch()` / `mintCredential()` are defined behind the abstraction (Noop).

## To implement when approved (the only new code the ceremony needs)

1. A guarded ceremony orchestrator (`certificate` domain): validate all preconditions for the 14, then seal in order inside a unit of work, writing the milestone record.
2. An admin **"Genesis Issuance Ceremony"** screen: a pre-flight checklist (preconditions per certificate), a single deliberate confirmation, and a post-ceremony certificate of the milestone itself.
3. (Later, separately) the anchoring worker that batches the sealed hashes to Solana.

**Open questions for approval.** Ceremony date convention (a single shared `issuedOn` vs. each certificate's true issue date)? Who constitutes the issuing council recorded in the milestone? Should the milestone itself receive a registry ID (e.g. `PB-EVENT-…`)?
