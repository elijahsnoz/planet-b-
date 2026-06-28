# Planet B — Archive

This directory is the **preservation layer** of Planet B. It holds the original source materials of the Genesis Chapter and the structured record of what they are.

> Governing principle (see [docs/00-PRINCIPLES.md](../docs/00-PRINCIPLES.md)): **preserve legacy first, implement technology second.** When uncertain, choose the option that best preserves history.

## Structure
```
archive/
  README.md            ← you are here
  manifest.json        ← every master: path, sha256, bytes, identity, license, provenance
  source/              ← ORIGINAL MASTERS — immutable, never edit/rename/overwrite
    catalogue/         ← the 55-page exhibition catalogue (PDF) — the textual DNA
    exhibition-video/  ← exhibition documentation
    upcycle-workshop/  ← 5-day masterclass footage (~372 MB)
    plates/            ← 18 catalogue spreads & key art (14 artist spreads + dividers/key art)
    press/             ← press URLs
  derivatives/         ← (created later) web images, transcoded video, captions — REGENERABLE
```

## Rules for masters (`source/`)
1. **Immutable.** Never edit, rename, crop, or re-compress a master. Keep original filenames (even ugly UUIDs) — they are part of provenance.
2. **Checksummed.** Every file's `sha256` is recorded in `manifest.json`. Run a fixity check periodically:
   ```sh
   # from repo root — recompute and compare against the manifest
   python3 - <<'PY'
   import json,hashlib,sys
   m=json.load(open('archive/manifest.json')); bad=0
   for it in m['items']:
       p=it['path']; h=hashlib.sha256(open(p,'rb').read()).hexdigest()
       ok = h==it['sha256']; bad += not ok
       print(('OK ' if ok else 'FAIL ')+p)
   sys.exit(1 if bad else 0)
   PY
   ```
3. **Derivatives are separate.** Anything optimized for the web goes in `derivatives/` and can always be regenerated from a master.

## Identification status
- **14 of 15 founding artists** are confirmed by catalogue plate (mapped in `manifest.json` → `depicts.person`/`depicts.artwork`).
- The **15th founding artist is intentionally left incomplete** until verified from official documentation. See `pending_records` in the manifest. *Accuracy over completeness.*

## Outstanding preservation tasks (tracked, not yet done)
- Generate WebVTT captions + text transcripts for both videos.
- Create web proxies/transcodes (AV1/H.264) for the 372 MB workshop master.
- Snapshot the three press URLs to guard against link rot.
- Confirm media credits/licenses (Edge Media / NTA / Benjamin Oladapo) and record per item.
- Capture oral histories from founders while reachable (most perishable material).
