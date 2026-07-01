# The Planet B Constitution

> Planet B exists to preserve human imagination.
> Software serves that mission. The mission never serves the software.

**Status — RATIFIED & FROZEN · v1.0 · 2026-07-01.**
Changing an invariant requires an **explicit architecture review**: a deliberate,
reviewable edit to *both* this document and the frozen list in
`scripts/check-invariants.mjs`. It must never happen as part of feature work. The
guard fails the build if any invariant's wording drifts from the frozen text.

These seven invariants are binding. Every pull request must uphold all of them.
The mechanically-checkable ones are enforced by `npm run check:invariants` (and
should gate CI); the rest are review gates a human must confirm on every PR.

An invariant is not a preference. If a design decision violates one, the decision
is wrong — not the invariant.

---

### Invariant 1 — Contribution comes before identity.
**Mechanism.** The write path requires no authentication. Authorship is an
anonymous `visitor` (durable signed token); `visitors.person_id` — the Passport
bridge — is `NULL` by default and set only by a later, optional claim.
`contributions.author_visitor_id` references `visitors`, never `people`.
**Checked by.** `check:invariants` — no Garden module may import the auth layer.

### Invariant 2 — Popularity never determines visibility.
**Mechanism.** No like / follower / view / upvote / trending signal exists in the
schema, so visibility *cannot* be computed from one. Surfacing ranks by need,
resonance, freshness, lineage, and serendipity — never counts. The garden surface
is the same for everyone (no per-user attention-maximising feed).
**Checked by.** `check:invariants` — the schema is scanned for forbidden popularity
columns. Surfacing code is a human review gate against the forbidden-signal list.

### Invariant 3 — Every contribution may matter decades from now.
**Mechanism.** Permanent UUIDv7 identity; no expiry, no TTL; append-only event log;
semantic embeddings so a contribution can be rediscovered and connected years after
it was made (cross-time Echo discovery). Nothing is ephemeral by design.
**Checked by.** Review gate: no feature may introduce expiry or purge of contributions.

### Invariant 4 — The archive remembers. It does not erase.
**Mechanism.** Soft-delete only (`deleted_at`); withdrawal hides, it does not
destroy. `domain_events` is append-only and immutable; dispatch state lives
elsewhere so events are never mutated; edits are versioned. The single lawful
exception — a GDPR erasure request — is explicit and logged.
**Checked by.** `check:invariants` — migrations must carry soft-delete and must not
use `on delete cascade` (which would erase children).

### Invariant 5 — The system optimises for meaning, never attention.
**Mechanism.** No infinite algorithmic feed; no streaks (the schema has none); no
push notifications engineered to interrupt (return is pull-based and opt-in). One
meaningful act, not an endless stream.
**Checked by.** Review gate: no engagement mechanic (streaks, ranked-by-engagement
feeds, interrupt notifications) enters the system.

### Invariant 6 — Technology should disappear.
**Mechanism.** The contribution works without JavaScript (progressive enhancement);
the interface asks one human question, not "Create Post"; motion is singular and
purposeful; chrome recedes. The visitor should remember the feeling, not the UI.
**Checked by.** Review gate on every UI PR: RSC-first, works JS-off, ≤ one purposeful
motion per surface, reduced-motion honoured.

### Invariant 7 — Every contribution should have the potential to inspire another human being, even years later.
**Mechanism.** A contribution is never a dead end: lineage (`parent_id` / `root_id`),
resonance edges (`connections` / embeddings), and the Transformation bridge (a dream
→ story → artwork → certificate) give every contribution paths to reach others —
across countries and across decades.
**Checked by.** Review gate: no contribution type may be a terminal object; each must
be reachable by lineage, resonance, or transformation.

---

**Dependency rule (in service of a century-long life).** Planet B Core never imports
a vendor. Application → Domain → Repository interface → Infrastructure adapter →
Supabase. Enforced by `check:invariants`: the Supabase SDK is imported by exactly one
adapter file, and the contribution domain imports no infrastructure.
