# 00 · Founding Principles (the Constitution)

> Ratified by the founder, 2026. These principles **override convenience, trends, and technical preference**. Every later document, schema, and line of code inherits from this one. When two paths conflict, the one that better serves these principles wins.

## I. Purpose before product
Planet B is not documenting exhibitions. Planet B is building the **permanent historical archive of a global movement**. Every decision preserves legacy first and implements technology second. **When uncertain, choose the option that best preserves history.**

## II. The Genesis Chapter is sacred
The Abuja chapter is the **Genesis Chapter** of Planet B, permanently. Nothing may overwrite, replace, demote, or "archive away" it. Future chapters are **additions, never replacements**. The data model forbids deleting it; the UI keeps it present-tense and prominent forever.

## III. Contribution, not attendance
Every certificate represents **contribution**, not mere presence. Every verified contributor receives one — across every role (see [14 · Certificate System](14-certificate-system.md) for the full role list and contents). Certificates are designed to become **verifiable digital credentials**, not disposable PDFs, and to be **blockchain-ready from day one** (see [13](13-blockchain-strategy.md)) — without implementing blockchain now.

## IV. No contributor becomes invisible
Everyone who helped create the Genesis Chapter deserves a **permanent profile**. Profiles read like **museum records**, not staff biographies. Visibility is gated only by consent — never by hierarchy or convenience.

## V. The Founding Council is a historical record
Planet B maintains an internal **Founding Council** data model: a permanent record of those who *established the movement* — founding artists, Nike Art Gallery leadership, Royal Norwegian Embassy representatives, organizers, curators, and key collaborators. It is **not** a website governing body; it is **history**, and it is **expandable over time**. See [10 · Database Schema](10-database-schema.md#founding-council).

## VI. Accuracy over completeness
Where the record is uncertain, leave it **intentionally incomplete and labelled** rather than guessing. The one open historical question — the identity of the **15th founding artist** — stays blank until verified from official documentation. A truthful gap is worth more than a confident error.

## VII. Blockchain-ready, not blockchain-now
Design every identity and certificate so it can later be cryptographically verified (Soulbound, non-transferable). **Do not implement blockchain yet.** Architecture anticipates it; the product does not depend on it. Inclusion first: no wallet, fee, or crypto knowledge is ever required to receive or verify a credential.

## VIII. Built for a century of witnesses
Build with the assumption that one day **museums will reference it, embassies will showcase it, universities will research it, artists will aspire to join it, historians will study it, and future generations will use it to understand how the movement began.** If a decision supports that future, proceed. If it doesn't, stop.

---

### How to use this document
- Every PR description and design proposal should be checkable against these eight principles.
- The schema encodes them where it can: immutable Genesis flag, soft-delete only, `consent_status` gating, `founding_council` model, nullable on-chain fields, and an explicit "pending/unverified" state for incomplete records.
- See the index in [00-README.md](00-README.md).
