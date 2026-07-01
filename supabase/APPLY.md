# Provisioning The Garden on Supabase (~10 minutes)

The Garden's code is complete and proven end-to-end (see `scripts/garden-proof.mjs`
and the SQLite demonstration). To run it on the production-grade stack, do the five
steps below. The composition root switches to Supabase automatically the moment the
env vars are present — **no code changes**.

## 1 · Create the project
supabase.com → **New project**. Pick a region near your first audience. Save the DB
password somewhere safe.

## 2 · Enable the extensions
Database → **Extensions** → enable **`vector`** (pgvector) and **`pgcrypto`**.
(The migrations also `create extension … if not exists`, so this is belt-and-braces.)

## 3 · Apply the migrations — SQL editor, in order
1. Open `supabase/migrations/0001_contribution_foundation.sql`, paste into the SQL
   editor, **Run**.
2. Open `supabase/migrations/0002_contribution_write.sql`, paste, **Run**.

## 4 · Get the two secrets
Project Settings → **API**:
- **Project URL** → `SUPABASE_URL`
- **`service_role` key** (secret) → `SUPABASE_SERVICE_ROLE_KEY`

Put them in `.env.local` (gitignored). **Never commit the service_role key** — it is
the master key to your database. Rotate it if it is ever exposed.

## 5 · Run — and prove it, identically
```
PLANET_B_GARDEN=1 \
SUPABASE_URL=…            \
SUPABASE_SERVICE_ROLE_KEY=… \
npm run build && npm run start
```
Then, in another terminal:
```
npm run garden:proof
```
It exercises the exact same flow you saw on SQLite: an anonymous visitor leaves a
contribution → 201 → permanent UUIDv7 URL → survives refresh → same identity across
visits. Finally, run the atomicity SQL it prints, in the Supabase SQL editor, to
confirm `contributions == domain_events == event_dispatch` and that no visitor has a
`person_id` yet (identity follows contribution).

A green run here is the production-grade proof — and, crucially, it required **zero
changes to the domain or the application**. That is the architecture holding.

## Troubleshooting
- **"Could not find the function public.garden_create_contribution in the schema
  cache."** PostgREST caches the schema; after applying `0002` it usually reloads
  within seconds. If you're quick, wait ~30s and retry, or Settings → API →
  **Reload schema**.
- **"permission denied for function garden_create_contribution."** Re-run the two
  `grant execute … to service_role;` lines at the end of `0002` (already included).
- **First run creates the visitor but no contribution?** Confirm `vector` and
  `pgcrypto` extensions are enabled (step 2) — `0001` needs them.
