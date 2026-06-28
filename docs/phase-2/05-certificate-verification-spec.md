# 05 · Certificate Verification & Claim Specification

**Purpose.** Specify two distinct, clearly-separated certificate flows for Planet B: **(A) Verify** — the public, no-chain authenticity check that already exists at launch (recompute the canonical `CertificateClaimV1` hash, compare to `certificates.verificationHash`) and later resolves `onchain_refs`/SBT; and **(B) Claim** — the NEW Phase 2 workflow where a living contributor uploads a photo/scan of their **physical** certificate, OCR reads it, the **Planet Registry** matches it to an existing `certificates` row, a human reviews low-confidence matches, and on approval the certificate is linked to the contributor's account and attached to their **Planet Passport**. The physical certificate is never altered; verification and claiming are a **digital layer** over an immutable historical record.

**Extends.** [docs/14-certificate-system.md](../14-certificate-system.md) (the off-chain hash verify already designed) and [docs/13-blockchain-strategy.md](../13-blockchain-strategy.md) (hash-now / anchor-later / mint-later). Obeys the canon in [docs/phase-2/00-README.md](00-README.md): identifiers, table names, and states are used exactly. New tables introduced: `claim_requests`, `verification_events`, `passport_claims` (claim side); reads `certificates`, `people`, `passports`, `users`, `chain_anchors`, `onchain_refs` (verify side). Decision recorded in ADR-0008 (certificate claiming via OCR + human review).

> Two flows, one truth: **Verify** answers *"is this record authentic?"* — anonymous, no account. **Claim** answers *"is this physical certificate mine, and may I attach it to my Passport?"* — authenticated, reviewed. Verify is read-only and never mutates a certificate. Claim never mutates a certificate either; it only creates links (`passport_claims`) and logs (`verification_events`).

---

## 0. Vocabulary used (from canon — do not invent)

| Name | Meaning |
|------|---------|
| `certificates.publicId` | `PB-<CHAPTER>-<YEAR>-<NNN>` — permanent, the permalink key |
| `certificates.verificationHash` | sha256 of canonical `CertificateClaimV1` JSON |
| `certificates.soulboundRef` | nullable SBT pointer (generalized into `onchain_refs`) |
| `certificate.status` | `draft | issued | revoked | reserved` |
| `CertificateClaimV1` | the exact ordered hashed fields (`models/index.ts`) |
| `claim_requests.status` | `uploaded | ocr_done | matched | needs_review | claimed | rejected` |
| `passport_claims.status` | `pending | approved | rejected` |
| `verification_events` | append-only log of every verify/claim/anchor/mint |

---

# FLOW A — Verify (exists at launch, no chain)

## A.1 Trigger

```
Visitor ──▶ /certificates/{publicId}          (typed, cited, or linked)
        └─▶ scan QR on the physical/PDF cert  ──▶ QR encodes the same permalink
```

No account, no wallet, no fee (Principle: inclusive). Verify is a **GET** — idempotent and cacheable except for the live hash recompute.

## A.2 Algorithm

```
                          GET /certificates/{publicId}
                                      │
                                      ▼
                   ┌──────────────────────────────────────┐
                   │ 1. Load certificate row by publicId   │
                   └──────────────────────────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
            not found                                   found
                 │                                          │
                 ▼                                          ▼
        ✗ "No such certificate"        ┌──────────────────────────────────┐
        (404, logged)                  │ 2. status gate                    │
                                       │   revoked → ⚠ "Revoked" banner    │
                                       │   reserved/draft → "Not issued"   │
                                       │   issued → continue               │
                                       └──────────────────────────────────┘
                                                       │
                                                       ▼
                       ┌───────────────────────────────────────────────┐
                       │ 3. Build CertificateClaimV1 from the row:      │
                       │    { v:1, publicId, subject, roleAtIssue,      │
                       │      chapter, artwork, issuedOn }              │
                       │ 4. canonicalJSON() → stable key order, no ws   │
                       │ 5. recomputed = sha256(canonicalJSON)          │
                       └───────────────────────────────────────────────┘
                                                       │
                                      recomputed  ==  verificationHash ?
                                  ┌────────────────────┴────────────────────┐
                                 yes                                        no
                                  ▼                                          ▼
                        ✓ VERIFIED                                  ✗ MISMATCH
                  hashValid=true                              hashValid=false
                                  │                            (record altered or
                                  ▼                             hash stale — alarm)
              ┌────────────────────────────────────┐                 │
              │ 6. (later) resolve chain layer:     │                 ▼
              │   onchain_refs[entity=cert,id] +    │       log verification_event
              │   chain_anchors (Merkle inclusion)  │       kind='verify' result='mismatch'
              │   → onChain: true/false             │
              └────────────────────────────────────┘
                                  │
                                  ▼
        log verification_event kind='verify' result='verified'
        return VerificationResult { publicId, hashValid, onChain, soulboundRef }
```

The function maps 1:1 to the existing `VerificationResult` type (`models/index.ts`). `subject` = person slug or organization slug exactly as hashed at issuance — **the hash input is frozen by `CertificateClaimV1.v=1`** so a 2026 hash still validates in 2050 (Principle: permanence).

## A.3 Chain layer (designed now, implemented later — feature-flagged)

```
verify() resolvers (one API, two sources):
  ┌─ hashResolver  (LIVE today)  → recompute vs verificationHash
  └─ chainResolver (flag off)    → onchain_refs(kind in [sbt,anchor,attestation])
                                    + chain_anchors.merkleRoot inclusion proof
```

`onChain` is `false` until the chain layer ships ([06-solana-integration-plan], [07-blockchain-abstraction-interface]). `soulboundRef` continues to read from `certificates.soulboundRef` and is mirrored into `onchain_refs` when minting begins. **Verify never writes to `certificates`.**

## A.4 Public verify page (ASCII)

```
┌──────────────────────────────────────────────────────────────┐
│  ◉  PLANET B · CERTIFICATE OF CONTRIBUTION                    │
│                                                              │
│   PB-ABJ-2026-002                              ✓ VERIFIED    │
│   ──────────────────────────────────────────────────────    │
│   Ajayi Elijah Snoz                                          │
│   Role at issue:  Artist · Storyteller                       │
│   Chapter:        Abuja 2026 (Genesis ★)                     │
│   Artwork:        The Watchful Eye                           │
│   Issued on:      2026-03-14                                 │
│                                                              │
│   Off-chain hash    ✓ matches canonical record (V1)          │
│   On-chain (SBT)    — not yet anchored (Phase 3)             │
│                                                              │
│   [ View artwork ]  [ View Passport ]  [ Is this you? Claim ]│
└──────────────────────────────────────────────────────────────┘
   States:  ✓ VERIFIED   ✗ MISMATCH   ⚠ REVOKED   ◌ NOT ISSUED
```

The **"Is this you? Claim"** affordance is the only bridge from Verify (A) into Claim (B). It is shown only for `status = issued` certificates.

---

# FLOW B — Claim (NEW · Phase 2)

> The brief's workflow, exactly: **Physical certificate → upload (JPEG/PNG/PDF) → OCR reads it → Planet Registry lookup → verification → claim certificate → attach to Passport → (future) Solana verification.** The physical artifact is never touched; we build a digital proof-of-ownership layer on top.

## B.1 End-to-end flow

```
 ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────────────┐
 │  PHYSICAL   │───▶│  UPLOAD      │───▶│  OCR         │───▶│ PLANET REGISTRY  │
 │ certificate │    │ JPEG/PNG/PDF │    │ (provider-   │    │ lookup + fuzzy   │
 │ (untouched) │    │ → media row  │    │  agnostic)   │    │ match by         │
 └─────────────┘    └─────────────┘    └─────────────┘    │ publicId/name/role│
                          │                   │           └──────────────────┘
                    claim_requests       parsed fields +          │
                    .status=uploaded     confidence score    confidence?
                          │                                       │
                          └──────────────────────────────────────┤
                                                                  ▼
                                          ┌───────────────────────────────────┐
                                          │ HIGH confidence (≥ τ_auto)         │
                                          │   status = matched                 │
                                          │ MID  (τ_review ≤ c < τ_auto)       │
                                          │   status = needs_review (queue)    │
                                          │ LOW  (< τ_review) or no match      │
                                          │   status = needs_review (manual)   │
                                          └───────────────────────────────────┘
                                                                  │
                                  ┌───────────────────────────────┴────────────┐
                          reviewer/system approves                       reviewer rejects
                                  │                                              │
                                  ▼                                              ▼
              ┌──────────────────────────────────────┐            claim_requests.status=rejected
              │ CLAIM                                  │            verification_event kind='claim'
              │  • create passport_claims(pending→     │                       result='rejected'
              │    approved) linking users ⇆ people    │
              │  • claim_requests.status = claimed     │
              │  • attach to Passport (passport_status │
              │    unclaimed → claimed/linked)         │
              │  • verification_event kind='claim'     │
              │    result='claimed'                    │
              └──────────────────────────────────────┘
                                  │
                                  ▼
              (FUTURE) Solana verification — onchain_refs / SBT mint
              binds the claimed identity on-chain ([06],[07])
```

**Invariant:** at no step is the `certificates` row modified. Claiming creates `claim_requests`, `passport_claims`, and `verification_events` rows only. Revocation (if ever needed) remains a `certificate.status` change made by an authorized admin, never by the claimant.

## B.2 `claim_requests` table (Postgres-ready, mirrored in SQLite)

Canonical fields per [00-README](00-README.md):

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid pk | |
| `registry_id` | text unique | optional `PB-*` if minted; not required |
| `uploaded_media_id` | text → `media.id` | the JPEG/PNG/PDF; stored, never altered |
| `ocr_text` | text | raw OCR output (full text) |
| `ocr_provider` | text | which `OcrProvider` ran (audit/replay) |
| `parsed_fields` | json | `{ publicId?, name?, role?, chapter?, issuedOn? }` |
| `matched_certificate_id` | text → `certificates.id` (null) | best match, if any |
| `confidence` | real 0–1 | composite score (see B.5) |
| `status` | text | `uploaded → ocr_done → matched → needs_review → claimed | rejected` |
| `submitted_by` | text → `users.id` | the claimant |
| `reviewer` | text → `users.id` (null) | set when a human decides |
| `decided_at` | text (null) | |
| `reject_reason` | text (null) | |
| `created_at` / `updated_at` | text | |

**Lifecycle (state machine):**

```
        upload accepted
  ──────────────────────▶ uploaded
                              │ OCR runs
                              ▼
                          ocr_done
                              │ Registry lookup
              ┌───────────────┼─────────────────────┐
        c ≥ τ_auto      τ_review ≤ c < τ_auto    c < τ_review / no match
              │               │                     │
              ▼               ▼                     ▼
           matched ─────▶ needs_review ◀───────────┘
              │  (auto-approve     │
              │   policy off →     │ reviewer decides
              │   still queues)    │
              ▼               ┌────┴────┐
           claimed ◀──────────┤ approve  │
              ▲               │ reject   ├──────▶ rejected
              └───────────────┴─────────┘
```

- `matched` is a *candidate* state; a claim is only finalized as `claimed` after the approval gate (auto when policy permits + confidence high; otherwise human). Terminal states: `claimed`, `rejected`. No hard delete — a withdrawn request is `rejected` with reason `withdrawn`.

## B.3 OCR as a replaceable service interface (no vendor lock-in)

OCR is consumed through a provider-agnostic interface behind the Repository Pattern, so cloud OCR, a local engine, or a future model can be swapped as a driver change — never a rewrite (ADR-0004).

```ts
// features/certificates/claim/ocr.ts  — interface only; no vendor import here
export interface OcrResult {
  fullText: string;
  blocks: { text: string; bbox: [number,number,number,number]; conf: number }[];
  provider: string;          // recorded into claim_requests.ocr_provider
  raw?: unknown;             // provider payload, retained for replay
}

export interface OcrProvider {
  readonly name: string;
  /** mediaRef points at the stored upload; the source is never modified. */
  recognize(mediaRef: { storagePath: string; mime: string }): Promise<OcrResult>;
}

// Pluggable implementations (selected by config/env, not by feature code):
//   • CloudOcrProvider   (e.g. a hosted OCR API)        ─┐ chosen at the
//   • LocalOcrProvider   (e.g. on-box engine, offline)  ─┤ composition root
//   • StubOcrProvider    (tests / deterministic replay) ─┘ via env flag
```

```
            ┌────────── ClaimService (feature) ──────────┐
            │  knows OcrProvider + CertificateRepo only   │
            └───────────────────────┬────────────────────┘
                                    │ OcrProvider (interface)
              ┌──────────────┬──────┴───────┬──────────────┐
        CloudOcrProvider  LocalOcr…    StubOcr…       (future model)
```

Rules: the source upload is read-only to the provider; the **full OCR text is retained** in `claim_requests.ocr_text` for audit/replay; the chosen provider name is stored so a result can be reproduced or re-scored later.

## B.4 Planet Registry lookup + fuzzy matching

OCR text is parsed into `parsed_fields`, then matched against `certificates`:

```
PARSE  ──▶  { publicId?, name?, role?, chapter?, issuedOn? }
                         │
                         ▼
MATCH against certificates (+ joined people/organizations):
  1. Exact: parsed.publicId == certificates.publicId   → strongest signal
  2. Fuzzy name:  parsed.name  ~ people.fullName/displayName  (normalized,
                  diacritics-folded, token-set ratio)
  3. Role:        parsed.role  ~ roleAtIssue
  4. Chapter/year:parsed.chapter / issuedOn consistent with publicId pattern
                  PB-<CHAPTER>-<YEAR>-<NNN>
                         │
                         ▼
RANK candidates by composite confidence (B.5) → best = matched_certificate_id
```

- `publicId` is the high-signal key because it is unique and printed on every certificate. A clean `publicId` read alone can clear `τ_auto`.
- Name/role matching uses normalization (lowercase, fold diacritics — important for Yorùbá names — collapse whitespace) and a token-set similarity ratio, not exact equality.
- Matching **only ever targets `status = issued`** certificates. `reserved`/`draft`/`revoked` are never claimable.

## B.5 Confidence scoring

A single composite `confidence ∈ [0,1]` drives routing:

```
confidence = w_id   · idMatch        (1 if publicId exact, else 0)
           + w_name · nameSim        (0–1 token-set similarity)
           + w_role · roleSim        (0–1)
           + w_ctx  · contextMatch   (chapter+year consistent: 0–1)
           − penalty(ocrLowConf)     (avg OCR block conf below floor)

Routing thresholds (config, tunable, audited on change):
   confidence ≥ τ_auto      → matched   (eligible for auto-approve if policy on)
   τ_review ≤ confidence    → needs_review  (human in the loop)
   confidence < τ_review    → needs_review  (manual search; weak/empty match)
   no candidate at all      → needs_review  (manual; reviewer may match by hand)
```

When OCR confidence on the `publicId` region is itself low, the request is **forced to `needs_review`** regardless of composite score — a misread `PB-ABJ-2026-002` vs `008` must not auto-claim. Thresholds and weights live in System Settings, are versioned, and changes are audit-logged.

## B.6 Human review fallback (claim-review queue)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Claim Review Queue                       [status ▾ needs_review] [me ▾]│
├────────────┬───────────────┬──────────────┬──────────┬───────────────┤
│ Request    │ Claimant       │ Best match   │ Conf.    │ Age           │
├────────────┼───────────────┼──────────────┼──────────┼───────────────┤
│ CR-0007    │ y.durodola@…   │ PB-ABJ-2026- │ 0.62 ⚠   │ 3h            │
│            │                │ 011 (fuzzy)  │          │               │
├────────────┴───────────────┴──────────────┴──────────┴───────────────┤
│ ── Review CR-0007 ───────────────────────────────────────────────────│
│  Uploaded scan        │  OCR text                │  Candidate(s)       │
│  ┌──────────────┐     │  "PLANET B … DURODOLA …  │  ● PB-ABJ-2026-011  │
│  │ [cert image] │     │   Facilitator … Abuja…"  │    Yusuf Durodola   │
│  │  (read-only) │     │  parsed:                 │    Facilitator 0.62 │
│  └──────────────┘     │   name=Durodola          │  ○ search other…    │
│                       │   role=Facilitator       │  [⌕ find cert]      │
│                       │   chapter=Abuja 2026     │                     │
│  Anti-fraud checks:  ✓ cert unclaimed  ✓ status=issued  ⚠ low OCR conf │
│                                                                        │
│  [ Approve & claim ]   [ Reject ▾ ]   [ Reassign reviewer ]            │
└──────────────────────────────────────────────────────────────────────┘
```

Reviewer can override the match (pick another certificate via Registry search), approve, or reject with a reason. Every action writes `verification_events` + `audit_logs`. Reviewing your own submitted claim is blocked (separation of duties).

## B.7 Anti-fraud controls

```
ONE CLAIM PER CERT     unique(matched_certificate_id) WHERE status='claimed'
                       + unique active passport_claims per (user, person)
                       → a certificate can be claimed at most once; a second
                         attempt is auto-rejected with reason 'already_claimed'.

REVIEWER APPROVAL      finalizing 'claimed' requires either
                       (a) confidence ≥ τ_auto AND auto-approve policy ON, or
                       (b) explicit reviewer Approve.  Default: human-required.

SEPARATION OF DUTIES   submitted_by ≠ reviewer (cannot approve own claim).
SENSITIVE-ACTION GATE  approve/reject inherit the cert sensitive-action policy
                       (MFA; optional two-person) — see permission matrix §
                       sensitive actions.

AUDIT + EVENTS         every upload/ocr/match/approve/reject appends a
                       verification_events row AND an audit_logs row
                       (actor, before/after, ip, ua). Append-only; nothing
                       is deleted. OCR text + provider retained for replay.

RATE / ABUSE           per-user upload throttling; uploads scanned for
                       type/size; PDFs flattened to image for OCR; the
                       original media is retained, never overwritten.
```

`verification_events` (append-only) records: `kind` (`verify | claim | anchor | mint`), `result`, `certificate_id?`, `claim_request_id?`, `actor`, `at`, `detail json`. It feeds both `/verify` history and the audit trail.

## B.8 Linking: account ⇆ certificate ⇆ Passport

A successful claim creates the identity links; it does **not** copy data (aggregation is computed, per ADR-0002 — a Passport is a projection, not a user account).

```
 users(account)            people / passports               certificates
 ───────────────           ─────────────────               ────────────
        │                          │                              │
        │   passport_claims        │                              │
        │  (user_id, person_id,    │                              │
        │   status pending→approved│                              │
        └─────────────────────────▶│                              │
                                    │  passport.passport_status:   │
                                    │   unclaimed → claimed/linked │
                                    │                              │
                                    │  certificate.personId ───────┘
                                    │  (already set at issuance)
                                    │
                                    ▼
              Passport page now shows, for this person:
              certificates (joined via personId) · contributions ·
              artworks · stories · timeline — aggregated, not duplicated.
```

- `passport_claims` (status `pending | approved | rejected`) is the canonical account↔person link (a living contributor claiming their identity).
- `claim_requests` is the *evidence/workflow* record for one upload; on approval it both flips to `claimed` and yields/links the `passport_claims` row.
- The certificate↔person link already exists via `certificates.personId` at issuance; claiming makes it **owned** (account-bound) and surfaces it on the Passport. `passport_status` moves `unclaimed → claimed` (identity claimed) and `→ linked` once an authenticated account is bound and, later, an on-chain identity is attested.

## B.9 (Future) Solana verification

Once the chain layer ships, an approved claim can trigger an `onchain_refs` entry (`kind='sbt'`) / SBT mint binding the claimed certificate to a holder or custodial wallet (custody-optional — never exclude an artist without a wallet). This is additive and **feature-flagged**; the Verify page (A.3) then reports `onChain: true`. See [06-solana-integration-plan] and [07-blockchain-abstraction-interface].

---

## C. The Genesis Collection (digital preservation layer)

The **14 founding certificates** of the Abuja 2026 Genesis Chapter are **historical artifacts**. They are never altered, redesigned, or replaced (Principle II — Genesis is sacred; `chapters.isGenesis = true`, `immutable = true`). Phase 2 wraps each in a **digital preservation layer** — a record *about* the artifact, not a change *to* it.

```
                    ┌──────────── GENESIS CERTIFICATE (immutable) ───────────┐
                    │  certificates.publicId  PB-ABJ-2026-NNN                │
                    │  status=issued  verificationHash (frozen V1)           │
                    └───────────────────────────┬───────────────────────────┘
                                                │  wrapped by (read/derived)
        ┌───────────────────────────────────────┼───────────────────────────────────────┐
        ▼                ▼              ▼         ▼           ▼            ▼                ▼
  Registry ID      Cert page    Verification  Signatories  Hi-res     Related graph    Provenance
  PB-CERT-NNNNNN   /certificates  status      (who signed/  archive    artist · artwork  events log
  (+ PB-ABJ-…)     /{publicId}    (Flow A)    council)     master+sha  · chapter ·       (verify/
                                                            (media)     videos·timeline·  claim/
                                                                        press·catalogue   anchor)
```

The preservation layer for each Genesis certificate includes:

- **Registry ID** (`PB-CERT-NNNNNN`) and the permanent `publicId` (`PB-ABJ-2026-NNN`).
- **Cert page** at `/certificates/{publicId}` with live **verification status** (Flow A).
- **Signatories** — who issued/signed (founding council citation), recorded, not editable on the artifact.
- **Hi-res archive** — master scan in `media` with `sha256` fixity (preservation-grade, never overwritten; derivatives regenerable).
- **Related knowledge graph** via `entity_links`: artist (`people`), artwork (`artworks`), chapter (`chapters`, Genesis ★), videos and timeline (`timeline_events`), press (`press`), and catalogue entries.

The Genesis Collection is **claimable** by its living founders through Flow B, but the artifact and its hash are immutable; claiming only adds the digital ownership/Passport link on top.

> **Count note:** this spec treats the Genesis Collection as the **14 issued founding certificates**, consistent with the brief. Phase 1 docs reference "15 founders" with a **reserved 15th-artist slot** (`status=reserved`, not claimable, excluded from the issued collection). See Open questions.

---

## Open questions for approval

1. **Genesis count — 14 vs 15.** The brief says *14 founding certificates*; Phase 1 ([14-certificate-system], [architecture/08]) says *15 founders* with a reserved 15th-artist slot. Confirm: is the Genesis Collection the **14 issued** certs (15th = `reserved`, excluded until issued), or 15?
2. **Confidence thresholds.** Initial values for `τ_auto`, `τ_review`, weights (`w_id`, `w_name`, `w_role`, `w_ctx`), and OCR-floor penalty — and whether **auto-approve** (claim without a human at `confidence ≥ τ_auto`) is permitted at launch or always human-gated.
3. **OCR provider for v1.** Cloud OCR (faster, external dependency) vs local/offline engine (sovereign, archive-aligned) as the first concrete `OcrProvider`? Interface is provider-agnostic either way.
4. **Two-person approval on claims.** Should claim approval inherit the cert two-person policy, or is single-reviewer + MFA sufficient given claims don't mutate certificates?
5. **Re-claim / dispute handling.** If a certificate is wrongly claimed, what is the dispute/un-claim path (a new `verification_event` + admin reversal of `passport_claims`)? Confirm the reversal authority and audit trail.
6. **`passport_status` semantics.** Confirm the exact trigger for `claimed` vs `linked` (claimed = identity asserted; linked = authenticated account + future on-chain attestation?).
7. **Uploads of non-Genesis certs.** Future chapters will generate thousands of certs; confirm Flow B is identical for all chapters and that chapter-scoped reviewers (`chapter_director`) handle their own chapter's claim queue.
