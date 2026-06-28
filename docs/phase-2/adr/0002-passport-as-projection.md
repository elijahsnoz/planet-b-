# ADR-0002 — Planet Passport as identity projection (not a user account)

**Status:** Proposed

## Context

The Planet Passport is the lifelong contributor identity of the movement — a permanent `PB-ID-<NNNNNN>` number tied to a real person whose standing grows over time (exhibitions, awards, mentorships, certificates, artworks). The tempting model is to make the Passport a user account: one login, one identity. That is wrong for Planet B. Most people in the archive are historical or do not have (and may never want) an account — Principle IV says no one is invisible, and visibility must not depend on signing up. Genesis contributors must have Passports whether or not they ever log in. The Passport must also *aggregate* facts that already live in their own tables (`certificates`, `artworks`, `contributions`, graph edges) without duplicating them.

## Decision

**Model the Planet Passport as an identity *projection* over `people`, not a user account.**

- `passports` is a projection/extension of `people`: `passport_id (PB-ID-…)`, `country`, `passport_status` (`unclaimed | claimed | linked`). Aggregated standing is **computed from the graph + certificates + `contributions`, not duplicated** into the passport row.
- A Passport exists for a `people` row that represents a real contributor **independent of any account** — historical figures included.
- A *living* contributor may **claim** their identity via `passport_claims`, linking a `users` account ⇆ a `people`/passport (status `pending | approved | rejected`, with evidence, reviewer, decided_at). The account is the *credential*; the Passport is the *identity*.
- `contributions` (kinds: `exhibition | award | mentorship | interview | research | talk | residency | role_change`) record life-events that grow a Passport; certificates and artworks stay in their own tables and are joined in.

## Consequences

- **Positive:** Honors Principle IV — Passports exist for everyone in the record, account or not. No duplicated standing data, so a Passport is always consistent with its source records. Consent (`people.consent_status`) governs the Passport for free.
- **Positive:** Claiming is an auditable, human-reviewed event ([ADR-0008](0008-certificate-claiming.md), [11 · Security](../11-security-review.md)), not a self-asserted edit — anti-fraud by design.
- **Negative / cost:** Aggregation is computed (joins/materialized views), which costs query work at scale; mitigated with caching/materialization post-Postgres.
- **Negative:** Two concepts (`people`/Passport vs `users` account) must be kept distinct in UI and code so they are never conflated.

## Alternatives considered

1. **Passport = user account.** Rejected: excludes historical and non-account contributors, violating Principle IV.
2. **Duplicate aggregated standing onto the passport row.** Rejected: creates drift between the Passport and its source records; the archive must have one source of truth per fact (Principle VI).
3. **A separate `identities` table independent of `people`.** Rejected: forks the person record; the Passport *is* the person's public identity, so it belongs as a projection over `people`.
