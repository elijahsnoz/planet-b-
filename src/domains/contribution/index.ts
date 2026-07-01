/**
 * The Contribution domain (The Garden).
 *
 * Boundary rules — enforced by review:
 *  1. Ritual-agnostic. The words Seed / Sow / Plant / Entrust never appear in this
 *     domain; they are presentation-only. The domain says "contribution".
 *  2. `Contribution` is the aggregate; `type` (dream, question, …) is DATA, not an
 *     enum. New forms add a row + a validator, never a schema change here.
 *  3. Every state change emits an immutable domain event (see events.ts).
 *  4. Identity follows contribution — the write path never requires auth.
 *
 * PR1 ships contracts only (types, events, validation, ports) plus the SQL
 * foundation under supabase/migrations. Nothing is wired into the running app yet.
 */
export * from "./model";
export * from "./events";
export * from "./validation";
export * from "./ports";
export * from "./visitor-service";
export * from "./contribute-service";
