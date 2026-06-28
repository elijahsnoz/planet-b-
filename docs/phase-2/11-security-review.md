# 11 · Security Review (Phase 2)

> **Status: DESIGN — awaiting approval.** Part of the [Phase 2 design package](00-README.md). No feature code ships from this document until the founder approves.

**Purpose.** Planet B holds the identities of real contributors and the trust of embassies, museums, governments, and grant-makers. This review extends the Phase 1 threat model to the new Phase 2 surface area — Supabase Auth + Postgres RLS, file uploads for media and the certificate **claim_requests** workflow, the Planet Passport and its PII/consent obligations, a public API, and a blockchain abstraction — and gives the founder a prioritized, approvable list of what to build, in what order, and why. Security here is grant-readiness: a credible institution must be able to *prove* it protects people and verifies facts.

**Extends.** [architecture/14 · Security Review](../architecture/14-security-review.md) and [architecture/06 · Permission Matrix](../architecture/06-permission-matrix.md). Phase 1 set the posture — least privilege, deny by default, defence in depth, audit everything, OWASP Top 10. This document does not restate it; it amends it for the institution and flags where the *current implementation* differs from the *designed target*.

---

## 1. Current posture (what is actually implemented today)

The running app is a single Node process over the portable SQLite archive. The security primitives already shipped:

| Area | Implementation | File |
|------|----------------|------|
| Sessions | `jose` HS256 JWT carrying a `sid`, validated against a `sessions` row with server-side expiry; http-only, `secure` in prod, `SameSite=Lax`, 7-day expiry | [lib/auth.ts](../../lib/auth.ts) |
| Password storage | `bcryptjs` compare; never stored or logged in plaintext | [lib/auth.ts](../../lib/auth.ts) |
| RBAC | `requireUser` / `requirePermission` resolve permissions from `user_roles → role_permissions → permissions`; deny by default; `can()` is a set membership check | [lib/auth.ts](../../lib/auth.ts), [db/schema.ts](../../db/schema.ts) |
| Secrets | `PLANET_B_SESSION_SECRET` is fail-fast in production (throws if missing or < 32 chars); dev fallback is loud and clearly labelled | [lib/env.ts](../../lib/env.ts) |
| Login rate limiting | In-memory token bucket: 5 failed attempts / 15 min → 15-min lockout, keyed per identifier | [lib/rate-limit.ts](../../lib/rate-limit.ts) |
| CSRF | Edge middleware enforces same-origin on every mutating method for `/admin/*` (Origin/Referer host must equal Host; missing → 403) | [middleware.ts](../../middleware.ts) |
| Input validation | `zod` schemas parse all admin FormData with length ceilings and constrained enums (`status`, `consent_status`) before any DB write | [lib/validation.ts](../../lib/validation.ts) |
| Audit + soft-delete | `audit_logs` (actor, action, before/after, IP, UA) and `revisions` snapshots; nothing is hard-deleted (`archived_at`) | [db/schema.ts](../../db/schema.ts), [lib/audit.ts](../../lib/audit.ts) |
| Registry integrity | Registry IDs minted atomically via `registry_counters`; never reissued | [lib/registry.ts](../../lib/registry.ts) |

**Honest gaps in the *current* build** (designed for Phase 1, not yet realized): MFA is a column (`users.mfa_required`) with no enforcement; there is no RLS (SQLite has none — authorization is app-layer only); authorization is **permission-level, not per-record** (see Finding F-1); rate limiting is process-local and lost on restart; no security response headers (CSP/HSTS) are set in `middleware.ts`; there is no file-upload pipeline yet.

---

## 2. New Phase 2 risks and mitigations

### 2.1 Supabase Auth + Postgres RLS (the two-layer authorization target)

When the [ADR-0001](adr/0001-data-backbone.md) migration to Postgres/Supabase is approved, authorization becomes **two-layer**: the app RBAC resolver for UX, and Postgres **Row-Level Security** as the security boundary that holds even if app code is wrong.

- **Policy model per table:** public surfaces get a `SELECT` policy of `status = 'published' AND archived_at IS NULL AND consent_status <> 'withheld'`; all writes are denied to the `anon` role and gated by a `has_perm(permission, chapter_id)` SQL function mirroring the RBAC resolver. The **service-role key is server-only and never reaches the browser**; the browser uses the anon key bound by RLS.
- **Consent at the RLS layer:** `people.consent_status` (`granted | pending | withheld`) gates publication *in the policy*, not in app code — Principle IV is enforced by the database, not by remembering to filter.
- **Passport projection:** because the Passport is a *projection* over `people` ([ADR-0002](adr/0002-passport-as-projection.md)), `passports` and aggregated `contributions` inherit the same consent and chapter-scoped policies; a withheld person yields no public Passport.
- **Risk:** RLS policies are easy to get subtly wrong (e.g. a missing `archived_at` clause leaks soft-deleted rows). **Mitigation:** policy unit tests per role × per table in CI (a row each role should and should not see), and a "deny-by-default, then add SELECT" authoring rule.

### 2.2 File-upload security — media uploads **and** the certificate CLAIM flow

Two upload surfaces enter in Phase 2: media/asset ingestion ([09](09-media-management-strategy.md)) and the public **claim_requests** flow where a living contributor uploads a photo/PDF of a paper certificate ([05](05-certificate-verification-spec.md), [ADR-0008](adr/0008-certificate-claiming.md)). The claim flow is *higher risk* because it accepts files from unauthenticated or weakly-authenticated members of the public and then runs OCR over them.

- **Type + size validation:** allow-list MIME types (image/jpeg, image/png, application/pdf) verified by **content sniffing (magic bytes), not the declared extension/Content-Type**; hard size ceiling; reject archives, SVG (XSS vector), and HTML.
- **Store outside the web root, never execute:** uploads land in a private Supabase Storage bucket keyed by an unguessable id; served only via **short-lived signed URLs**. No public bucket for masters, certificate PDFs, or raw claim uploads.
- **AV scanning:** every upload passes an antivirus/malware scan hook (e.g. ClamAV in an edge/worker function) before it is marked usable; status stays `uploaded` until clean.
- **Content sanitization:** strip EXIF/metadata from images (privacy — geolocation in a phone photo of a certificate is PII leakage); rasterize or sandbox PDFs before OCR; never render user PDFs in an authenticated admin tab without sandboxing.
- **OCR input handling:** treat OCR output as **untrusted text** — it is parsed into typed fields through zod, never interpolated into SQL or shell, never auto-trusted for a match. OCR runs in an isolated worker with no DB write credentials; it returns text only.
- **DoS:** rate-limit and size-cap the claim endpoint; queue OCR rather than running it inline on the request thread.

### 2.3 Certificate-claim anti-fraud model

The threat is identity theft: someone claims a certificate (and thus a Passport identity) that is not theirs. The `claim_requests` workflow (`uploaded → ocr_done → matched → needs_review → claimed | rejected`) is designed for **human-in-the-loop** verification.

- **One-claim-per-certificate:** a unique constraint so a `matched_certificate_id` can be `claimed` exactly once; concurrent claims resolve to `needs_review`, never auto-grant.
- **Confidence gating:** a high-confidence OCR match is still **never auto-approved**; it advances to `needs_review` for a human with `certificate.issue`-class permission to approve. Low confidence or no match → `needs_review` with the evidence attached.
- **Evidence + reviewer trail:** every claim stores the uploaded file ref, OCR text, parsed fields, confidence, `submitted_by`, `reviewer`, and a decision timestamp; every transition is an append-only `verification_events` row feeding the audit trail.
- **Account binding:** approval writes a `passport_claims` (user ⇆ person) row, not a free-text edit; this is the only path by which a `users` account becomes linked to a `people`/Passport identity.

### 2.4 Planet Passport privacy & consent (Principle IV)

The Passport aggregates a real person's life in the movement — it is the most privacy-sensitive object in the system.

- **PII gating:** contact details remain `contact_public = false` by default and are never in the public API or seed data; the public Passport projection exposes only consented, published facts.
- **Right to withhold (Principle IV):** `consent_status = 'withheld'` removes the person from all public projections at the RLS layer while preserving the historical record with restricted access (Principle VIII) — *suppression hides the public projection; it does not erase history.*
- **GDPR / data-subject rights:** export (machine-readable copy of a person's record + contributions), rectification (revisions, not silent edits), and consent-respecting suppression. The tension between "permanent archive" and erasure rights is a **required legal-review item before launch** (carried forward from Phase 1) — resolve per jurisdiction and partner agreement.
- **Consent for living-contributor claims:** approving a `passport_claim` is itself a consent event; a claimed Passport's default publication posture follows the person's `consent_status`.

### 2.5 Public API abuse

The Phase 2 public API ([10](10-api-design.md)) widens the attack surface from the admin console to the open internet.

- **Read-only and published-only:** the public API serves only `published`, non-archived, non-withheld content — the same RLS predicate the public site uses.
- **Rate limiting + API keys:** per-key and per-IP quotas; an issued-API-key model for higher-volume partners/researchers with revocable keys and per-key audit. The current in-memory limiter must be replaced by a shared store (see Finding F-3).
- **No write surface without auth:** the only unauthenticated *write* is the certificate claim submission, which is itself rate-limited, AV-scanned, and human-reviewed.
- **SSRF:** any server-side fetch (e.g. press snapshots, remote media import) uses an outbound allow-list and runs sandboxed.

### 2.6 Blockchain key management & custodial wallet security

The chain is fenced behind `BlockchainService` ([ADR-0007](adr/0007-blockchain-abstraction.md)); the app works fully without it. Security concerns apply only when anchoring/minting is enabled.

- **Only hashes on chain, never PII:** `chain_anchors.merkle_root` and `onchain_refs.token_ref` carry **hashes/roots**, never names, emails, or document contents. The chain is a tamper-evidence layer, not a data store. This is also the privacy-by-design guarantee for grants (§4).
- **Custody-optional:** when custodial, signing keys live in an HSM/KMS, never in the app database or environment text; the app holds a *reference*, not the key. Anchoring is performed by a narrowly-scoped service identity, segregated from the web tier.
- **Replay / integrity:** an `anchor_id` and `tx_ref` are recorded only after on-chain confirmation; `verification_events` logs the action; a failed/forged anchor never advances a certificate's status.

### 2.7 Secrets management at scale

- Move beyond the single `PLANET_B_SESSION_SECRET` to managed vaults (Vercel/Supabase) for: session secret, Supabase service-role key, storage signing key, OCR/AV worker credentials, API-key signing secret, KMS/wallet references.
- Per-environment isolation (dev/preview/staging/prod), rotation policy, **CI secret-scanning** so no secret reaches git. Keep the fail-fast-in-prod pattern from [lib/env.ts](../../lib/env.ts) for *every* new secret.

### 2.8 Session hardening

- **Revocation on deactivation:** today `getCurrentUser` checks `users.isActive` on every request — good (deactivating a user kills their access immediately). Extend with explicit session revocation (delete `sessions` rows) on password change, role change, and deactivation.
- **SameSite + cookie flags:** keep `SameSite=Lax` + http-only + `secure`; consider `SameSite=Strict` for the admin cookie now that CSRF is also origin-checked.
- **MFA:** honor the existing `users.mfa_required` flag — enforce step-up MFA for sensitive actions (cert issue/revoke, user/role changes, settings, restore, claim approval) per [06](../architecture/06-permission-matrix.md).
- **Short-lived JWT + refresh** under Supabase Auth once migrated.

### 2.9 IDOR / per-record authorization — **flagged**

The current resolver answers *"may this user perform `artwork.update`?"* but **not** *"on *this* row?"*. A Lagos chapter editor with `artwork.update` can, at the app layer, edit an Abuja artwork. The scoping rule exists in [06](../architecture/06-permission-matrix.md) (`user_roles.chapter_id`) but is **not yet enforced in `lib/auth.ts`**. **Recommendation:** add chapter-scoped checks — `requirePermission(perm, { chapterId })` that verifies the actor holds the permission *globally or for that row's chapter* — and back it with RLS once on Postgres. This is the single most important authorization hardening for Phase 2.

### 2.10 Supply-chain / dependency

- `npm audit` + SCA (Dependabot/Renovate) in CI; pinned versions; review of any new dependency that touches uploads, OCR, crypto, or the chain. Prefer few, well-vetted libraries over breadth.

### 2.11 Backup / DR integrity

- The portable SQLite file is the inheritable backbone; back it up encrypted and object-locked, with restore drills ([architecture/12](../architecture/12-backup-and-dr.md)). Post-migration, Supabase backups inherit the same object-lock + drill requirement. Verify backup integrity by hash; a backup you cannot restore is not a backup.

### 2.12 Tamper-evidence of the audit trail

- `audit_logs` and `revisions` are append-only by convention today. Strengthen toward **tamper-evidence**: hash-chain audit rows (each row includes the hash of the prior row) and periodically anchor the latest audit hash via `chain_anchors`. This makes silent retroactive edits detectable — the institutional credibility argument and a clean tie-in to §2.6 (hashes only).

---

## 3. Prioritized findings

| ID | Sev | Area | Finding | Recommendation | Phase |
|----|-----|------|---------|----------------|-------|
| F-1 | **High** | Authorization (IDOR) | Permission checks are not per-record; chapter scoping in `user_roles.chapter_id` is unenforced in `lib/auth.ts` | Add chapter-scoped `requirePermission(perm, {chapterId})`; enforce with RLS on Postgres | 2 (now) |
| F-2 | **High** | File upload / claim | No upload pipeline; claim flow ingests public files for OCR | Magic-byte type check, size cap, private bucket + signed URLs, AV scan, EXIF strip, sandboxed OCR worker | 2 |
| F-3 | **High** | Rate limiting | In-memory limiter is process-local, lost on restart, ineffective when scaled or behind the public API | Shared store (Redis/DB) behind the same interface; cover login + verify + claim + API | 2 |
| F-4 | **High** | Anti-fraud | Without one-claim-per-cert + human review, a certificate/identity can be hijacked | Unique `matched_certificate_id` claim constraint; never auto-approve; reviewer + evidence trail | 2 |
| F-5 | Med | RLS | No database-level authorization (SQLite); app layer is the only boundary | Author per-table RLS policies with per-role tests when migrating ([ADR-0001](adr/0001-data-backbone.md)) | 2/3 |
| F-6 | Med | MFA | `users.mfa_required` exists but is not enforced | Step-up MFA for sensitive actions per [06](../architecture/06-permission-matrix.md) | 2 |
| F-7 | Med | Headers | No CSP/HSTS/X-Content-Type-Options/Referrer-Policy set | Add security headers at the edge/middleware | 2 |
| F-8 | Med | Privacy | Permanent-archive vs erasure-rights tension unresolved | Legal review; codify consent-respecting suppression vs Principle VIII | 2 (pre-launch) |
| F-9 | Med | Session | No explicit revocation on password/role change | Delete `sessions` rows on those events; consider `SameSite=Strict` for admin | 2 |
| F-10 | Med | Secrets | Single session secret; more secrets arriving | Managed vault, rotation, CI secret-scan, fail-fast per secret | 2 |
| F-11 | Low | Audit integrity | Audit trail is append-by-convention, not tamper-evident | Hash-chain audit rows; periodically anchor the head hash | 3 |
| F-12 | Low | Blockchain keys | Custodial signing keys must never touch app DB/env | HSM/KMS, segregated signer identity, hashes-only on chain | 3 |
| F-13 | Low | Supply chain | New upload/OCR/crypto deps widen attack surface | SCA + pinned versions + dependency review gate | 2 (ongoing) |
| F-14 | Low | API abuse | Public API exposes content to the open internet | Published-only RLS predicate, API keys, per-key quotas | 2 |

---

## 4. Privacy-by-design + grant-readiness

Planet B's verification model is **transparent but privacy-preserving**, which is exactly what cultural and climate grant programs ask for:

- **Verifiable credentials, not data dumps.** A certificate or Passport fact can be *proven* (hash matches the on-chain root) without revealing the underlying record. The proof is public; the PII is not.
- **Only hashes on chain, never PII.** `chain_anchors.merkle_root` and `onchain_refs.token_ref` carry roots/hashes only. Even with the chain fully public, no name, email, or document is ever readable from it.
- **Consent is the default gate.** Publication requires `consent_status = 'granted'`; withholding is honored at the RLS layer (Principle IV). No one is made visible by hierarchy or by accident.
- **Auditability as credibility.** Every privileged action and verify/claim/anchor event is logged (`audit_logs` + `verification_events`), exportable for a funder or partner audit, and (Finding F-11) on a path to tamper-evidence.
- **Data-subject rights honored** within a permanent-archive philosophy via consent-respecting suppression and machine-readable export — pending the legal review (F-8).

---

## Open questions for approval

1. **Per-record authorization (F-1):** approve adding chapter-scoped checks to `lib/auth.ts` now, ahead of the Postgres/RLS migration?
2. **Claim flow trust threshold:** is *any* OCR confidence ever allowed to auto-approve a claim, or is human review mandatory for every claim? (Design assumes mandatory.)
3. **Permanent archive vs erasure (F-8):** confirm the suppression-not-deletion stance is acceptable to partners/embassies, or do specific agreements require true erasure? This needs legal sign-off before launch.
4. **Custody model:** do we ship custody-optional (members hold their own wallets) first, or custodial (we hold keys in KMS) first? Drives the key-management work in §2.6.
5. **API access model:** open read-only API for all, or API-key-gated from day one? Affects abuse controls in §2.5.
6. **Tamper-evident audit (F-11):** is hash-chained + chain-anchored audit a Phase 2 commitment or deferred to Phase 3 with the chain?
