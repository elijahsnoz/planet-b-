# Planet B — Phase 2 Architecture

> *Engineered like an institution, not a startup.* Build software future generations can inherit.

Planet B is becoming a **Digital Cultural Operating System (DCOS)**: a headless, API-first platform where **everything is content from the backend**, every object has a permanent identity, and every module is **modular, maintainable, scalable, and replaceable without rewriting the application**.

This folder is **design only**. Per the Phase 2 brief, nothing here is implemented until approved. It extends — and never contradicts — the [Founding Principles](../00-PRINCIPLES.md) and the Phase 0/1 foundation already in the repo.

## The deliverables (your checklist)

| # | Deliverable | Document |
|---|-------------|----------|
| 1 | Backend architecture diagram | [01-backend-architecture.md](01-backend-architecture.md) |
| 2 | Database ERD | [02-database-erd.md](02-database-erd.md) |
| 3 | Supabase schema | [03-supabase-schema.md](03-supabase-schema.md) |
| 4 | Sanity content model | [04-sanity-content-model.md](04-sanity-content-model.md) |
| 5 | Storage strategy | [05-storage-strategy.md](05-storage-strategy.md) |
| 6 | Permission matrix | [06-permission-matrix.md](06-permission-matrix.md) |
| 7 | Registry IDs + Relationship Engine | [07-registry-and-relationships.md](07-registry-and-relationships.md) |
| 8 | Admin wireframes | [08-admin-wireframes.md](08-admin-wireframes.md) |
| 9 | API specification | [09-api-specification.md](09-api-specification.md) |
| 10 | Folder architecture | [10-folder-architecture.md](10-folder-architecture.md) |
| 11 | Deployment architecture | [11-deployment-architecture.md](11-deployment-architecture.md) |
| 12 | Backup & disaster recovery | [12-backup-and-dr.md](12-backup-and-dr.md) |
| 13 | Testing strategy | [13-testing-strategy.md](13-testing-strategy.md) |
| 14 | Security review | [14-security-review.md](14-security-review.md) |
| 15 | AI & Blockchain readiness | [15-ai-and-blockchain-readiness.md](15-ai-and-blockchain-readiness.md) |

## The one rule that governs the whole platform

```
              EDITORIAL / NARRATIVE                STRUCTURED / IDENTITY
   ┌───────────────────────────────┐   ┌────────────────────────────────────┐
   │            SANITY              │   │             SUPABASE                │
   │  homepage, mission, manifesto  │   │  artists, artworks, chapters,       │
   │  nav, footer, SEO, blog, press │   │  certificates, orgs, roles, perms,  │
   │  research, stories, education  │   │  relationships, impact, users,      │
   │                                │   │  audit logs, analytics + Storage    │
   └───────────────┬───────────────┘   └─────────────────┬──────────────────┘
                   │   cross-link by Registry ID only     │
                   └──────────────────┬───────────────────┘
                                      ▼
                        REPOSITORY / SERVICE LAYER (lib)
                                      ▼
        Website · Admin · Mobile · Museum displays · Public API · AI
```

**Sanity never becomes a database. Supabase never becomes a CMS.** They are linked only by **Registry IDs** (e.g. `PB-ARTIST-000001`), so either can evolve independently.

## Scale targets the design must hold without redesign
100 countries · 500 chapters · 50,000 artists · 250,000 artworks · millions of media assets · thousands of administrators. Every decision in these docs is checked against those numbers ([13 Scalability is addressed throughout](11-deployment-architecture.md)).

## Status of the current app under this architecture
Phase 1 already isolates all data access behind `lib/data.ts` — that single seam becomes the **repository layer**. Pages do not change when the JSON source is swapped for Supabase/Sanity. That is the migration path, not a rewrite.
