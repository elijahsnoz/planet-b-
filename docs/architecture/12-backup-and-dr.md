# 12 · Backup & Disaster Recovery

Planet B is a **permanent archive**; data loss is the one unacceptable failure. Strategy follows **3-2-1** (3 copies, 2 media/locations, 1 offline/immutable) across all three stores, with tested recovery.

## What must survive, and its target
| Asset | RPO (max data loss) | RTO (max downtime) | Tier |
|-------|---------------------|--------------------|------|
| Postgres (entities, certs, audit) | ≤ 5 min | ≤ 1 hour | critical |
| Storage masters (originals) | 0 (immutable, replicated) | ≤ 4 hours | critical |
| Storage derivatives | n/a (regenerable) | regenerate on demand | low |
| Sanity editorial dataset | ≤ 24 h | ≤ 4 hours | high |
| Certificates (PDF + hash) | 0 | ≤ 1 hour | critical |

## Backups
**Postgres**
- **PITR** (continuous WAL) on Supabase → restore to any point within retention.
- **Nightly logical dump** (`pg_dump`, schema + data) → encrypted, copied to **independent cold storage** (e.g. S3 + Glacier / different cloud) with **object-lock / immutability** so backups can't be altered or ransomed.
- Weekly **full export bundle** (DB dump + flat JSON of all entities + manifest) — vendor-independent, restorable without Supabase specifically ([archive strategy](../15-historical-archive-strategy.md)).

**Storage**
- `masters` & `certificates` buckets: **versioning + cross-region replication + lifecycle never-expire**.
- Per-master `sha256` in the `media` table; scheduled **fixity checks** detect silent corruption; corrupt object restored from replica/backup.

**Sanity**
- Scheduled **dataset export** (`sanity dataset export`) to cold storage; documents are versioned in-platform too.

**Code & config**
- Git (multiple remotes/mirror). Migrations are the schema's source of truth → DB structure is reproducible from repo.

## Restore procedures (documented runbooks, not tribal knowledge)
1. **Accidental edit / bad publish** → restore the row from `revisions` (in-app, seconds) — most common case, no ops needed.
2. **Accidental archive** → `:restore` action (nothing is hard-deleted anyway).
3. **Table/data corruption** → PITR to just before the event on a clone; verify; cut over.
4. **Full Postgres loss** → provision new project → restore latest dump + replay WAL → re-point env → smoke tests.
5. **Storage object loss** → fetch from replica; if both gone, regenerate derivatives from master; masters protected by immutability.
6. **Sanity loss** → import last dataset export.
7. **Vendor outage (Supabase/Vercel/Sanity)** → static public site stays served from CDN (ISR cache) in read-only; admin/writes paused; restore when vendor recovers; for prolonged outage, rebuild on the vendor-independent export bundle.

## DR drills (the part most orgs skip)
- **Quarterly restore drill**: restore the nightly dump into a scratch project, run integrity + referential checks ([13](13-testing-strategy.md)), confirm RTO. A backup is not real until a restore is proven.
- **Annual game-day**: simulate a region/vendor loss end-to-end; update runbooks from findings.
- Drill results logged; failures are P1.

## Integrity & legal
- Backups **encrypted at rest + in transit**; access audited; least-privilege keys.
- Immutable/object-locked copies guard against ransomware and insider error.
- Retention honors preservation intent (permanent) and any partner/embassy data agreements; consent and license metadata travel with every backup.
