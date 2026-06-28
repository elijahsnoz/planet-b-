# 05 · Storage Strategy & Digital Asset Management

All binaries live in **Supabase Storage**; all *metadata* lives in the Postgres `media` table (the DAM registry). The two are linked by `media.registry_id` (`PB-MEDIA-000001`) and `storage_path`. **Masters are immutable; derivatives are regenerable** ([archive strategy](../15-historical-archive-strategy.md)).

## Buckets
| Bucket | Visibility | Contents | Notes |
|--------|-----------|----------|-------|
| `masters` | private | original uploads (un-touched) | served only via signed URLs to staff; never edited |
| `images` | public (CDN) | web derivatives (AVIF/WebP, sized) | generated from masters |
| `video` | public (CDN) | transcoded proxies (AV1/H.264) + posters + VTT | masters kept in `masters` |
| `documents` | mixed | catalogues, PDFs, press kits | public or signed per `license` |
| `certificates` | signed | generated certificate PDFs | access by owner/staff |
| `brand` | public | logos, brand assets | versioned |

Path convention: `{bucket}/{chapter}/{entity_type}/{registry_id}/{variant}.{ext}` — deterministic, debuggable, shardable.

## The `media` table (DAM record) — every asset's metadata
```
registry_id (PB-MEDIA-*) · kind (image|video|audio|document) · title · description
author · copyright · credit · license (CC-BY, all-rights-reserved, …) · tags[]
alt_text · capture_date · location (geo) · source · sha256 · bytes · mime · width · height · duration_s
storage_path (master) · derivatives jsonb (variants → paths) · captions_vtt_path
status · consent_status · created_by · archived_at · embedding (AI, nullable)
```
This satisfies the brief's full asset metadata set (Title, Description, Author, Copyright, Credits, License, Tags, Alt Text, Capture Date, Location, Related Objects, Version). **Related Objects** = rows in `entity_links` / `media_relations`. **Version** = `revisions`.

## Ingestion pipeline (upload → preserved + web-ready)
```
1. Admin uploads original  → masters/ (private)
2. Compute sha256, bytes, dimensions; create media row (status=draft); mint PB-MEDIA id
3. Async job (Edge Function / queue):
     images → AVIF/WebP @ {400,800,1600,2400}px → images/
     video  → AV1+H.264 proxies + poster + VTT stub → video/
     docs   → thumbnail + extracted text (search) → documents/
4. Write derivatives jsonb; set status=published when curator approves
5. Emit media.published → search re-index + cache purge
```
Derivatives are **idempotently regenerable** from the master — re-run anytime (format upgrades, new sizes) without data loss.

## Delivery
- Public assets via Supabase Storage CDN (or front with a dedicated CDN later) — long cache TTL, content-hashed paths for cache-busting.
- Private/licensed assets via **short-lived signed URLs** minted by the service layer after an authz check.
- `next/image` consumes the derivative variants (responsive `sizes`).

## Integrity & preservation
- `sha256` stored per master; scheduled **fixity checks** flag bit rot.
- Masters bucket has **versioning + deletion protection**; lifecycle rules never expire masters.
- Cross-region replication for `masters` and `certificates` (DR, [12](12-backup-and-dr.md)).
- The existing repo `archive/source/` + `archive/manifest.json` are the cold-storage seed; migration loads them into `masters` with their recorded checksums.

## Why not store binaries in Sanity?
Sanity's asset pipeline is convenient but becomes a second source of truth and a vendor lock for the *permanent record*. Masters must live where we control replication, checksums, lifecycle, and signed access — Supabase Storage. Sanity may upload *editorial* imagery (e.g. a blog hero) to its own assets; canonical cultural media is always DAM/Storage.
