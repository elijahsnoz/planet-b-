# Planet B

The living archive of the movement **Because There Is No Planet B** — art that inspires environmental action. *Planet B is humanity's **Plan B** for protecting the only planet we have — not a second Earth.*

> **Read [docs/00-PRINCIPLES.md](docs/00-PRINCIPLES.md) first.** It is the constitution and overrides everything else.

## Run it
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

Modules: Dashboard · Genesis Chapter (sacred, read-only) · Artists · Artworks (create/edit/archive/restore + version history) · Media · Certificates · System Logs. Every write is permission-checked (RBAC), audit-logged, and snapshotted as a revision. **Nothing is ever hard-deleted** — archive + restore only.

### Database (SQLite via Drizzle)
```sh
npm run db:generate   # generate SQL migrations from db/schema.ts
npm run db:migrate    # apply migrations
npm run db:seed       # seed from data/genesis/*.json
npm run db:reset      # wipe + migrate + seed
```
The whole archive is one portable file: `db/planet-b.db`.

## What's here
```
app/            Next.js 14 App Router pages (Home, Genesis Chapter, Artists, Artworks, …)
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

## Status
**Phase 1 vertical slice.** Pages read the local seed JSON via `lib/data.ts`. Supabase (identity/certificates) and Sanity (curation) are designed and stubbed; they replace the JSON source behind `lib/data.ts` without touching pages. Blockchain is **designed, not implemented** (Soulbound, later).

The **15th founding artist is intentionally unnamed** until verified from official documentation (Principle VI: accuracy over completeness).
