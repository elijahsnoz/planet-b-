# Contribution domain — The Garden

The living, anonymous, growing half of Planet B. Feeds the verified Archive via the
Transformation bridge.

## Non-negotiable boundary rules
1. **Ritual-agnostic.** `Seed / Sow / Plant / Entrust` are presentation-only and must
   never appear in this domain, the schema, events, or APIs. The domain says
   **contribution**.
2. **`Contribution` is the aggregate.** `type` (dream, question, sketch, memory, …) is
   **data** — a row in `contribution_types`, never a Postgres enum. New forms add a
   row + a content validator; they never change the schema.
3. **Immutable events.** Every state change appends to the `domain_events` outbox in
   the same transaction; the log is append-only. Consumers drive all side effects.
4. **Identity follows contribution.** The write path never requires auth; `visitor
   .person_id` (the Passport bridge) is null until a later, optional claim.

## Every decision passes: *"would we still do this at 50M contributions?"*
UUIDv7 keys · reference-table vocabularies · core + `content jsonb` · transactional
outbox + projections (CQRS-lite) · partition-ready tables · async embeddings/echoes ·
need-and-resonance surfacing, never popularity.

## Shape (PR1)
- `supabase/migrations/0001_contribution_foundation.sql` — schema, indexes, RLS.
- `model.ts` · `events.ts` · `validation.ts` · `ports.ts` — contracts only.

Nothing here is wired into the running app yet. Later PRs add the Supabase adapter,
the edge-function write broker, the surfacing engine, and the flag-gated UI ritual.

## Rollout
The whole feature is gated by `flags.garden` (`lib/flags.ts`), OFF unless
`PLANET_B_GARDEN` is set. Every Garden surface — homepage ritual, garden route, seed
pages, write endpoint — checks this flag, so the system can be merged to main and
built continuously while remaining invisible until deliberately enabled.
