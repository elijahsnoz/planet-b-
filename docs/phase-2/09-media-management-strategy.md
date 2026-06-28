# 09 · Media Management Strategy (Digital Asset Management)

**Purpose.** Define the Digital Asset Management (DAM) discipline for Planet B — how every uploaded file becomes a permanent, attributed, regenerable **asset** with mandatory metadata, a master/derivative lineage, fixity proof, and graph links — so the archive's imagery, video, audio, and documents remain trustworthy, accessible, and machine-addressable at the scale of 250,000+ artworks across 500+ chapters. *Will this help preserve the history, credibility, and future of the Planet B movement?* Media is where most of that history physically lives; this strategy is the answer for the binaries.

**Extends.** [architecture/05 — Storage Strategy & Digital Asset Management](../architecture/05-storage-strategy.md) (buckets, ingestion pipeline, delivery) and [docs/15 — Historical Archive Strategy](../15-historical-archive-strategy.md) (preservation, fixity, format durability). Builds on the existing rich `media` table in [db/schema.ts](../../db/schema.ts) and the `Media` type in [models/index.ts](../../models/index.ts). Honors the canon in [00-README.md](00-README.md): Repository Pattern ([ADR-0004](adr/0004-repository-pattern.md)), design-for-Postgres / run-on-SQLite ([ADR-0001](adr/0001-data-backbone.md)), nothing hard-deleted. This document **amends, never restates** — where architecture/05 already specifies bucket layout and the ingest pipeline, we reference and extend it.

---

## 1. `assets` — the DAM view over `media`

The canon is explicit: **we extend `media`, we do not fork it.** `assets` is the Phase 2 DAM record — the existing rich `media` table plus four additive columns. Every uploaded file is an **asset**, addressable by its Registry ID `PB-MEDIA-<NNNNNN>` (the `asset` kind is a canonical *alias* of `media` where the DAM framing reads better — see [00-README.md](00-README.md) § Identifiers).

### 1.1 Columns already present on `media` (do not re-add)
```
id · registry_id (PB-MEDIA-*) · slug · status · verified · archived_at  (governance)
kind (image|video|audio|document) · title · description
storage_path (web/derivative key) · master_path (archive/source key)
sha256 · bytes · mime · width · height · duration_s
alt_text · caption · credit · source · license · author · copyright
tags[] · capture_date · location
created_at · updated_at · created_by · updated_by
```

### 1.2 Additive Phase 2 columns (the four the canon names)
| Column | Type | Meaning |
|--------|------|---------|
| `usage_rights` | text | What may be done with the asset (e.g. `editorial-only`, `web-and-print`, `embargoed-until:2027-01-01`, `restricted`). Distinct from `license` (the legal instrument) — `usage_rights` is the operational grant. |
| `rights_holder` | text | The party who holds rights (e.g. `Royal Norwegian Embassy & Nike Art Gallery`). Distinct from `author` (who created the file) and `copyright` (the © string). |
| `derivative_of` | text (FK → `media.id`) | The master this asset was generated from. `null` ⇒ this row **is** a master. The lineage edge. |
| `variant` | text | The derivative role: `original` (master) · `avif-400` · `avif-800` · `avif-1600` · `avif-2400` · `webp-*` · `poster` · `proxy-av1` · `proxy-h264` · `thumb` · `vtt` · `pdfa` · `text` (extracted). |

> Postgres-ready, SQLite-mirrored: these are four nullable text columns added to the existing table. No type sits outside what SQLite already stores. In Postgres `derivative_of` becomes a real FK with `on delete restrict` (masters are never deleted anyway).

### 1.3 Mandatory metadata on every asset

The brief's required fields, mapped to **where each one lives** — a column on `assets`/`media`, or an edge in `entity_links` (the polymorphic knowledge graph, [03](03-knowledge-graph.md)). The rule: *intrinsic facts about the file are columns; relationships to other records are edges.*

| Field | Storage | Notes |
|-------|---------|-------|
| **Creator** | column `author` | Who made the file (photographer, videographer). `credit` carries the display string ("Photo: Benjamin Oladapo"). |
| **Copyright** | column `copyright` + `rights_holder` | © string + the holding party. |
| **License** | column `license` | The legal instrument (`CC-BY-4.0`, `all-rights-reserved`, …). |
| **Tags** | column `tags[]` | Free + controlled vocabulary; feeds search. |
| **Alt Text** | column `alt_text` | **Mandatory for publish** (WCAG AA, archive integrity). A media asset cannot move `draft → published` without it. |
| **Capture Date** | column `capture_date` | When the original was shot/recorded (not upload date). |
| **Chapter** | edge `entity_links(media → chapter, relation='belongs_to')` | Which chapter the asset documents. Stored as an edge so an asset can belong to / be reused across contexts without a column rewrite. |
| **People** | edge `entity_links(media → person, relation='depicts')` | Who appears in / is the subject of the asset. Gated by each person's `consent_status` before public exposure. |
| **Artworks** | edge `entity_links(media → artwork, relation='depicts')` | The artwork an image documents. (`artworks.primary_media` / `detailMedia` remain the curated picks; edges hold the full set.) |
| **Organizations** | edge `entity_links(media → organization, relation='credits' \| 'belongs_to')` | Sponsor/host/media-partner association. |

> **Columns vs edges, stated once:** Creator, Copyright, License, Tags, Alt Text, Capture Date are **columns** (intrinsic). Chapter, People, Artworks, Organizations are **`entity_links` edges** (relationships). This is the single source of truth for the rest of the platform.

Publish gate (enforced in the repository/service layer, never in a route): `status = published` requires `alt_text` present, `license` set, `sha256` present, and — when the asset `depicts` a person — that person's `consent_status = granted` (Principle IV).

---

## 2. The master / derivative model

Two physical classes of asset, one table:

```
                          ┌──────────────────────────────────────────────┐
                          │  ASSET (media row, PB-MEDIA-*)                 │
                          └──────────────────────────────────────────────┘
                                   │                          │
              variant='original'  │                          │  variant='avif-1600' …
              derivative_of=null  │                          │  derivative_of=<master.id>
                                   ▼                          ▼
          ┌────────────────────────────────┐   ┌────────────────────────────────────┐
          │  MASTER  (immutable)            │   │  DERIVATIVE  (regenerable)          │
          │  master_path → archive/source/  │   │  storage_path → /public/media or    │
          │               or  masters/ bucket│   │                images|video bucket  │
          │  sha256 = fixity anchor          │   │  no canonical sha256 required —      │
          │  manifest.json = provenance      │   │  reproducible from master byte-for- │
          │  NEVER edited / renamed / deleted │   │  byte spec (format, size, quality)  │
          └────────────────────────────────┘   └────────────────────────────────────┘
```

- **Masters are immutable.** They live in `archive/source/` now (cold-storage seed, with `archive/manifest.json` recording path + `sha256` + provenance per item) and migrate into the private `masters` bucket later, *carrying their recorded checksums*. Masters are never edited, renamed, or overwritten — only the `sha256` proves them.
- **Derivatives are regenerable.** AVIF/WebP at `{400, 800, 1600, 2400}px`, video proxies (AV1 + H.264) + poster + WebVTT, PDF/A + extracted text for documents. Any derivative can be deleted and re-created idempotently from the master (format upgrades, new sizes) with **zero data loss**. They are linked to their master by `derivative_of` + tagged by `variant`.
- **Provenance travels with the asset.** `source`, `credit`, `license`, `rights_holder`, `alt_text`, `caption` are mandatory and preserved (architecture/15 Principle 4). The `archive/manifest.json` is the master provenance ledger; the DB row is its queryable projection.

### 2.1 The ingest pipeline (upload → checksum → metadata → derivatives → graph)

This **extends** the architecture/05 pipeline by making the graph-linking step first-class and routing through the repository layer.

```
  ADMIN UPLOAD (server action / route handler)
        │  original bytes
        ▼
 ┌──────────────┐   1. STORE MASTER
 │  StorageRepo │──────────────────────────────►  archive/source|masters bucket (private)
 │  .putMaster()│                                  master_path set, never re-touched
 └──────┬───────┘
        │ 2. CHECKSUM + PROBE
        ▼
   sha256(bytes), bytes, mime, width/height, duration_s
        │            │
        │            └── 2a. DEDUPE: if sha256 already exists → return existing
        │                    PB-MEDIA id, link new context as edge. No second copy.
        ▼
 ┌──────────────┐   3. MINT + WRITE METADATA  (MediaRepository.create)
 │ RegistryRepo │──► PB-MEDIA-<NNNNNN>          status=draft, variant=original,
 │ .mint(media) │    write media row +          derivative_of=null
 └──────┬───────┘    audit_log + revision v1
        │ 4. DERIVATIVE GENERATION  (async job / Edge Function / queue)
        ▼
   image → AVIF/WebP @ 400/800/1600/2400   ┐
   video → AV1+H.264 proxy + poster + VTT  ├─► each derivative = new media row
   doc   → PDF/A + thumbnail + text        ┘     derivative_of=<master>, variant=*
        │                                          storage_path → public bucket/CDN
        ▼
 ┌──────────────┐   5. GRAPH LINKING  (GraphRepository.link)
 │  GraphRepo   │──► entity_links edges: belongs_to(chapter), depicts(person|artwork),
 │  .link()     │    credits(org).  Consent re-checked for person edges.
 └──────┬───────┘
        │ 6. CURATOR APPROVAL  →  status: draft → in_review → published
        ▼
   emit  media.published  →  search re-index · CDN cache purge · verification_events(opt)
```

Steps 1–3 are synchronous (fast, on the request). Steps 4–6 are asynchronous and **idempotent** — re-runnable forever as formats evolve. Nothing in this pipeline imports a DB driver or a storage SDK directly; everything goes through a repository (§4).

---

## 3. Storage backends (local now → Supabase later, swappable)

Per [ADR-0001](adr/0001-data-backbone.md) we run on local storage now and design for Supabase Storage. The switch is a driver change behind `StorageRepository`, not a rewrite.

### 3.1 Now (run-on)
```
/public/media/{chapter}/{entity_type}/{registry_id}/{variant}.{ext}   ← web derivatives (served by Next.js / next/image)
archive/source/{...}                                                  ← masters (immutable, checksummed, manifest.json)
```

### 3.2 Later (design-for, Supabase Storage — parallel layout)
Buckets exactly as architecture/05 defines them (referenced, not restated): `masters` (private), `images` (public/CDN), `video` (public/CDN), `documents` (mixed), `certificates` (signed), `brand` (public).

Path convention is **identical** in both worlds so the migration is a copy, not a re-key:
```
{bucket}/{chapter}/{entity_type}/{registry_id}/{variant}.{ext}
e.g.  images/abuja-2026/artwork/PB-MEDIA-000042/avif-1600.avif
      masters/abuja-2026/artwork/PB-MEDIA-000042/original.tiff
```
Deterministic, debuggable, shardable. The `{registry_id}` segment is the natural shard key (§5).

### 3.3 Access control & signed URLs
| Asset class | Delivery | Authz |
|-------------|----------|-------|
| Public derivative (image/video/doc) | CDN, long-TTL, content-hashed path | none — `status=published` + no consent block |
| Master | signed URL only | staff with `media.read_master` permission (RBAC) |
| Restricted / embargoed (`usage_rights=restricted\|embargoed`) | short-lived signed URL | authz check in service layer; never on public read API |
| Certificate PDF | signed URL | owner (claimed passport) or staff |

Restricted assets are gated by `usage_rights` + (later) Postgres **RLS**. The public read API ([10](10-api-design.md)) never emits a restricted/master/consent-pending asset. Signed URLs are minted by `StorageRepository.signedUrl(key, ttl)` *after* an RBAC check — the repository is the only place that talks to the storage SDK.

---

## 4. Repository Pattern (storage is swappable)

Business logic never imports Drizzle, the filesystem, or a Supabase SDK ([ADR-0004](adr/0004-repository-pattern.md)). Two interfaces own all media I/O:

```ts
// metadata I/O — backed by SQLite now, Postgres later
interface MediaRepository {
  create(input: NewAsset): Promise<Asset>;          // mints PB-MEDIA, writes row + audit + revision
  byRegistryId(id: string): Promise<Asset | null>;
  bySha256(hash: string): Promise<Asset | null>;    // dedupe lookup
  derivativesOf(masterId: string): Promise<Asset[]>;
  setStatus(id: string, status: Status): Promise<void>;  // never hard-deletes
  archive(id: string): Promise<void>;               // sets archived_at
}

// binary I/O — backed by local FS now, Supabase Storage later
interface StorageRepository {
  putMaster(key: string, bytes: Buffer): Promise<void>;   // write-once
  putDerivative(key: string, bytes: Buffer): Promise<void>;
  signedUrl(key: string, ttlSeconds: number): Promise<string>;
  publicUrl(key: string): string;
  checksum(key: string): Promise<string>;           // for fixity checks
  exists(key: string): Promise<boolean>;
}
```

Swapping `LocalStorageRepository` → `SupabaseStorageRepository` (and the Drizzle SQLite driver → Postgres) changes wiring, not features. This is what makes the backbone decision real.

---

## 5. Scale: millions of assets

Designed for 250,000+ artworks (each with many images), exhibition/workshop video, documents — across 500+ chapters.

- **Naming & sharding.** The `{registry_id}` path segment shards naturally; in object storage `PB-MEDIA-000042` distributes across prefixes. No directory ever holds "all images." Chapter is the top-level partition.
- **Dedupe by `sha256`.** Ingest looks up `MediaRepository.bySha256()` before storing. Identical bytes ⇒ one master, reused; the new *context* is added as `entity_links` edges, not a second file. (The same plate used in three stories is one asset, three edges.)
- **Lazy derivative generation.** Derivatives are generated on first need or by background backfill, not eagerly for every size. The master + the reproducible spec (`variant`) are the source of truth; a missing derivative is regenerated on demand and cached on the CDN.
- **Idempotent regeneration.** Because `derivative_of` + `variant` fully describe a derivative, a format migration (§6) is "delete derivatives, re-run job" — safe and resumable.
- **Keyset listing.** Admin/API media listings use keyset pagination (no deep offset) to stay fast at 250k+ rows ([10](10-api-design.md)).

---

## 6. Preservation (the 2125 requirement)

Extends architecture/15 directly.

- **Fixity checks & cadence.** Every master stores `sha256`. A scheduled job recomputes `StorageRepository.checksum()` and compares — **monthly** for the Genesis Chapter masters (sacred, Principle II), **quarterly** for all other masters, and **on every restore from backup**. A mismatch raises an integrity alert, is written to `audit_logs`, and triggers restore-from-replica. Masters carry **versioning + deletion protection**; lifecycle rules never expire them.
- **Format migration policy.** Masters are kept *as-is forever* (we never "upgrade" a master). Durability lives in the **derivatives**: images → AVIF/WebP (re-derive as successors emerge); video → AV1 + H.264 (+ future codecs); documents → PDF/A + UTF-8 extracted text. When a format approaches obsolescence we generate a new derivative `variant` from the untouched master — additive, never destructive.
- **Captions & transcripts (accessibility follow-up).** Every video master gets a **WebVTT** caption track (`variant='vtt'`) and a plain-text transcript; audio gets a transcript. This is both an accessibility requirement (WCAG AA) and a preservation one (architecture/15 Principle 2 — text is the most durable format). Tracked as an explicit follow-up task per the oral-history pass in architecture/15 § "Capturing what's missing now."
- **Backup / DR.** 3-2-1 backups of masters + DB; cross-region replication for `masters` and `certificates`; documented, tested restore. Full pointer to [architecture/12 — Backup & DR](../architecture/12-backup-and-dr.md). The `archive/source/` + `archive/manifest.json` pair is the vendor-independent cold-storage seed: the media layer is reconstructable without Supabase.

---

## Open questions for approval

1. **`usage_rights` vocabulary.** Adopt a fixed enum (`editorial-only · web-and-print · restricted · embargoed`) or keep it free-text with conventions? A controlled vocabulary makes the public API filterable and RLS simpler.
2. **Dedupe scope.** Dedupe by `sha256` *globally*, or *per chapter*? Global is leaner but means one chapter's edit can affect an asset another chapter relies on (mitigated by immutability + edges). Recommend global.
3. **Lazy vs eager derivatives at Genesis.** For the sacred Genesis Chapter, do we eagerly pre-generate all sizes/codecs (guaranteed instant, more storage) and lazy-generate everywhere else?
4. **`derivative_of` cardinality.** One master → many derivatives is settled. Do we ever need a derivative *of* a derivative (e.g. a crop of a web image)? Current design says no — always re-derive from the master. Confirm.
5. **Fixity cadence & alerting.** Confirm monthly (Genesis) / quarterly (all) and the on-call destination for integrity alerts.
6. **Consent-revocation cascade.** When a person's `consent_status` flips to `withheld`, do we auto-unpublish every asset that `depicts` them, or flag for curator review? (Affects whether the unpublish is a job or a worklist.)
