# ADR-0008 — Certificate claiming via OCR + human review

**Status:** Proposed

## Context

Genesis and future contributors hold paper certificates (`PB-<CHAPTER>-<YEAR>-<NNN>`). Phase 2 lets a living contributor **claim** their certificate online — proving "this is me, this is mine" — which in turn links their `users` account to their `people`/Passport identity ([ADR-0002](0002-passport-as-projection.md)). The risk is identity theft: a wrong or fraudulent claim hijacks a person's certificate and Passport. Pure automation is unacceptable here (OCR is fuzzy and forgeable), and pure manual entry does not scale. The certificate record already exists and is authoritative; a claim must be *matched against* it, never allowed to mint a new truth.

## Decision

**Claim certificates via OCR-assisted matching plus mandatory human review, modelled as a `claim_requests` workflow.**

- A claimant uploads a photo/PDF of their certificate. `claim_requests` records the uploaded file ref, OCR text, parsed fields, `matched_certificate_id?`, `confidence`, `status`, `submitted_by`, and `reviewer`.
- The workflow states are fixed: **`uploaded → ocr_done → matched → needs_review → claimed | rejected`**. OCR extracts and parses; matching links to an existing certificate by `public_id`/fields; **a human with certificate-issue authority approves or rejects** — OCR confidence never auto-approves.
- Approval is the *only* path that writes a `passport_claims` link (user ⇆ person). Every transition appends a `verification_events` row feeding the audit trail and `/verify`.
- **One claim per certificate:** a unique constraint ensures a certificate can be `claimed` exactly once; competing claims resolve to `needs_review`.
- Uploads are handled as untrusted input: type/size validation, AV scan, private storage + signed URLs, EXIF stripping, and OCR in an isolated worker with no DB-write credentials ([11 · Security](../11-security-review.md) §2.2–2.3).

## Consequences

- **Positive:** Scales the easy cases (OCR + match) while a human guards every grant of identity — anti-fraud by design. The authoritative certificate stays the source of truth; claims only *link* to it, never create it.
- **Positive:** Fully auditable: evidence, confidence, reviewer, and decision are recorded; the claim path is the single, reviewable way an account binds to a Passport.
- **Negative / cost:** Human review is a real operational load; needs reviewer tooling ([08 · Admin Wireframes](../08-admin-wireframes.md)) and clear SLAs. OCR accuracy varies with photo quality, producing `needs_review` volume.
- **Negative:** Upload + OCR pipeline is the highest-risk new surface and must carry the full §2.2 controls before launch.

## Alternatives considered

1. **Fully automated claim (OCR confidence auto-approves).** Rejected: OCR is forgeable and fuzzy; auto-approval enables identity theft of a Passport.
2. **Manual-only claim (admin types everything).** Rejected: does not scale to 50,000+ contributors and wastes the structure already in the certificate record.
3. **Wallet/email-link possession proof instead of document upload.** Deferred: useful as an *additional* factor later, but most historical certificates are paper with no associated digital credential, so document + human review is the necessary baseline.
