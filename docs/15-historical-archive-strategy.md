# 15 · Historical Archive Strategy

The platform must still be trustworthy in 2125. That is an unusual requirement, and it drives concrete choices.

## Threats we are designing against
Link rot · format obsolescence · bit rot / loss · loss of context (who, when, why) · silent edits · single-vendor lock-in · loss of permissions/consent records · loss of attribution.

## Principles → practices
1. **Preserve originals untouched.** The repository's source files (catalogue PDF, exhibition & workshop video, original plates) are *masters*. Store them as-is, checksummed, never overwritten. Derivatives (web-optimized images, transcoded video, captions) are generated and regenerable.
2. **Open, durable formats.** Images → keep original + serve AVIF/WebP; video → keep master + serve H.264/AV1 with **WebVTT captions + text transcripts**; documents → PDF/A for archival, plus extracted text. Text/data in UTF-8.
3. **Integrity by checksum.** Every `media` row stores a content hash; periodic fixity checks detect bit rot.
4. **Provenance & context travel with the asset.** Every asset carries `source`, `credit`, `license`, `alt`, `caption` (mandatory). We record *where each thing came from* (catalogue / Edge Media / NTA / Benjamin Oladapo).
5. **Stable, citable identifiers.** Slugs and public IDs never change; soft-delete only; redirects on any rename. Aim for citation-grade permalinks (consider DOIs for the chapter record and catalogue later).
6. **No silent history.** CMS versioning on; the archive can show how its own records changed.
7. **Vendor independence.** Periodic full export (DB dump + media manifest + flat JSON of all records) to cold storage; the archive must be reconstructable without Supabase or Sanity specifically.
8. **Consent is part of the record.** `consent_status` and license per person/asset are preserved, not just enforced — future curators must know what was permitted.

## The Genesis Chapter is never "old content"
Abuja 2026 is the cornerstone, always present-tense and prominently linked. New chapters are added as peers; the genesis record is contextualized, re-surfaced, and protected — never demoted to an "archive" tab.

## Backup & continuity
3-2-1 backups (3 copies, 2 media, 1 offsite/cold) of masters + database. A documented, tested restore procedure. A plain-language "how this archive is structured" document kept *inside* the archive for future stewards.

## Capturing what's missing now
Some context lives only in the videos and in people's memories. Plan an oral-history/interview pass (the brief lists interviews and quotes per profile) to capture it *while the founders are reachable* — this is the most perishable material of all.
