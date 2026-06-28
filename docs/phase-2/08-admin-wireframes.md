# 08 · Admin Dashboard Wireframes (Phase 2)

**Purpose.** Wireframe the Phase 2 **"museum software"** admin — a collections-management console, not a generic CMS — covering every module in the brief (Dashboard, Genesis Archive, Planet Passports, Artists, Artworks, Stories, Certificates, Chapters, Partners, Organizations, Media Library, Timeline, Research, Press, Impact, Users, Permissions, Audit Logs, System Settings). It establishes **reusable patterns** (standard list view, standard editor + revision-history sidebar, review/approval queue) that every module reuses, then details the **new Phase 2 screens** specifically (Passport editor + claim-review queue, block-based Story editor, Media Library DAM, Certificate issuance + claim-review, read-only Blockchain/anchoring status panel, Impact dashboard). All screens are ASCII so they survive a century of tooling changes.

**Extends.** [docs/architecture/08-admin-wireframes.md](../architecture/08-admin-wireframes.md) (Phase 1 global shell, shared list/editor screens, dashboard). Obeys the canon ([00-README](00-README.md)): exact module/table names, lifecycle `status` (`draft → in_review → published → archived`), `consent_status`, `certificate.status`, soft-delete-only. RBAC references [docs/architecture/06-permission-matrix.md](../architecture/06-permission-matrix.md). New modules (Passports, Stories, Partners, Organizations, Permissions, Research, the claim-review + blockchain surfaces) extend — never replace — the Phase 1 shell.

> **Reuse over restatement.** Every module is the same three reusable patterns (§1) parameterized by resource. This doc shows the patterns once, then only the screens that differ. Phase 1's shell, list, editor, and dashboard ([architecture/08]) still stand; this adds the Phase 2 modules and screens.

---

## 0. Global shell (extends Phase 1)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ◐ Planet B Admin    ⌘K search registry / anything    [chapter ▾] [you ▾]  │
├────────────────┬───────────────────────────────────────────────────────────┤
│ Dashboard      │                                                           │
│ Genesis ★      │                                                           │
│ ─ COLLECTIONS  │                                                           │
│ Passports  ◆   │     ░░░  module content (list / editor / queue)  ░░░       │
│ Artists        │                                                           │
│ Artworks       │                                                           │
│ Stories    ◆   │                                                           │
│ Certificates   │                                                           │
│ Chapters       │                                                           │
│ Partners   ◆   │                                                           │
│ Organizations  │                                                           │
│ Media Library  │                                                           │
│ Timeline       │                                                           │
│ Research   ◆   │                                                           │
│ Press          │                                                           │
│ Impact         │                                                           │
│ ─ TRUST        │                                                           │
│ Blockchain ◆⊘  │   ⊘ = read-only panel                                     │
│ ─ SYSTEM       │                                                           │
│ Users          │                                                           │
│ Permissions ◆  │                                                           │
│ Audit Logs     │   (sidebar items hidden if no permission — RBAC-driven)   │
│ System Settings│                                                           │
└────────────────┴───────────────────────────────────────────────────────────┘
  ★ pinned + protected (Principle II)     ◆ = new in Phase 2
```

- **Genesis ★** is pinned and cannot be deleted/replaced. The **Genesis Archive** is the curated view of Genesis ★ (the 14 founding certificates + their artists, artworks, media, timeline, press — see §3.2).
- Sidebar renders only modules the user can access (RBAC, §RBAC). **⌘K** searches by Registry ID, Passport ID, certificate Public ID, name, or relation.

---

## 1. Reusable patterns (every module inherits these)

Every module supports, via these three patterns: **search · filtering · bulk editing · version history · soft delete · restore · draft/published · approval workflow.**

### 1.1 Pattern A — Standard list view ("the collection")

```
{Module}                                  [+ New] [Bulk ▾] [Import ▾] [Export ▾]
Filters: [chapter ▾][status ▾][verified ▾][consent ▾][…facets] 🔍[__________]
Saved views: ● All  ○ Needs review  ○ Drafts  ○ Archived  ○ Mine
┌─┬──────────────┬───────────────┬─────────┬───────────┬──────────┬─────────┐
│☐│ Registry ID  │ Title / Name  │ Chapter │ Status    │ Verified │ Updated │
├─┼──────────────┼───────────────┼─────────┼───────────┼──────────┼─────────┤
│☐│ PB-…-000002  │ …             │ Abuja26 │ ● Publ.   │ ✓        │ 2d ago  │
│☐│ PB-…-000015  │ —reserved—    │ Abuja26 │ ◌ Resv.   │ —        │ —       │
│☐│ PB-…-000009  │ … (archived)  │ Lagos   │ ▤ Archived│ ✓        │ 9d ago  │
└─┴──────────────┴───────────────┴─────────┴───────────┴──────────┴─────────┘
Selected: 3  [Submit for review][Publish][Archive][Restore][Tag][Assign…]  ◀1 2 3▶
```

- **Status pills:** ● Published · ◐ In review · ○ Draft · ◌ Reserved · ▤ Archived.
- **Bulk editing:** selection bar acts on N rows (status transitions, tag, assign chapter/reviewer) — every action audit-logged.
- **Soft delete / restore:** "Archive" sets `archived_at`; archived rows reachable via the **Archived** view + **Restore**. Never gone (Principle VIII).

### 1.2 Pattern B — Standard editor + revision-history sidebar

```
← {Module}        {Record title}      PB-…-000002      ● Published   [⋯]
[ Details ][ Media ][ Relationships ][ Story ][ Provenance ][ History ][ Settings ]
┌──────────────────────────────────────────────────┬───────────────────────────┐
│ DETAILS                                            │ REVISION HISTORY          │
│  Field*   [____________________]                   │ ┌───────────────────────┐ │
│  Field    [____________________]                   │ │ v12 ● now  you        │ │
│  Consent  (granted ▾)   Verified (✓)               │ │ v11   2d   a.archivist│ │
│  …                                                 │ │ v10   9d   y.snoz     │ │
│                                                    │ │  …                    │ │
│  ┌─ Approval workflow ──────────────────────────┐ │ │ [Compare] [Restore v] │ │
│  │ status: ○Draft →◐In review →●Published         │ │ └───────────────────────┘ │
│  │ Assigned reviewer: [⌕ a.archivist]            │ │ Audit: who/when/IP        │
│  │ [Save draft][Submit for review][Publish]      │ │ (audit_logs)              │
│  └──────────────────────────────────────────────┘ │                           │
└──────────────────────────────────────────────────┴───────────────────────────┘
  Last saved 12:04 (autosave)        Settings tab: slug (locks on publish),
                                     Archive/Restore, danger zone (archive only)
```

- **Version history** = `revisions` timeline with **Compare** (diff) + **Restore to version**. **History tab** also surfaces `audit_logs` (who/when/IP).
- **Draft/published + approval** = the `status` machine (`draft → in_review → published → archived`) with optional `assigned_to`/reviewer. Same control on every module.

### 1.3 Pattern C — Review / approval queue

```
{Queue name}                         [status ▾ in_review][chapter ▾][assignee ▾]
┌──────────┬───────────────┬──────────────┬──────────┬────────┬───────────────┐
│ Item     │ Submitted by   │ Summary      │ Flag     │ Age    │ Assignee      │
├──────────┼───────────────┼──────────────┼──────────┼────────┼───────────────┤
│ PB-…-031 │ y.snoz         │ Story: …     │          │ 4h     │ — [claim]     │
│ CR-0007  │ y.durodola@…   │ Claim PB-ABJ │ ⚠ low OCR│ 3h     │ a.archivist   │
└──────────┴───────────────┴──────────────┴──────────┴────────┴───────────────┘
  [ Approve ]  [ Request changes ]  [ Reject ▾ ]  [ Reassign ]   ← decisions
  Every decision → audit_logs (+ verification_events for claims/certs)
```

Used by: editorial review (Stories/Press/Research), consent gate (Artists), **certificate claim-review** (§4.4), and chapter-director approvals.

---

## 2. Module index (which pattern + notable facets)

| Module | Patterns | Key facets / notes |
|--------|----------|--------------------|
| Dashboard | custom | KPIs, pending queues, audit feed, preservation/fixity, anchoring status |
| Genesis Archive ★ | A+B (read-mostly) | curated Genesis view; immutable artifacts; preservation layer |
| Planet Passports ◆ | A+B+C | passport_status facet; claim-review queue (§4.2) |
| Artists | A+B | consent facet; ▲ self for `artist` role |
| Artworks | A+B | material/medium/year facets; Provenance tab |
| Stories ◆ | A+B+C | block editor (§4.3); kind facet; entity links |
| Certificates | A+B+C | issuance (§4.4); status facet; claim-review |
| Chapters | A+B | Genesis ★ protected; chapter scope |
| Partners ◆ | A+B | partner role facet; ↔ Organizations |
| Organizations | A+B | type facet; org-scoped editing |
| Media Library | A (grid)+B | DAM grid (§4.5); license/rights facets |
| Timeline | A+B | phase facet; per-chapter ordering |
| Research ◆ | A+B+C | researcher authoring; draft research readable by researchers |
| Press | A+B | outlet/topic facets; link-rot snapshot |
| Impact | A+B (+dash) | metric facets; Impact dashboard (§4.7) |
| Users | A+B | invite, deactivate (never delete) |
| Permissions ◆ | matrix | role↔permission grid (§5) |
| Audit Logs | A (read-only) | actor/entity/action filters; export |
| System Settings | forms | thresholds, policies, editorial deep-links |

---

## 3. Dashboard & Genesis Archive

### 3.1 Dashboard (extends Phase 1)

```
Welcome back.                                              Chapter: All ▾
┌ KPIs ───────────────────────────────────────────────────────────────────┐
│ [Artists 29][Artworks 16][Certificates 30 · 14 issued/15 resv][Media 22] │
│ [Passports 14 · 6 unclaimed][Stories 5][Claims 3 pending]                 │
└──────────────────────────────────────────────────────────────────────────┘
Queues:  Pending review (4)  ·  Claim requests (3)  ·  Awaiting consent (28)
Recently edited · · ·                  Impact: waste — · press 3 · reach —
Trust:  Off-chain verify ✓ live   ·   On-chain anchoring ⊘ not enabled
Preservation: ✓ fixity 22/22 masters · last backup 03:00
Audit feed: "a.archivist approved claim CR-0006 · 1h" · "y.snoz published …"
```

### 3.2 Genesis Archive ★ (NEW — the curated, protected view)

```
← Genesis Archive ★   Abuja 2026 · Genesis Chapter   immutable 🔒
The founding record. Artifacts are never altered, redesigned, or replaced.
┌ The 14 founding certificates ───────────────────────────────────────────┐
│ PB-ABJ-2026-001  … Artist  ✓ verified  ◆ claimed     [open]              │
│ PB-ABJ-2026-002  Ajayi E. Snoz · Artist ✓ verified ◆ claimed [open]      │
│ …                                                                        │
│ PB-ABJ-2026-015  —reserved 15th-artist slot— ◌  (not in collection)      │
└──────────────────────────────────────────────────────────────────────────┘
Per-certificate preservation layer (read view):
  Registry ID · Cert page /certificates/{publicId} · Verification status ·
  Signatories (council) · Hi-res master (sha256 fixity) ·
  Related: artist · artwork · chapter · videos · timeline · press · catalogue
Actions here are limited to: [View] [Export archive bundle] [Re-render PDF*]
  *re-render improves rendering only; the hashed record is immutable.
```

Editing Genesis records is blocked at the resource shell (`immutable = true`); the only writes are additive preservation metadata and re-rendering (record stays immutable). See [05-certificate-verification-spec §C](05-certificate-verification-spec.md).

---

## 4. New Phase 2 screens (detailed)

### 4.1 Planet Passport — overview

```
Passports                                   [+ New Passport][Bulk ▾][Export ▾]
Filters: [country ▾][passport_status ▾ unclaimed|claimed|linked][chapter ▾] 🔍
┌─┬─────────────┬──────────────┬─────────┬───────────┬──────────┬──────────┐
│☐│ Passport ID │ Name         │ Country │ Status    │ Certs    │ Updated  │
├─┼─────────────┼──────────────┼─────────┼───────────┼──────────┼──────────┤
│☐│ PB-ID-000001│ Ajayi E.Snoz │ NG      │ ● linked  │ 2        │ 2d       │
│☐│ PB-ID-000007│ Y. Durodola  │ NG      │ ○ unclaim │ 4        │ —        │
└─┴─────────────┴──────────────┴─────────┴───────────┴──────────┴──────────┘
```

### 4.2 Passport editor + claim-review queue (NEW)

```
← Passports   Ajayi Elijah Snoz   PB-ID-000001   ● linked   (people: PB-ARTIST-000001)
[ Identity ][ Contributions ][ Certificates ][ Stories ][ Claims ][ History ]
┌───────────────────────────────────────────────┬───────────────────────────┐
│ IDENTITY (projection of people — not editable  │ REVISION HISTORY          │
│ as a user account; ADR-0002)                   │ v8 ● now · v7 2d · …      │
│  Full name [Ajayi Elijah Snoz   ] Country [NG] │ [Compare][Restore]        │
│  Roles  [Artist][Storyteller][Founding Narrator]│──────────────────────────│
│  Consent (granted ▾)                            │ AGGREGATED (computed,     │
│  passport_status (linked ▾)                     │ not duplicated):          │
│                                                 │  • 2 certificates          │
│ CONTRIBUTIONS  (contributions table)            │  • 1 artwork               │
│  + exhibition · award · mentorship · talk …     │  • 3 timeline events       │
│    [The Watchful Eye unveiling · 2026-03-14]    │  • 2 stories               │
└───────────────────────────────────────────────┴───────────────────────────┘

── CLAIMS tab → Claim-Review Queue (Pattern C + claim specifics) ────────────
┌──────────┬──────────────┬───────────────┬──────────┬────────┬─────────────┐
│ Request  │ Claimant      │ Best match    │ Conf.    │ Status │ Reviewer    │
├──────────┼──────────────┼───────────────┼──────────┼────────┼─────────────┤
│ CR-0007  │ y.durodola@…  │ PB-ABJ-2026-11│ 0.62 ⚠   │ needs… │ a.archivist │
│ CR-0006  │ self@…        │ PB-ABJ-2026-02│ 0.97 ✓   │ matched│ — (auto?)   │
└──────────┴──────────────┴───────────────┴──────────┴────────┴─────────────┘
  ┌─ Review CR-0007 ────────────────────────────────────────────────────────┐
  │ Uploaded scan (read-only) │ OCR text + parsed fields │ Candidate(s)      │
  │ ┌────────────┐            │ name=Durodola            │ ●PB-ABJ-2026-011  │
  │ │[cert image]│            │ role=Facilitator         │  conf 0.62        │
  │ └────────────┘            │ chapter=Abuja 2026       │ ○ [⌕ find cert]   │
  │ Anti-fraud: ✓ unclaimed  ✓ issued  ⚠ low OCR  ✓ reviewer≠submitter      │
  │ [ Approve & claim (MFA) ]  [ Reject ▾ ]  [ Reassign ]                    │
  └─────────────────────────────────────────────────────────────────────────┘
```

The queue is driven by `claim_requests` (`uploaded → ocr_done → matched → needs_review → claimed|rejected`); approval creates/links `passport_claims` and writes `verification_events`. Full logic: [05-certificate-verification-spec.md](05-certificate-verification-spec.md). Chapter-scoped reviewers see only their chapter's claims.

### 4.3 Story editor — block-based, links to entities (NEW)

```
← Stories   "The Eye That Watches the Earth"   PB-STORY-000003   ◐ In review
[ Compose ][ Cover ][ Connections ][ SEO ][ Settings ][ History ]
┌──────────────────────────────────────────────┬───────────────────────────┐
│ COMPOSE (block JSON → stories.body)            │ BLOCK PALETTE             │
│  ┌──────────────────────────────────────────┐ │  ¶ Text   ❝ Quote         │
│  │ ¶  In Abuja, fourteen artists turned …    │ │  ▭ Image  ▣ Gallery       │
│  ├──────────────────────────────────────────┤ │  ▶ Video  ─ Divider       │
│  │ ▭  [media: PB-MEDIA-000012  alt set ✓]    │ │  ◧ Entity card            │
│  ├──────────────────────────────────────────┤ │  ⌗ Pull-stat (impact)     │
│  │ ◧  Entity card → PB-ARTWORK-000002         │ │                           │
│  │     "The Watchful Eye" (relation=features) │ │ CONNECTIONS (entity_links)│
│  ├──────────────────────────────────────────┤ │  features → PB-ARTWORK-002 │
│  │ ❝  "There is no Planet B." — E. Snoz       │ │  mentions → PB-ARTIST-001  │
│  └──────────────────────────────────────────┘ │  belongs_to → Abuja26 ch.  │
│  kind (feature ▾)  chapter [Abuja 2026]        │  [+ link entity ⌕]        │
│  [Save draft][Submit for review][Publish]      │                           │
└──────────────────────────────────────────────┴───────────────────────────┘
```

Blocks serialize to `stories.body` (block JSON). Inserting an **Entity card** creates an `entity_links` row with `relation ∈ {features, mentions, belongs_to}` (controlled vocab, `relations`). Story is a first-class connective object (ADR-0003). Editorial review uses Pattern C.

### 4.4 Certificate issuance + claim-review (NEW/extended)

```
← Certificates                          [Issue ▾ single|batch][Bulk ▾][Export ▾]
Filters: [chapter ▾][status ▾ draft|issued|revoked|reserved][role ▾] 🔍
┌─┬───────────────┬─────────────┬──────────┬───────────┬──────────┬─────────┐
│☐│ PB-ABJ-2026-02│ E. Snoz     │ Artist   │ ● issued  │ ✓ hash   │ claimed │
│☐│ PB-ABJ-2026-15│ —reserved—  │ —        │ ◌ reserved│ —        │ —       │
└─┴───────────────┴─────────────┴──────────┴───────────┴──────────┴─────────┘

── Issue (batch) ──────────────────────────────────────────────────────────
  Source: person_chapter_role rows where consent=granted, no cert yet
  ┌──────────────────────────────────────────────────────────────────────┐
  │ ☑ Y. Durodola · Facilitator · Abuja26    will mint PB-ABJ-2026-011    │
  │ ☑ …                                                                   │
  │ Preview seal: [◉ oxblood eye · serif name · role · QR · mono ID]      │
  │ On issue: assign publicId, compute verificationHash (CertificateClaim │
  │ V1), generate QR+PDF. status draft → issued.  [Issue selected (MFA)]  │
  └──────────────────────────────────────────────────────────────────────┘

── Certificate editor → Provenance + claim status ─────────────────────────
[ Details ][ Seal/PDF ][ Provenance ][ Claims ][ History ]
  PROVENANCE: verificationHash ✓ · soulboundRef — · onchain_refs ⊘ none yet
  CLAIMS:  claim_requests for this cert (see §4.2 queue); one-claim-per-cert
  Actions: [Re-render PDF*] [Revoke (two-person + MFA)]   *record immutable
```

Revoke is a `status` change (`issued → revoked`), never a delete — two-person + MFA (sensitive action). Claim-review reuses §4.2 / [05-spec].

### 4.5 Media Library — DAM grid + metadata panel (NEW/extended)

```
Media Library                    [⤒ Upload][Bulk tag][Bulk license][Export ▾]
Filters: [kind ▾ image|video|audio|document][license ▾][rights ▾][chapter ▾][tags ▾] 🔍
┌────────────┬─────────────────────────────────────────┬──────────────────────┐
│ Facets     │  GRID                                     │ METADATA PANEL       │
│ ☐ image 18 │  ┌────┐┌────┐┌────┐┌────┐┌────┐          │ PB-MEDIA-000012      │
│ ☐ video 3  │  │▭ ✓ ││▭ ⚠ ││▶   ││♪   ││▭ ✓ │          │ image · 4032×3024     │
│ ☐ audio 1  │  └────┘└────┘└────┘└────┘└────┘          │ master ✓ sha256 ✓     │
│ License    │  ┌────┐┌────┐┌────┐┌────┐┌────┐          │ alt* [Eye assemblage]│
│ ☐ CC-BY    │  │…   ││…   ││…   ││…   ││…   │          │ caption […]          │
│ ☐ © held   │  └────┘└────┘└────┘└────┘└────┘          │ credit [Photo: …]    │
│ Rights     │  ✓=alt+fixity ok  ⚠=missing alt/derivativ│ usage_rights [...]   │
│ ☐ cleared  │                                          │ rights_holder [...]  │
│ ☐ unknown  │  [drop files here to upload]              │ derivative_of [...]  │
│            │                                          │ variant [hi-res]     │
│            │                                          │ Used in: 3 records   │
└────────────┴─────────────────────────────────────────┴──────────────────────┘
```

The DAM is the `assets` view over `media` (adds `usage_rights`, `rights_holder`, `derivative_of`, `variant`) — we **extend `media`, not fork it** (ADR / [09-media-management]). Missing `altText` (⚠) blocks publish (a11y). Masters are fixity-checked (`sha256`) and never overwritten; derivatives are regenerable.

### 4.6 Blockchain / anchoring status — READ-ONLY panel (NEW)

```
← Blockchain  Trust Layer · Anchoring status   ⊘ READ-ONLY   flag: OFF
┌ Off-chain verification (LIVE) ───────────────────────────────────────────┐
│  /verify hash check:  ✓ enabled    14/14 issued certs hash-valid          │
└──────────────────────────────────────────────────────────────────────────┘
┌ On-chain anchoring (DESIGNED — not enabled) ─────────────────────────────┐
│ Provider: —    Network: —    Custody: optional (artist may have no wallet)│
│ chain_anchors:  (none)                                                    │
│  ┌─ anchor_id ──── merkle_root ──── members ── provider ── status ──────┐ │
│  │ —             —                  —          —          —              │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│ onchain_refs (sbt|anchor|attestation):  (none)                            │
│ verification_events (verify/claim/anchor/mint): 41 logged                  │
└──────────────────────────────────────────────────────────────────────────┘
No write controls here — anchoring/minting are enabled via System Settings flag
and operated by jobs ([06-solana-integration-plan],[07-blockchain-abstraction]).
```

Strictly read-only: surfaces `chain_anchors`, `onchain_refs`, and `verification_events`. Nothing mints from this screen.

### 4.7 Impact dashboard (NEW)

```
← Impact   Movement impact   Chapter: All ▾   As of [latest ▾]
┌ Headline metrics (impact_metrics) ───────────────────────────────────────┐
│ [Waste diverted  — kg ⚠unverif][Artists 29][Artworks 16][Press 3 ✓]      │
│ [Reach —][Chapters 1 ★ genesis][Countries 1]                             │
└──────────────────────────────────────────────────────────────────────────┘
By chapter:  Abuja26 ▇▇▇▇▇▇  (others —)        Verified ✓ vs Pending ⚠ shown
Trend (per metric over as_of dates):  ▁▂▃▅▆  [add data point][import][export]
Each metric: value · unit · source · verified flag · as_of   (Pattern A/B editor)
```

Metrics carry a `verified` flag and `source` (accuracy over completeness, Principle VI). Unverified metrics render with ⚠ and are excluded from public headline figures by default.

---

## 5. Permissions module (NEW) — RBAC

```
← Permissions   Roles × Permissions matrix          [Seed/reset (idempotent)]
Roles → super_admin platform_admin archivist content_editor chapter_director
        chapter_editor researcher media_manager artist partner_org public
┌ Resource.action ───────────┬ super ┬ plat ┬ arch ┬ … ┬ artist ┬ public ┐
│ artwork.update             │  ✓    │  ✓   │  ✓   │   │ ▲ own  │   —    │
│ certificate.issue          │  ✓    │  ✓   │  ✓   │   │   —    │   —    │
│ certificate.revoke         │  ✓    │  ✓   │  —   │   │   —    │   —    │
│ claim.review (approve)     │  ✓    │  ✓   │  ✓   │   │   —    │   —    │
│ story.publish              │  ✓    │  ✓   │  —   │   │   —    │   —    │
│ media.upload               │  ✓    │  ✓   │  ✓   │   │ ▲ own  │   —    │
│ verify (certificate)       │  ✓    │  ✓   │  ✓   │   │  ✓     │  ✓     │
└────────────────────────────┴───────┴──────┴──────┴───┴────────┴────────┘
  ✓ allowed · ▲ own/scoped · — denied (deny-by-default).  No hard-delete anywhere.
  Scope: chapter_director/editor carry chapter_id; a Lagos director ≠ Abuja.
```

### RBAC — who sees/does what (reference [architecture/06-permission-matrix.md](../architecture/06-permission-matrix.md))

| Phase 2 surface | Allowed (read/act) | Notes |
|-----------------|--------------------|-------|
| Genesis Archive ★ | all admin roles **read**; writes blocked (immutable) | only additive preservation metadata; super/platform for re-render |
| Passports + claim-review | super, platform, archivist; chapter_director ▲ own chapter | `artist` ▲ self (own passport); `claim.review` excludes submitter |
| Stories (block editor) | content_editor author/publish; chapter_dir/editor ▲ propose | review queue = Pattern C |
| Certificate issuance | platform (issue/revoke), archivist (issue), chapter_director ▲ issue | MFA; revoke = two-person |
| Certificate claim-review | super, platform, archivist, chapter_director ▲ own chapter | sensitive-action gate (MFA) |
| Media Library (DAM) | media_manager ✓; archivist ✓; chapter_editor ▲ upload; artist ▲ own | master operations = archivist |
| Blockchain panel ⊘ | super, platform (view); archivist view | read-only for all; enable via Settings |
| Impact dashboard | super, platform, archivist; chapter_director ▲ own | verify flag set by archivist/platform |
| Permissions module | super, platform | role grants are sensitive (MFA + audit, optional two-person) |
| Audit Logs | super, platform (view), archivist (view); chapter_director ▲ own ch. | export; read-only |
| System Settings | super, platform; content_editor ▲ editorial | thresholds/policies = super/platform |

All sensitive actions (`certificate.issue/revoke`, `user.manage`, `settings.manage`, `*.restore`, claim approval) require **MFA**, are **audit-logged**, and support **two-person approval** as configurable policy.

---

## 6. System Settings (notable Phase 2 additions)

```
← System Settings
[ General ][ Trust & Claims ][ Approvals ][ Editorial ][ Preservation ]
  TRUST & CLAIMS:
    OCR provider [cloud | local | stub ▾]        (replaceable — no lock-in)
    Confidence:  τ_auto [0.95]  τ_review [0.60]  OCR-floor [0.70]
    Weights: w_id[.50] w_name[.25] w_role[.10] w_ctx[.15]
    Auto-approve claims at ≥ τ_auto  [ off ▾ ]   (default human-gated)
  APPROVALS:
    Two-person approval: certificate.issue [on] revoke [on] claim [off] roles [on]
    MFA required for sensitive actions [on]
  Blockchain anchoring  [ disabled ▾ ]   (read-only panel until enabled)
  Threshold/policy changes are versioned + audit-logged.
```

---

## Open questions for approval

1. **Genesis count in the Archive view (14 vs 15).** Same tension as the cert spec: brief says **14 founding certificates**; Phase 1 shows a reserved 15th-artist slot. The Genesis Archive renders 14 issued + 1 reserved (excluded from "the collection"). Confirm the display/count.
2. **Sidebar grouping.** Approve the proposed sections (Collections / Trust / System) and the placement of new modules (Passports, Stories, Partners, Research, Permissions, Blockchain).
3. **Partners vs Organizations.** Brief lists both as modules. Proposed: **Organizations** = the canonical `organizations` records; **Partners** = a filtered/role-scoped view (`ChapterPartner` relations) over Organizations. Confirm they are one data model with two views, not two tables.
4. **Permissions module scope.** Read-only matrix viewer vs editable role↔permission grid in-app (roles are currently seeded via idempotent migration). Should editing roles be possible in the UI, or stay migration-only with the module as a viewer?
5. **Auto-approve claims.** Default proposed **off** (always human-reviewed). Approve, or allow auto-claim at `confidence ≥ τ_auto`?
6. **Block-editor block set.** Confirm the Story block palette (Text, Quote, Image, Gallery, Video, Divider, Entity card, Pull-stat) and that Entity cards are the only writer to `entity_links` from the Story editor.
7. **Re-render policy on immutable certs.** Confirm that re-rendering a Genesis certificate PDF (rendering improves; hashed record unchanged) is permitted and which roles may do it.
