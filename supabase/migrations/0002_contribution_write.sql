-- ═══════════════════════════════════════════════════════════════════════════
-- Planet B · The Garden — contribution write path (PR3)
--
-- Atomic create: a contribution and its ContributionCreated event are written in
-- ONE transaction (the transactional-outbox invariant). A plpgsql function runs in
-- a single implicit transaction, so either both rows land or neither does — an
-- event can never be lost, and a contribution can never exist without its event.
--
-- The write is brokered by the service role (server action / edge function), which
-- enforces validation, rate limits, and a safety pre-screen above this function.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function garden_create_contribution(
  p_id            uuid,
  p_type          text,
  p_author        uuid,
  p_content       jsonb,
  p_text          text,
  p_lang          text,
  p_region        text,
  p_parent        uuid,
  p_root          uuid,
  p_depth         int,
  p_event_type    text,
  p_event_payload jsonb,
  p_event_idem    text
) returns contributions
language plpgsql
security definer
set search_path = public
as $$
declare
  c contributions;
  v_event_id uuid;
begin
  insert into contributions
    (id, type, author_visitor_id, content, text_projection, lang, region, parent_id, root_id, depth)
  values
    (p_id, p_type, p_author, p_content, p_text, p_lang, p_region, p_parent, p_root, p_depth)
  returning * into c;

  insert into domain_events (type, aggregate_type, aggregate_id, payload, idempotency_key)
  values (p_event_type, 'contribution', p_id, p_event_payload, p_event_idem)
  returning id into v_event_id;

  insert into event_dispatch (event_id) values (v_event_id);

  return c;
end;
$$;

comment on function garden_create_contribution is
  'Atomic outbox write: contribution + ContributionCreated event + dispatch row in one transaction.';

-- Only the service role may call it; never anon/authenticated directly.
revoke all on function garden_create_contribution(
  uuid, text, uuid, jsonb, text, text, text, uuid, uuid, int, text, jsonb, text
) from public, anon, authenticated;
