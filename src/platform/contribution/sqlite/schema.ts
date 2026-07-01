/**
 * The Garden's local SQLite schema — a faithful mirror of the Supabase Postgres
 * foundation (soft-delete only, immutable events, lineage), minus Postgres-only
 * features (pgvector, tsvector) not needed to prove the write path. Kept
 * invariant-clean: no popularity columns, no `on delete cascade`.
 *
 * Exported as a string so both the connection (which applies it) and the
 * constitution guard (which scans it) read one source of truth.
 */
export const GARDEN_SQLITE_SCHEMA = `
create table if not exists visitors (
  id                   text primary key,
  anon_token_hash      text unique not null,
  person_id            text,
  locale               text,
  region               text,
  first_contributed_at text,
  last_seen_at         text not null,
  created_at           text not null,
  updated_at           text not null,
  deleted_at           text
);

create table if not exists contributions (
  id                text primary key,
  type              text not null,
  status            text not null default 'living',
  author_visitor_id text not null,
  content           text not null,
  text_projection   text,
  lang              text,
  region            text,
  parent_id         text,
  root_id           text,
  depth             integer not null default 0,
  version           integer not null default 1,
  created_at        text not null,
  updated_at        text not null,
  deleted_at        text
);
create index if not exists contributions_created_idx on contributions (created_at desc);
create index if not exists contributions_root_idx    on contributions (root_id);

create table if not exists domain_events (
  id              text primary key,
  type            text not null,
  aggregate_type  text not null,
  aggregate_id    text,
  payload         text not null,
  payload_version integer not null default 1,
  idempotency_key text unique,
  occurred_at     text not null
);

create table if not exists event_dispatch (
  event_id     text primary key references domain_events(id),
  status       text not null default 'pending',
  attempts     integer not null default 0,
  last_error   text,
  dispatched_at text,
  updated_at   text not null
);
`;
