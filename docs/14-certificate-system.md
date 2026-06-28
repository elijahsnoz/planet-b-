# 14 · Certificate System

Every participant receives a **permanent Planet B identity** — a living historical record, not a PDF that rots in an inbox.

## What a certificate is
A stable, public, verifiable record that *this person **contributed** in this role to this chapter* (and, for artists, *created this artwork*). It honors **contribution, not attendance** ([Principle III](00-PRINCIPLES.md)). It is the human-facing face of [provenance](13-blockchain-strategy.md), and it is designed to become a **verifiable digital credential** — never merely a downloadable PDF.

## Who receives one (every verified contributor)
No contributor becomes invisible ([Principle IV](00-PRINCIPLES.md)). A certificate is issued for each verified contribution role, consent permitting:

Artists · Organizers · Curators · Workshop Facilitators · Master Artists · Volunteers · Photographers · Videographers · MC / Storyteller · Media Team · Sponsors · Institutional Partners · Embassy Representatives · Guest Speakers · Environmental Advocates · Community Partners.

One person may hold several roles (e.g. Yusuf Durodola: facilitator, artist, panelist, performer); issuance is per **contribution**, and a person's certificates aggregate on their profile.

## Identity format
- **Public ID:** `PB-<CHAPTER>-<YEAR>-<NNN>` → e.g. `PB-ABJ-2026-002` (Ajayi Elijah Snoz, *The Watchful Eye*).
- **Permalink:** `/certificates/PB-ABJ-2026-002` — never changes, citable forever.
- **Visual:** the eye-**Seal** in oxblood, serif name, role, chapter + venue + date, ID in mono, ✓ verified state. Generated from one template so 15 today and 1,500 later look identical.

## Contents (from schema)
person · role_at_issue · chapter · venue · issued_on · artwork (if artist) · `verification_hash` · `soulbound_ref` (nullable) · downloadable PDF (`pdf_media_id`).

## Verification flow (works at launch, no chain)
1. Visit `/certificates/[id]` or scan its **QR** (QR encodes the permalink).
2. The page recomputes the canonical hash from the stored record and compares to `verification_hash` → shows ✓ *Verified* / ✗ *Mismatch*.
3. When Phase 3 lands, the same page also resolves the SBT on-chain.

## Issuance (Genesis Chapter)
- Generate one certificate per **person_chapter_role** that warrants it (artists, facilitators, organizers, performers, key partners) — gated by `consent_status = granted`.
- Each gets: public ID, permalink, QR, PDF, and a hash. Artists' certificates link to their artwork record.
- Batch-generate from the database so the 15 founders + team are issued consistently and re-issuable if the template evolves (the *record* is immutable; the *rendering* can improve).

## Principles
- **Inclusive:** no wallet, no crypto knowledge, no fee required to receive or verify.
- **Permanent:** revocation is a status, not a deletion; history is never erased.
- **Honest:** a certificate claims only what the archive can substantiate.
- **Beautiful:** it should feel like something you'd frame — museum-grade, like the work it honors.
