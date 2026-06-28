# 03 · Supabase Schema (structured data, identity, governance)

Extends [Phase 0 `db/schema.sql`](../10-database-schema.md) — additive, not a replacement. Phase 2 adds **registry IDs, publication workflow, RBAC, audit, versioning, the graph edge table, impact & analytics**, all enforced by **Row-Level Security**. SQL below is the *design*; migrations are written after approval.

## 1. Shared types & governance columns
```sql
create type publication_state as enum ('draft','in_review','published','archived');

-- applied to every cultural & media table
alter table artworks
  add column registry_id text unique,
  add column status publication_state not null default 'draft',
  add column created_by uuid references auth.users(id),
  add column updated_by uuid references auth.users(id),
  add column search_vector tsvector,
  add column embedding vector(1536);     -- pgvector, nullable (AI-ready, doc 15)
-- (repeat for people, organizations, chapters, media, stories, …)
```

## 2. Registry IDs — permanent identifiers ([07](07-registry-and-relationships.md))
```sql
-- one sequence per object type; format PB-{TYPE}-{6+ zero-padded}
create sequence reg_artist_seq;  create sequence reg_artwork_seq;
create sequence reg_chapter_seq; create sequence reg_cert_seq;
create sequence reg_org_seq;     create sequence reg_event_seq;
create sequence reg_story_seq;   create sequence reg_media_seq;

create or replace function mint_registry_id(kind text) returns text as $$
declare n bigint;
begin
  execute format('select nextval(%L)', 'reg_'||kind||'_seq') into n;
  return 'PB-'||upper(kind)||'-'||lpad(n::text, 6, '0');
end; $$ language plpgsql;

-- assigned once on insert via trigger; immutable thereafter
create or replace function set_registry_id() returns trigger as $$
begin
  if new.registry_id is null then new.registry_id := mint_registry_id(tg_argv[0]); end if;
  return new;
end; $$ language plpgsql;
create trigger trg_reg_artwork before insert on artworks
  for each row execute function set_registry_id('artwork');

-- guard: registry_id can never change
create or replace function freeze_registry_id() returns trigger as $$
begin
  if old.registry_id is distinct from new.registry_id then
    raise exception 'registry_id is permanent and cannot change';
  end if; return new;
end; $$ language plpgsql;
```

## 3. Identity & RBAC
```sql
-- users mirror Supabase auth.users (1:1), holding profile + status
create table app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, display_name text,
  is_active boolean not null default true,
  mfa_required boolean not null default true,   -- admins require MFA (doc 14)
  created_at timestamptz default now()
);

create table roles (        id serial primary key, key text unique, name text, rank int );
create table permissions (  id serial primary key, key text unique );  -- 'artwork.update', 'certificate.issue'
create table role_permissions ( role_id int references roles(id), permission_id int references permissions(id),
                                primary key(role_id, permission_id) );
-- role assignment may be scoped to a chapter (Chapter Director sees only their chapter)
create table user_roles (
  user_id uuid references app_users(id) on delete cascade,
  role_id int references roles(id),
  chapter_id uuid references chapters(id),   -- NULL = global scope
  granted_by uuid references app_users(id), granted_at timestamptz default now(),
  primary key (user_id, role_id, chapter_id)
);

-- helper used by every RLS policy
create or replace function has_perm(perm text, target_chapter uuid default null)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from user_roles ur
    join role_permissions rp on rp.role_id = ur.role_id
    join permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and p.key = perm
      and (ur.chapter_id is null or ur.chapter_id = target_chapter)
  );
$$;
```

## 4. Row-Level Security (deny by default)
```sql
alter table artworks enable row level security;

-- public reads only published, non-archived rows
create policy artworks_public_read on artworks for select
  using (status = 'published' and archived_at is null);

-- editors with permission (chapter-scoped) read drafts too
create policy artworks_staff_read on artworks for select
  using (has_perm('artwork.read', chapter_id));

create policy artworks_write on artworks for update
  using (has_perm('artwork.update', chapter_id))
  with check (has_perm('artwork.update', chapter_id));

create policy artworks_insert on artworks for insert
  with check (has_perm('artwork.create', chapter_id));

-- NO delete policy → hard delete impossible via the API (archive only). Principle VIII.
```

## 5. Versioning + Audit (nothing is lost)
```sql
create table revisions (
  id bigserial primary key,
  entity_type text not null, entity_id uuid not null, registry_id text,
  version int not null,
  snapshot jsonb not null,              -- full row at this version
  change_summary text,
  created_by uuid references app_users(id), created_at timestamptz default now(),
  unique (entity_type, entity_id, version)
);

create table audit_logs (
  id bigserial primary key,
  actor uuid references app_users(id),
  action text not null,                 -- 'artwork.update' | 'certificate.issue' | 'login'
  entity_type text, entity_id uuid, registry_id text,
  before jsonb, after jsonb, diff jsonb,
  ip inet, user_agent text,
  created_at timestamptz default now()
) partition by range (created_at);       -- monthly partitions at scale

-- a generic trigger writes a revision + audit row on every cultural-table change
```

## 6. The graph edge table
```sql
create table entity_links (
  id bigserial primary key,
  from_type text not null, from_id uuid not null,
  relation  text not null,              -- 'depicts','about','featured_in','sponsored_by',…
  to_type   text not null, to_id   uuid not null,
  weight numeric default 1, metadata jsonb,
  created_at timestamptz default now(),
  unique (from_type, from_id, relation, to_type, to_id)
);
create index on entity_links (from_type, from_id);
create index on entity_links (to_type, to_id);
```

## 7. Impact & analytics
```sql
create table impact_metrics (             -- waste_diverted_kg, artists, artworks, reach, press
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references chapters(id),
  metric text not null, value numeric not null, unit text,
  as_of date, source text, verified boolean default false
);
create table analytics_events (           -- privacy-respecting, aggregate-first
  id bigserial primary key, event text, registry_id text, props jsonb,
  occurred_at timestamptz default now()
) partition by range (occurred_at);
```

## 8. Migration order
1. extensions (`pgcrypto`, `pgvector`) → 2. enums & shared functions → 3. registry sequences + triggers (backfill existing rows) → 4. governance columns → 5. RBAC tables + seed roles/permissions → 6. RLS policies → 7. revisions/audit triggers → 8. `entity_links` → 9. impact/analytics. All via versioned, reversible migration files ([10](10-folder-architecture.md), [13](13-testing-strategy.md)).
