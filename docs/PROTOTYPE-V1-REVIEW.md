# Planet B — Prototype v1 Review

*Because There Is No Planet B — the living archive of a global movement.*

**Status: complete.** All six Experience Gates shipped, build green (31 routes).
Prepared 2026-06-30, at the close of the Prototype v1 elevation pass.

This document is the institutional record of what Prototype v1 *is*: a coherent,
presentation-ready platform for the Royal Norwegian Embassy, Nike Art Gallery, the
Solana Foundation, UNESCO, museums, and journalists. It is honest about what is
built, what is intentionally dormant, and what comes next.

---

## 1 · What Prototype v1 is

A frontend elevation of an already-complete domain backend into a museum-grade
public experience. The discipline throughout: **elevate, don't rebuild; accuracy
over completeness; the movement dominates, not the interface.** No new backend was
introduced for the experience pass — every page single-sources from existing domain
services.

The guiding doctrine, now load-bearing across the platform: **the archive tells the
truth.** The Genesis certificates exist and are preserved, but have not yet undergone
the official digital issuance ceremony — and the platform represents that un-issued
state honestly everywhere, rather than fabricating demo data.

---

## 2 · Architecture — complete

A domain-driven architecture with clean seams between the public experience, the
domain logic, and the platform substrate.

**Domains (8)** — each with types, a repository interface, a SQLite implementation,
a service, and a public API surface:
`registry` · `certificate` · `verification` · `passport` · `chapter` · `story` ·
`artwork` · `artist`.

**Platform layers** — capabilities the domains depend on, swappable behind interfaces:
- `db` — Drizzle / SQLite, 30+ tables, migration-tracked.
- `blockchain` — off-chain hashing today; on-chain resolution behind a Noop provider, ready for Solana.
- `preservation` — audit log + trust-event ledger (every verify and claim is recorded).
- `storage` — media/asset seam.
- `intelligence` — OCR / AI behind a Noop default, so the claim workflow safely falls back to human review.
- `shared/kernel` — Result types, errors, clock, cross-cutting primitives.

**Surfaces** — 15 public pages + 24 admin console pages = **31 routes**, all building
clean. The admin console is a working tool with its own higher-contrast palette; the
public site is the museum.

---

## 3 · Domain model — complete

The registry is the spine: every certificate, passport, artwork, story, and chapter
is a catalogued record, woven together by a knowledge graph (`entity_links`). The
public experiences are projections of this single source of truth — the Passport
projects identity, the Artwork page projects provenance, the Story page traverses the
graph one hop outward, and Verify reads a record's live institutional state.

**The living archive today:**

| Records | Count |
|---|---|
| Founding contributors (people) | 29 |
| Planet Passports | 29 |
| Artworks (preserved objects) | 16 |
| Organizations / partners | 11 |
| Stories | 1 (the Genesis narrative) |
| Chapters | 1 — Abuja 2026 (the Genesis Chapter) |
| Certificates | 34 — **33 archived (draft), 1 reserved, 0 issued** |
| Knowledge-graph edges | 40 |

The certificate state is not a gap — it is the **accurate, pre-ceremony state** of
the Genesis Collection.

---

## 4 · Experience Gates — complete

Six experiences, each built museum-grade and approved at a founder review gate.

| Gate | Experience | What it is |
|---|---|---|
| 1 | **Homepage** | The Threshold — the Eye, one line, the descent into the archive. |
| 2 | **Genesis Chapter** | An interactive documentary of Abuja 2026. |
| 3 | **Planet Passport** | A lifelong institutional credential; the Eye as official seal; reserved future sections held intentionally inactive. |
| 4 | **Artwork** | The gallery wall — work, statement, reclaimed-materials label, ascending provenance lineage, certificate seal, featured-in stories, and a true-graph "Connected works." |
| 5 | **Story** | The narrative layer that opens outward — connected works & makers, partners reached through the chapter, the verifiable record, and sibling stories. All graph-derived, all non-empty-gated. |
| 6 | **Verify — The Trust Layer** | Verifying a record as one examines an artifact in an archive: arrival → verification → understanding → trust → institutional record. Truthful to the un-issued state; future-proofed via a trust ledger. |

**Shared experience language:** the Eye (`AliveEye`) as the universal seal; the
`Reveal` rise-and-fade; the `Threshold` arrival; compositor-only transitions; full
`prefers-reduced-motion` support; deferred navigation; quiet, museum-quality
interaction. The Eye is a seal, not decoration.

---

## 5 · Remaining placeholder assets (intentional)

These are deliberate, honest placeholders — not unfinished work. Each is a seam that
activates with real institutional events, never with fabricated demo data.

- **Issued certificates — none yet.** The "Verify ↗" deep-links on the Artwork and
  Story pages are present but dormant, because no certificate has been issued. This is
  correct: they light up at the issuance ceremony, not before.
- **QR codes — `.example` placeholder only.** Never hardcode a production QR. The
  Passport and printable documents carry the seam; it goes live at issuance.
- **Reserved future sections** on the Passport (Solana Trust Layer, Soulbound
  Credential, Cross-Chapter Recognition, On-chain Verification) are intentionally
  inactive — reserved places, accuracy over completeness.
- **Image seam** (`Plate` → "Image to be added") for artworks/portraits awaiting final
  photography. The structure is complete; the asset drops in.
- **On-chain dimension** resolves to "planned (Solana)" everywhere — the Verify trust
  ledger already has the row, awaiting the anchor.

---

## 6 · Future roadmap

Prototype v1 is the platform. What follows are genuine institutional milestones, each
its own chapter in Planet B's history — never demo data.

1. **The Genesis Issuance Ceremony** *(next major milestone).* A real, dedicated event
   at which Genesis certificates are officially issued, Passport identities activated,
   verification made live, canonical hashes sealed, QR codes activated, and the first
   Solana trust anchor made available. The Verify trust ledger is already designed so
   that the same page lights up — no redesign required.
2. **The Solana Trust Layer.** On-chain anchoring of canonical hashes; the `blockchain`
   platform interface is already in place behind its Noop provider.
3. **Soulbound credentials & cross-chapter recognition.** The reserved Passport
   sections become active.
4. **Chapter Two.** The federation grows beyond Abuja 2026 — the chapter and
   knowledge-graph model already supports multiple chapters and cross-chapter ties.
5. **Asset finalization.** Final artwork and portrait photography into the existing
   image seams.

---

## 7 · Conclusion

Prototype v1 stands as a coherent, presentation-ready institutional platform. The
architecture is complete, the domain model is whole, and all six experiences are
museum-grade. Crucially, the platform is **truthful** — it presents the real state of
the Genesis Collection, archived and awaiting its issuance ceremony, without pretense.

That honesty is the credibility. When the Genesis Issuance Ceremony occurs, the
platform is built to evolve into its live, verified, on-chain future without being
rebuilt — because the truth was designed in from the start.

*There is no Planet B.*
