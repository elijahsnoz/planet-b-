-- ═══════════════════════════════════════════════════════════════════════════
-- Planet B · The Garden — Contribution system foundation (PR1)
--
-- Ritual-agnostic: this schema speaks only "contribution". Presentation names
-- (Seed / Sow / Plant / Entrust) never appear here and never will.
--
-- Built for 50M+ contributions over a decade:
--   • vocabularies are DATA (reference tables), never Postgres enums
--   • heterogeneous payloads via a validated content jsonb beside a relational core
--   • an immutable, append-only domain-event log written as a transactional outbox
--   • UUIDv7 primary keys (app-supplied) for index locality at scale
--   • partition-READY (created_at present); range-partition by month is a later,
--     non-breaking migration once volume warrants — not premature complexity now
--   • soft deletes only; the archive never destroys
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;  -- gen_random_uuid() fallback
create extension if not exists vector;    -- pgvector: semantic resonance / echoes

-- ── Vocabularies as DATA, not schema (extensible without migration) ──────────
create table contribution_types (
  key            text primary key,             -- 'dream','question','sketch','memory',...
  label          text not null,
  content_schema jsonb not null default '{}',  -- JSON Schema validating this type's content
  active         boolean not null default true,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);
comment on table contribution_types is
  'A contribution form is one row. New forms never require a migration (50M/decade test).';

create table contribution_statuses (
  key       text primary key,                  -- 'living','held','withdrawn','transformed'
  label     text not null,
  is_public boolean not null default false      -- may the garden surface it?
);

-- ── Visitors: anonymous-first authorship. Identity follows contribution. ─────
create table visitors (
  id                   uuid primary key default gen_random_uuid(), -- app supplies UUIDv7
  anon_token_hash      text unique not null,   -- hash of the durable cookie; never the raw token
  person_id            uuid,                    -- Passport/Person bridge; NULL until claimed
  locale               text,
  region               text,                    -- coarse (country); no precise geolocation
  first_contributed_at timestamptz,
  last_seen_at         timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz              -- soft delete; nothing is destroyed
);
comment on column visitors.person_id is
  'Identity follows contribution: NULL by default; set only when a visitor later claims a Passport.';

-- ── Contributions: the aggregate (Contribution is the domain; type is data) ──
create table contributions (
  id                uuid primary key default gen_random_uuid(), -- app supplies UUIDv7
  type              text not null references contribution_types(key),
  status            text not null default 'living' references contribution_statuses(key),
  author_visitor_id uuid not null references visitors(id),
  content           jsonb not null,             -- type-specific payload (dream => {"text": "..."})
  text_projection   text,                        -- canonical searchable text derived from content
  lang              text,
  region            text,
  parent_id         uuid references contributions(id),  -- continuation: a stranger tends a dream
  root_id           uuid,                        -- denormalised lineage root (fast tree reads)
  depth             int not null default 0,
  search_vector     tsvector,
  embedding         vector(1536),                -- async, model-dependent dimension; nullable
  version           int not null default 1,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  constraint contributions_no_self_parent check (parent_id is null or parent_id <> id),
  constraint contributions_content_object check (jsonb_typeof(content) = 'object')
);
comment on table contributions is
  'Partition-READY by created_at (monthly). UUIDv7 + created_at make partitioning a later, '
  'non-breaking migration (~10M rows) rather than complexity paid on an empty table.';

create index contributions_created_idx   on contributions (created_at desc);
create index contributions_root_idx      on contributions (root_id);
create index contributions_parent_idx    on contributions (parent_id);
create index contributions_type_idx      on contributions (type);
create index contributions_author_idx    on contributions (author_visitor_id);
create index contributions_region_idx    on contributions (region);
create index contributions_live_idx      on contributions (status) where deleted_at is null;
create index contributions_search_idx    on contributions using gin (search_vector);
create index contributions_embedding_idx on contributions using hnsw (embedding vector_cosine_ops);

-- ── Immutable domain-event log (transactional outbox) ────────────────────────
create table domain_events (
  id              uuid primary key default gen_random_uuid(),
  type            text not null,                -- 'ContributionCreated','EchoDiscovered',...
  aggregate_type  text not null,                -- 'contribution','visitor','passport','garden'
  aggregate_id    uuid,
  payload         jsonb not null,
  payload_version int not null default 1,
  idempotency_key text,
  occurred_at     timestamptz not null default now()
  -- NO updated_at / deleted_at: append-only and immutable, by design.
);
create index domain_events_aggregate_idx on domain_events (aggregate_type, aggregate_id);
create index domain_events_type_idx      on domain_events (type);
create index domain_events_time_idx      on domain_events (occurred_at);
create unique index domain_events_idem_idx on domain_events (idempotency_key)
  where idempotency_key is not null;
comment on table domain_events is
  'Append-only. Written in the SAME transaction as the state change (outbox): no lost events, '
  'no dual-write races. Dispatch state lives elsewhere so events are never mutated.';

-- Dispatch tracking kept OUT of the event log so events remain immutable.
create table event_dispatch (
  event_id      uuid primary key references domain_events(id),
  status        text not null default 'pending',  -- pending|dispatched|failed
  attempts      int not null default 0,
  last_error    text,
  dispatched_at timestamptz,
  updated_at    timestamptz not null default now()
);
create index event_dispatch_pending_idx on event_dispatch (status) where status <> 'dispatched';

-- ── Vocabularies · V1 ships exactly ONE contribution type: dream ─────────────
insert into contribution_statuses (key, label, is_public) values
  ('living',      'Living',            true),
  ('held',        'Held for review',   false),
  ('withdrawn',   'Withdrawn',         false),
  ('transformed', 'Transformed',       true);

insert into contribution_types (key, label, content_schema, sort_order) values
  ('dream', 'Dream',
   '{"type":"object","required":["text"],"additionalProperties":false,'
   '"properties":{"text":{"type":"string","minLength":1,"maxLength":240}}}'::jsonb,
   10);

-- ── Row-Level Security ───────────────────────────────────────────────────────
-- The public may READ the living garden — nothing more. Writes are brokered by an
-- edge function running as the service role, which enforces rate limits and a
-- safety pre-screen. The service role bypasses RLS; tables with RLS enabled and no
-- policy are therefore default-deny to the anon/authenticated roles.
alter table contributions       enable row level security;
alter table visitors            enable row level security;
alter table domain_events       enable row level security;
alter table event_dispatch      enable row level security;
alter table contribution_types  enable row level security;
alter table contribution_statuses enable row level security;

create policy contributions_public_read on contributions
  for select using (deleted_at is null and status in ('living', 'transformed'));

create policy contribution_types_public_read on contribution_types
  for select using (active);
create policy contribution_statuses_public_read on contribution_statuses
  for select using (true);
