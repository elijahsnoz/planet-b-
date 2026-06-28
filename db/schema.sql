-- Planet B — relational schema (PostgreSQL / Supabase)
-- Implements docs/10-database-schema.md and encodes docs/00-PRINCIPLES.md.
-- Phase 0 artifact: the backbone of the permanent archive. Run on a fresh database.
--
-- Principles encoded:
--   II  Genesis is sacred  -> chapters.is_genesis + immutable; soft-delete only; delete-guard trigger.
--   III Contribution       -> certificates per contribution role (person OR org).
--   IV  No one invisible    -> people.consent_status gates publication.
--   V   Founding Council    -> founding_council (historical record, expandable).
--   VI  Accuracy            -> `verified` flags + explicit reserved/pending certificate rows.
--   VII Blockchain-ready    -> certificates.verification_hash now, soulbound_ref nullable for later.

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ── enums ────────────────────────────────────────────────────────────────────
create type chapter_status     as enum ('genesis','active','planned');
create type consent_status     as enum ('granted','pending','withheld');
create type organization_type  as enum ('embassy','gallery','foundation','ngo','company','govt','media');
create type partner_role       as enum ('sponsor','host','media','partner','community-partner','publisher','affiliated');
create type media_kind         as enum ('image','video','audio','pdf','doc');
create type council_category   as enum ('founding_artist','gallery_leadership','embassy_representative','organizer','curator','key_collaborator');
create type certificate_status as enum ('draft','issued','revoked','reserved');

-- ── helper: updated_at trigger ───────────────────────────────────────────────
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- ── media ────────────────────────────────────────────────────────────────────
create table media (
  id            text primary key,                 -- stable slug-id, e.g. 'plate.snoz.primary'
  kind          media_kind not null,
  storage_key   text not null,
  sha256        text,
  bytes         bigint,
  mime          text,
  width         int, height int, duration_s numeric,
  alt_text      text,                             -- required before publish (enforced in app/CMS)
  caption       text,
  credit        text,                             -- e.g. 'Photo: Benjamin Oladapo'
  source        text,                             -- 'catalogue' | 'Edge Media' | 'NTA' | ...
  license       text,
  captions_vtt_key text,
  is_master     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  archived_at   timestamptz
);

-- ── chapters ─────────────────────────────────────────────────────────────────
create table chapters (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  city          text not null,
  country       text not null,
  status        chapter_status not null default 'planned',
  is_genesis    boolean not null default false,
  immutable     boolean not null default false,   -- Principle II
  movement      text not null default 'Because There Is No Planet B',
  theme         text,
  event_name    text,
  opened_on     date,
  venue         text,
  summary       text,
  yoruba_proverbs jsonb,
  hero_media    text references media(id),
  verified      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  archived_at   timestamptz
);
-- at most one Genesis Chapter, ever (Principle II)
create unique index only_one_genesis on chapters ((is_genesis)) where is_genesis;
create trigger trg_chapters_updated before update on chapters for each row execute function set_updated_at();

-- Principle II: forbid deleting the Genesis Chapter (and discourage hard-delete generally).
create or replace function guard_genesis_delete() returns trigger as $$
begin
  if old.is_genesis then
    raise exception 'The Genesis Chapter is immutable and cannot be deleted (Principle II). Use archived_at if ever needed.';
  end if;
  return old;
end; $$ language plpgsql;
create trigger trg_guard_genesis before delete on chapters for each row execute function guard_genesis_delete();

-- ── organizations ────────────────────────────────────────────────────────────
create table organizations (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  type          organization_type not null,
  role          text,
  about         text,
  website       text,
  logo_media    text references media(id),
  established   text,
  verified      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  archived_at   timestamptz
);
create trigger trg_orgs_updated before update on organizations for each row execute function set_updated_at();

create table chapter_partners (
  chapter_id    uuid not null references chapters(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  partner_role  partner_role not null,
  sort_order    int default 0,
  primary key (chapter_id, organization_id, partner_role)
);

-- ── people (profiles) ────────────────────────────────────────────────────────
create table people (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  full_name     text not null,
  display_name  text,
  honorific     text,
  primary_role  text,
  roles         text[] not null default '{}',     -- open-ended: profiles evolve without migration
  short_bio     text,
  bio           text,
  portrait_media text references media(id),
  consent_status consent_status not null default 'pending',  -- Principle IV
  contact_public boolean not null default false,  -- PII (e.g. phone) hidden unless consented
  socials       jsonb,
  quotes        text[],
  evolves       boolean not null default false,
  note          text,
  verified      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  archived_at   timestamptz
);
create trigger trg_people_updated before update on people for each row execute function set_updated_at();

-- a person holds many roles across many chapters
create table roles ( id serial primary key, name text unique not null );
create table person_chapter_roles (
  id            uuid primary key default gen_random_uuid(),
  person_id     uuid not null references people(id) on delete cascade,
  chapter_id    uuid not null references chapters(id) on delete cascade,
  role_id       int  not null references roles(id),
  title_override text,
  sort_order    int default 0,
  unique (person_id, chapter_id, role_id)
);
create table person_organizations (
  person_id       uuid not null references people(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  title           text,
  primary key (person_id, organization_id)
);

-- ── artworks ─────────────────────────────────────────────────────────────────
create table artworks (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  title_variant text,
  artist_id     uuid not null references people(id),
  chapter_id    uuid references chapters(id),
  medium        text default 'Discarded items assemblage',
  dimensions    text default '61cm x 61cm',
  year          int  default 2026,
  statement     text,
  significance  text,
  primary_media text references media(id),
  exhibitor_role text default 'artist',            -- 'artist' | 'facilitator'
  verified      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  archived_at   timestamptz
);
create trigger trg_artworks_updated before update on artworks for each row execute function set_updated_at();

create table materials ( id serial primary key, name text unique not null );
create table artwork_materials (
  artwork_id  uuid not null references artworks(id) on delete cascade,
  material_id int  not null references materials(id),
  primary key (artwork_id, material_id)
);
create table artwork_media (
  artwork_id uuid not null references artworks(id) on delete cascade,
  media_id   text not null references media(id),
  kind       text default 'plate',                 -- 'plate' | 'detail'
  sort_order int default 0,
  primary key (artwork_id, media_id)
);

-- ── timeline ─────────────────────────────────────────────────────────────────
create table timeline_events (
  id          uuid primary key default gen_random_uuid(),
  chapter_id  uuid not null references chapters(id) on delete cascade,
  sort_order  int not null,
  phase       text not null,
  title       text not null,
  event_date  date,                                 -- null = unspecified in source (never guessed)
  description text,
  hero_media  text references media(id),
  verified    boolean not null default false,
  note        text,
  unique (chapter_id, sort_order)
);
create table event_media (
  event_id uuid not null references timeline_events(id) on delete cascade,
  media_id text not null references media(id),
  sort_order int default 0,
  primary key (event_id, media_id)
);
create table event_people (
  event_id  uuid not null references timeline_events(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  role_note text,
  primary key (event_id, person_id)
);

-- ── panel & performance ──────────────────────────────────────────────────────
create table panels (
  id           uuid primary key default gen_random_uuid(),
  chapter_id   uuid not null references chapters(id) on delete cascade,
  title        text not null,
  moderator_id uuid references people(id),
  description  text
);
create table panel_speakers (
  panel_id  uuid not null references panels(id) on delete cascade,
  person_id uuid not null references people(id),
  sort_order int default 0,
  primary key (panel_id, person_id)
);
create table performances (
  id           uuid primary key default gen_random_uuid(),
  chapter_id   uuid not null references chapters(id) on delete cascade,
  title        text not null,
  yoruba_title text,
  translation  text,
  type         text,
  subtitle     text,
  description  text,
  lead_id      uuid references people(id),
  curator_id   uuid references people(id),
  photo_credit_id uuid references people(id),
  performance_date date,
  venue        text
);
create table performance_performers (
  performance_id uuid not null references performances(id) on delete cascade,
  person_id      uuid not null references people(id),
  billing        text default 'co_performer',       -- 'lead' | 'co_performer'
  primary key (performance_id, person_id)
);

-- ── press ────────────────────────────────────────────────────────────────────
create table press (
  id           uuid primary key default gen_random_uuid(),
  chapter_id   uuid references chapters(id) on delete cascade,
  outlet       text not null,
  title        text,
  url          text not null,
  topic        text,
  published_on date,
  excerpt      text,
  snapshot_media text references media(id),          -- guard against link rot
  verified     boolean not null default false
);

-- ── founding council (Principle V — historical record) ───────────────────────
create table founding_council (
  id               uuid primary key default gen_random_uuid(),
  person_id        uuid not null references people(id),
  chapter_id       uuid not null references chapters(id),
  council_category council_category not null,
  citation         text,
  inducted_on      date,
  is_charter_member boolean not null default false,
  sort_order       int default 0,
  notes            text,
  unique (person_id, chapter_id, council_category)
);

-- ── certificates (Principle III + VII) ───────────────────────────────────────
create table certificates (
  id                uuid primary key default gen_random_uuid(),
  public_id         text unique not null,           -- 'PB-ABJ-2026-001' — stable forever
  person_id         uuid references people(id),
  organization_id   uuid references organizations(id),
  chapter_id        uuid not null references chapters(id),
  role_at_issue     text not null,                  -- contribution, not attendance
  artwork_id        uuid references artworks(id),
  issued_on         date,
  status            certificate_status not null default 'draft',
  verification_hash text,                           -- off-chain verification (now)
  soulbound_ref     text,                           -- on-chain SBT (later; null by design)
  pdf_media         text references media(id),
  permalink         text,
  note              text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- a certificate honors exactly one subject: a person, an organization,
  -- or a reserved (yet-unknown) slot — never zero except when reserved.
  constraint subject_present check (
    person_id is not null or organization_id is not null or status = 'reserved'
  )
);
create trigger trg_certs_updated before update on certificates for each row execute function set_updated_at();

-- ── impact metrics (architected, light now) ──────────────────────────────────
create table impact_metrics (
  id          uuid primary key default gen_random_uuid(),
  chapter_id  uuid not null references chapters(id) on delete cascade,
  metric      text not null,
  value       numeric not null,
  unit        text,
  as_of       date,
  source      text,
  verified    boolean not null default false
);

-- ── helpful indexes ──────────────────────────────────────────────────────────
create index idx_artworks_artist on artworks(artist_id);
create index idx_artworks_chapter on artworks(chapter_id);
create index idx_pcr_person on person_chapter_roles(person_id);
create index idx_pcr_chapter on person_chapter_roles(chapter_id);
create index idx_council_chapter on founding_council(chapter_id);
create index idx_certs_chapter on certificates(chapter_id);
create index idx_people_consent on people(consent_status);
