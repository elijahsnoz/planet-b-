# Planet B

**The permanent digital institution for the global movement that uses art to protect the only planet we have.**

*Because There Is No Planet B.* Planet B is humanity's **Plan B** — a plan to keep the first Earth, not a second one. This platform is where that plan is remembered, proven, and continued.

---

## The opportunity

Cultural and environmental movements produce something rare and valuable — and they almost always lose it. A landmark exhibition happens, the press cycle ends, and what remains is a folder of files on someone's hard drive. The artists scatter, the provenance blurs, the partners move on. The legacy evaporates.

Planet B solves this by being the **institution that outlives the event** — a living, citable, century-scale archive that confers permanent identity and verifiable provenance to the people, artworks, and partners of a movement.

It begins with the **Genesis Chapter**: the inaugural Abuja chapter, launched on World Environment Day with **15 founding artists**, the Royal Norwegian Embassy as a sovereign partner, and **Nike Art Gallery** — a Nigerian institution nurturing talent since 1983 — as host. A complete, documented act of cultural and environmental meaning. Planet B turns that from a one-time event into the cornerstone of something museums reference, embassies share, researchers cite, and future chapters inherit.

## What Planet B is — and is not

| Planet B **is** | Planet B is **not** |
|---|---|
| A digital cultural institution & permanent archive | An exhibition microsite that dies when the show closes |
| A registry of people, artworks, and chapters | A portfolio template or gallery of thumbnails |
| Infrastructure that confers identity & provenance | An NFT marketplace |
| A network designed to hold 100 chapters over 100 years | A single-campaign website |

## Why it's defensible

- **Owns the canonical record.** The first credible archive of a movement becomes *the* reference. Museums, embassies, universities, and journalists link to the source of truth — and that authority compounds over time.
- **Network effects across chapters.** Each new city chapter joins one shared institution rather than starting from zero. The model is replicable; the archive is singular.
- **Verifiable credentials, inclusion-first.** Every verified contributor receives a **certificate of contribution** — designed from day one to become a cryptographically verifiable, non-transferable credential (blockchain-ready) **without requiring any wallet, fee, or crypto knowledge today**. Provenance you can trust; access anyone can use.
- **Built for permanence.** Soft-delete only (nothing is ever destroyed), immutable source masters with SHA-256 provenance, and a portable data backbone. The asset is the trustworthy record itself.

## Market & audiences

In priority order, Planet B serves:

1. **The public & future generations** — the emotional front door; people must *feel* the movement before they read about it.
2. **Artists** — founders documented as museum subjects, and future applicants who aspire to join.
3. **Researchers, educators, students** — who need trustworthy, structured, citable records.
4. **Institutional partners** — embassies, foundations, galleries, sponsors, governments who want something they're proud to share.
5. **Chapter organizers** — who replicate the model in new cities and plug into the network.

## Traction & roadmap

The platform ships in phases, each delivering something real, so the Genesis Chapter is preserved and shareable early while the institution grows around it.

- **Phase 1 — Archive Core (current):** the Abuja chapter fully modeled and navigable — artists, artworks, partners, people, timeline, press — plus a permission-controlled admin console for curation. *A partner or embassy can already proudly share a complete archive.*
- **Phase 2 — The Experience:** cinematic, museum-grade storytelling (the breathing eye, the waste→art scroll) at 60fps; documentary and video library.
- **Phase 3 — Identity & Trust:** certificate issuance with permalinks, QR, and off-chain hash verification; every founder gets a permanent, verifiable Planet B identity.
- **Phase 4 — Knowledge & Reach:** journal, learning hub, impact dashboard, and internationalization (English, Norwegian, Nigerian languages).
- **Phase 5 — Network & Chain:** chapter-network onboarding and Soulbound, independently verifiable certificate provenance.

> One open historical detail — the identity of the **15th founding artist** — is intentionally left blank until verified from official documentation. *A truthful gap is worth more than a confident error.* This is the standard the whole archive is held to.

## How it's built

A pragmatic, modern, low-cost stack chosen for longevity and portability — not trend-chasing.

- **Next.js 14 (App Router) + React 18 + TypeScript** — fast on a phone in Abuja, server-rendered, SEO-ready.
- **Drizzle ORM** over **SQLite** today (the entire archive is one portable file), architected to move to **Postgres/Supabase** for identity and certificates without rewriting the pages.
- **Framer Motion** for museum-grade, reduced-motion-aware experience.
- **RBAC admin console** — every write is permission-checked, audit-logged, and snapshotted as a revision; **nothing is ever hard-deleted** (archive + restore only).
- **Blockchain anticipated, not required** — identity and certificate models are designed to be cryptographically verifiable later (Soulbound, non-transferable) with zero crypto dependency now.

---

## For engineers

> **Read [docs/00-PRINCIPLES.md](docs/00-PRINCIPLES.md) first.** It is the constitution and overrides everything else. The `docs/` folder holds the product vision, manifesto, and 16 founding strategy documents.

### Run it
```sh
npm install
npm run db:reset   # create db/planet-b.db, run migrations, seed the Genesis archive
npm run dev        # http://localhost:3000
npm run build      # production build
```

### Admin console
Sign in at **/admin** (→ /admin/login).
- Default super-admin: `victoreni14@gmail.com` / `planetb-admin` — **change after first login**
  (override at seed time with `PLANET_B_ADMIN_EMAIL` / `PLANET_B_ADMIN_PASSWORD`).
- Set `PLANET_B_SESSION_SECRET` in production (a long random string).

Modules: Dashboard · Genesis Chapter (sacred, read-only) · Artists · Artworks (create/edit/archive/restore + version history) · Organizations · Media · Certificates · System Logs. Every write is permission-checked (RBAC), audit-logged, and snapshotted as a revision.

### Database (SQLite via Drizzle)
```sh
npm run db:generate   # generate SQL migrations from db/schema.ts
npm run db:migrate    # apply migrations
npm run db:seed       # seed from data/genesis/*.json
npm run db:reset      # wipe + migrate + seed
```
The whole archive is one portable file: `db/planet-b.db`.

### Repository layout
```
app/            Next.js 14 App Router pages (Home, Genesis Chapter, Artists, Artworks, Admin, …)
components/     Reusable building blocks (PlanetBMark/Eye-World logo, RegistryGrid, ExhibitLayout, …)
lib/            data.ts — typed accessors over the seed JSON (the only data-aware module)
models/         Framework-agnostic domain types (mirror the schema)
tokens/         Design + motion tokens (JSON + CSS variables) — the design system's source of truth
data/genesis/   Normalized, referentially-validated Genesis Chapter records (the seed)
archive/        Preserved source masters (immutable) + manifest.json (sha256 provenance)
db/             schema.sql — Postgres/Supabase backbone
sanity/         CMS schema groundwork (curatorial layer)
docs/           00 Principles + 16 founding strategy documents
public/media/   Web image derivatives generated from the masters (regenerable)
```

### Status
**Phase 1 vertical slice.** Pages read the local seed JSON via `lib/data.ts`. Supabase (identity/certificates) and Sanity (curation) are designed and stubbed; they replace the JSON source behind `lib/data.ts` without touching pages. Blockchain is **designed, not implemented** (Soulbound, later).
