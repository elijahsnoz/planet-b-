# 04 · Planet Passport Specification

**Purpose.** Specify the **Planet Passport** — a person's *lifelong cultural identity* within Planet B (`PB-ID-NNNNNN`). The Passport is the human-facing face of the knowledge graph: one permanent page that gathers a contributor's whole record — who they are, what they made, where they showed, what they were awarded, who they mentored, and the impact they were part of — and that *grows over a lifetime*. Critically, a Passport is **NOT a user account**. It is a projection/extension of the existing `people` record, materialized through the canon `passports`, `passport_claims`, and `contributions` tables and assembled from `certificates`, `artworks`, and `entity_links`. A historical figure can hold a Passport without ever logging in; a living contributor may later *claim* theirs.

**Extends.** [docs/14 · Certificate System](../14-certificate-system.md) and the `Person` model in [models/index.ts](../../models/index.ts); realizes the `passports` / `passport_claims` / `contributions` tables defined in [00-README · New Phase 2 records](00-README.md); consumes the graph from [03 · Knowledge Graph](03-knowledge-graph.md). Decision of record: [ADR-0002 — Passport as identity projection (not a user account)](adr/0002-passport-as-projection.md). Obeys [00-PRINCIPLES](../00-PRINCIPLES.md): III (contribution, not attendance — the Passport is built from contribution records), IV (no one invisible; **consent gates publication**, PII hidden unless `contactPublic`), V (Founding Council is history — charter Passports), VI (accuracy — the 15th seat stays reserved), VII (blockchain-ready, not now — soulbound *later*, no wallet ever required).

---

## 1. What the Passport is (and is not)

| Is | Is not |
|----|--------|
| A **lifelong identity number** `PB-ID-NNNNNN`, minted once, permanent. | A login / `users` account. Auth lives in `users` + `sessions`. |
| A **projection** over `people` + certificates + artworks + `contributions` + `entity_links`. | A new copy of that data — aggregates are **computed, not duplicated** ([00-README](00-README.md)). |
| Mintable for **historical / deceased** contributors (unclaimed). | Dependent on the person being alive, online, or crypto-aware. |
| Optionally **claimed** by a living person, linking a `users` account via `passport_claims`. | Owned by whoever made the account — claiming requires human review. |
| **Soulbound-ready** (a future, non-transferable on-chain attestation). | A wallet, token, or fee requirement. Inclusion first (Principle VII). |

> One `people` row that represents a real contributor → at most one `passports` row → at most one approved `passport_claims` link to a `users` account. The Passport ID never changes, even as roles, certificates, and contributions accumulate.

---

## 2. Data model (the three canon tables + their joins)

```
                         ┌──────────────────────────────────────────┐
                         │  people  (existing — source of identity)  │
                         │  registryId PB-ARTIST-*  · consentStatus  │
                         │  fullName · roles[] · bio · contactPublic │
                         └──────────────────────────────────────────┘
                                 │ 1:1 (projection/extension)
                                 ▼
   ┌───────────────────────────────────────────────────────────────────────┐
   │  passports                                                              │
   │  passport_id  PB-ID-NNNNNN     (PK, permanent)                          │
   │  person_id    -> people.id     (the identity it projects)              │
   │  country                       (stored; people has no country column)   │
   │  passport_status  unclaimed | claimed | linked                         │
   │  is_charter       bool         (Genesis cohort, Principle V)            │
   │  minted_at · minted_by · note                                          │
   └───────────────────────────────────────────────────────────────────────┘
        │ 0..1 claim                         │ aggregates (computed on read)
        ▼                                    ▼
   ┌─────────────────────────┐   ┌───────────────────────────────────────────┐
   │  passport_claims        │   │  contributions (life-events, grow over time)│
   │  user_id -> users.id    │   │  person_id -> people.id                     │
   │  person_id -> people.id │   │  kind: exhibition|award|mentorship|         │
   │  status pending|approved│   │        interview|research|talk|residency|   │
   │         |rejected       │   │        role_change                          │
   │  evidence · reviewer    │   │  title · occurred_on · chapter_id? ·        │
   │  decided_at             │   │  source · verified                          │
   └─────────────────────────┘   └───────────────────────────────────────────┘

   Joined in at read time (NOT duplicated into the passport):
     certificates  (personId)        → Certificates section
     artworks      (artistId)        → Artworks section
     entity_links  (person sub-graph)→ Exhibitions, Chapters, Stories, Media,
                                        Mentorship, Impact  (via 03-knowledge-graph)
```

`passport_status` semantics:
- **`unclaimed`** — minted as a historical record; no `users` account attached.
- **`claimed`** — a living person has an *approved* `passport_claims` row.
- **`linked`** — claimed *and* connected to an external/on-chain reference (`onchain_refs`); see §6.

---

## 3. Field map — the brief's Passport contents → where each lives

Legend: **S** = stored on a record · **C** = computed/joined at read time (never duplicated).

| Passport field   | Source of truth                                                                 | S/C | Notes |
|------------------|---------------------------------------------------------------------------------|-----|-------|
| **Passport ID**  | `passports.passport_id` (`PB-ID-*`)                                              | S   | Minted via `registry_counters` kind `id`. |
| **Name**         | `people.fullName` / `displayName` / `honorific`                                  | S   | |
| **Country**      | `passports.country`                                                              | S   | `people` has no country column → stored on the passport. |
| **Biography**    | `people.bio` / `shortBio`                                                        | S   | i18n via `translations` overlay ([ADR-0006](adr/0006-i18n-strategy.md)). |
| **Roles**        | `people.roles[]` / `primaryRole`                                                 | S   | Open-ended; grows in place (e.g. Artist → Storyteller → Founding Narrator). |
| **Certificates** | `certificates` WHERE `personId = people.id`                                      | C   | Each links to `/certificates/{publicId}`; honors contribution (Principle III). |
| **Artworks**     | `artworks` WHERE `artistId = people.id`                                          | C   | Plus `entity_links` `created` edges. |
| **Exhibitions**  | `entity_links` `exhibited_in` (via the person's artworks) + `contributions.kind='exhibition'` | C | Graph traversal §4.1 of [03](03-knowledge-graph.md). |
| **Chapters**     | `entity_links` (`features` / `belongs_to`) + `certificates.chapterId` + `contributions.chapter_id` | C | Distinct chapters the person is connected to. |
| **Research**     | `stories` (`kind='essay'`) linked via `entity_links` (`features`/`mentions`/`cites`) + `contributions.kind='research'` | C | |
| **Videos**       | `media` (`kind='video'`) via `entity_links` `documented_by` / `features`         | C   | From the `assets` DAM view ([09](09-media-management-strategy.md)). |
| **Interviews**   | `contributions.kind='interview'` (+ linked `media`/`stories`)                     | C   | |
| **Impact**       | `impact_metrics` of chapters the person contributed to, via `entity_links` `measures` | C | Attribution is by participation, not personal claim. |
| **Mentorship**   | `entity_links` `mentored` / `mentored_by` + `contributions.kind='mentorship'`     | C   | Directed edges (see [03](03-knowledge-graph.md) §2). |
| **Awards**       | `contributions.kind='award'` + `certificates` (role-bearing)                      | C   | |
| **Contributions**| `contributions` (all rows for `person_id`)                                        | S   | The append-only life-event stream that grows the Passport. |
| **Seal**         | the Eye seal (rendered) keyed to `passport_id`                                    | C   | §5; same seal system as certificates ([14](../14-certificate-system.md)). |
| **Verification** | `verification_hash` (certs today) + `onchain_refs` (later)                         | S/C | No on-chain dependency today (Principle VII). |

**Design rule (Principle: no duplicated logic / [00-README](00-README.md)):** the Passport materializes by *reading* certificates, artworks, contributions, and the graph. Only `passport_id`, `country`, `passport_status`, `is_charter`, and minting provenance are stored uniquely on `passports`. Everything else is a join.

---

## 4. Lifecycle

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │  MINT (historical record)                                               │
   │  curator creates/has a `people` row → mint passports row                │
   │  passport_status = 'unclaimed'   PB-ID-NNNNNN assigned (permanent)      │
   │  no users account; no PII published unless contactPublic = true         │
   └────────────────────────────────────────────────────────────────────────┘
                    │  (the person is alive and wishes to claim)
                    ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │  CLAIM (optional, living contributor)                                   │
   │  user signs up (users + sessions) → submits passport_claims             │
   │     {user_id, person_id, evidence, status='pending'}                    │
   │  reviewer (RBAC) verifies identity → status 'approved' | 'rejected'     │
   │  on approve: passport_status -> 'claimed'; consentStatus may move to    │
   │     'granted' (the living person consents to publication, Principle IV) │
   │  audit_logs + verification_events record the decision                   │
   └────────────────────────────────────────────────────────────────────────┘
                    │  (over a lifetime)
                    ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │  GROW                                                                    │
   │  new exhibition / award / mentorship / interview / research / talk /    │
   │  residency / role_change  → INSERT contributions row (verified flag)    │
   │  new artwork / certificate → joined in automatically                    │
   │  new graph edges → appear in the relevant Passport sections             │
   │  The Passport ID, and every prior fact, are immutable; the record only  │
   │  accretes (Principle II / VIII — nothing is lost; revisions snapshot).  │
   └────────────────────────────────────────────────────────────────────────┘
                    │  (Phase 3, optional)
                    ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │  LINK (soulbound, see §6)  passport_status -> 'linked'                   │
   └────────────────────────────────────────────────────────────────────────┘
```

### Consent gating + privacy (Principle IV)

- A Passport is **published** only when the underlying `people.consentStatus = 'granted'`. `pending` / `withheld` people are minted (the historical record exists) but **not exposed publicly** — visibility is gated by consent, never by hierarchy.
- **No PII** (contact details, email, phone) is shown unless `people.contactPublic = true`. The seed data never carries PII; claiming does not auto-publish PII.
- Historical/unclaimed Passports of public figures present only catalogue-substantiated facts (Principle VI — accuracy over completeness; a truthful gap beats a confident error).
- The `users` account that claims a Passport is **never** exposed on the public page; the account is an access credential, not part of the identity.

---

## 5. Public Passport vs private owner view; the Eye as seal

```
 PUBLIC PASSPORT  /passport/PB-ID-000002              PRIVATE OWNER VIEW (claimed)
 ┌──────────────────────────────────────┐            ┌──────────────────────────────────┐
 │   (Eye seal)   Ajayi Elijah Snoz      │            │  + edit requested contributions    │
 │   PB-ID-000002 · Nigeria · ✓ charter  │            │  + manage consent / contactPublic  │
 │   Roles: Artist · Storyteller · …     │            │  + see pending claim status        │
 │   Biography …                         │            │  + draft contributions (in_review) │
 │   Artworks · Certificates · Chapters  │            │  + private PII (own contact)       │
 │   Exhibitions · Research · Videos     │            │  + initiate soulbound link (§6)    │
 │   Interviews · Awards · Mentorship    │            │  All public fields still consent-  │
 │   Impact (chapters contributed to)    │            │  and review-gated; no self-publish │
 │   Verification: hash ✓ / on-chain ◌   │            │  of unverified facts.              │
 └──────────────────────────────────────┘            └──────────────────────────────────┘
```

- **Public view** is consent-filtered, no-PII, citable forever at `/passport/{passportId}`. It is the museum-record reading of a person (Principle IV).
- **Private owner view** (only after an approved `passport_claims`) lets the holder *request* updates and manage consent/PII — but new facts still flow through the `draft → in_review → published` workflow and `verified` gating; an owner cannot self-publish unverified claims (Principle VI).
- **The Eye is the Passport seal.** The same oxblood eye-Seal used on certificates ([14](../14-certificate-system.md)) renders on the Passport keyed to `PB-ID-*`, so a Passport and a certificate read as one visual identity system, and `15 today / 1,500 later look identical`.

---

## 6. Becoming blockchain-verifiable later — without a wallet

Per Principle VII (blockchain-ready, not now) and [ADR-0002](adr/0002-passport-as-projection.md)/[ADR-0007](adr/0007-blockchain-abstraction.md):

- Today the Passport is verifiable **off-chain**: certificate `verification_hash` recomputation already proves a record is untampered ([14](../14-certificate-system.md)). No chain, no wallet.
- Later, a Passport can be made **soulbound** (a non-transferable identity attestation) by writing an `onchain_refs` row — `{entity_type:'passport', entity_id: passport_id, provider, token_ref, kind:'sbt', minted_at}` — when `passport_status` becomes `linked`. This generalizes the existing `certificates.soulbound_ref` to identities.
- **No wallet is ever required of the contributor.** Minting/anchoring is custody-optional: the institution can anchor on the holder's behalf (the Passport is soulbound to the *identity*, not to a user-held key). Verification remains free and wallet-free for any visitor ([ADR-0007](adr/0007-blockchain-abstraction.md)).
- Anchoring is batched via `chain_anchors` (Merkle root over many Passports/certificates), and every mint/anchor is recorded in `verification_events` for the audit trail and `/verify`.

```
 Passport record ──hash──▶ verification_hash (today, off-chain ✓)
                  └──opt──▶ onchain_refs(kind='sbt') ◀── chain_anchors(merkle_root)   (Phase 3)
                                  │
                                  ▼  status: 'linked'   (soulbound, non-transferable, no wallet needed)
```

---

## 7. Genesis cohort — charter Passports + the reserved 15th

Per Principle V (Founding Council is history) and Principle VI (accuracy over completeness), confirmed by `data/genesis/` (14 founding-artist plates confirmed; the 15th intentionally incomplete):

- The **14 confirmed founding artists** of the Genesis Chapter are minted **charter Passports** (`passports.is_charter = true`, `passport_status='unclaimed'` until each living member claims). They join the broader Genesis team (organizers, curators, facilitators, partners) who also receive Passports per their certificates.
- The **15th founding-artist seat remains intentionally reserved** — mirroring the reserved certificate `PB-ABJ-2026-015` (`person = null`, `status = 'reserved'`). **No Passport `PB-ID-*` is minted for the 15th** until the identity is verified from official documentation. The reserved slot is *labelled*, not guessed (Principle VI). A truthful gap is worth more than a confident error.
- Charter Passports are part of the historical record and, like the Genesis Chapter itself, are **never removed** (Principle II); they may only accrete.

---

## Open questions for approval

1. **`passports.country` (and optional `birth_year`/`region`):** confirm `country` is stored on `passports` (since `people` has no country column). Should the Passport also carry a coarse `region`/`nationality` overlay via `translations` for i18n display?
2. **`passport_status = 'linked'`:** approve `linked` as the state meaning "claimed *and* has an `onchain_refs` SBT", distinct from `claimed`. (Matches [00-README](00-README.md)'s `unclaimed | claimed | linked`.)
3. **Charter minting trigger:** mint the 14 charter Passports as part of the same batch that issues the Genesis certificates ([14](../14-certificate-system.md)), so cohort identity is consistent? And confirm the 15th `PB-ID` is *not* pre-reserved as a number (unlike the reserved certificate), to avoid implying a known person.
4. **Claim evidence + reviewer policy:** what evidence satisfies `passport_claims` (gov-ID match, two founder attestations, prior email-of-record)? Two-person review + MFA for charter Passports, mirroring certificate revocation controls in [08](08-admin-wireframes.md)?
5. **Owner edit surface:** confirm the private owner view may only *request* contributions/edits into `draft → in_review`, never self-publish — preserving Principle VI even for the identity's own holder.
6. **Impact attribution:** confirm Passport "Impact" is shown as *chapters the person contributed to* (participation-level), never as a personal metric, to avoid overclaiming a collective achievement.
