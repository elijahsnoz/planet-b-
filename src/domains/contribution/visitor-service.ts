import type { Visitor } from "./model";
import type { Clock, IdGenerator, VisitorRepository } from "./ports";

/**
 * Identify — the anonymous-first identity use-case.
 *
 * Pure application logic: it depends only on domain ports (VisitorRepository,
 * IdGenerator, Clock). It has no idea Supabase exists — the concrete repository is
 * injected by the composition root. Replace the store in five years and this file
 * does not change.
 *
 * Identity follows contribution: this never touches auth or Passports. It simply
 * ensures the anonymous author behind a durable token has a stable, permanent row.
 */
export interface VisitorContext {
  locale?: string | null;
  region?: string | null;
}

export class VisitorService {
  constructor(
    private readonly visitors: VisitorRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  /**
   * Find-or-create the visitor for a token hash, and mark them present.
   * Idempotent under concurrent first-arrival (the adapter upserts on the unique
   * anon_token_hash), so a double-tap can never create two rows.
   */
  async identify(anonTokenHash: string, ctx: VisitorContext = {}): Promise<Visitor> {
    const existing = await this.visitors.findByAnonTokenHash(anonTokenHash);
    if (existing) {
      // Presence is best-effort; a failed touch never blocks the visit.
      void this.visitors.touch(existing.id).catch(() => {});
      return existing;
    }
    return this.visitors.create({
      id: this.ids.next(),
      anonTokenHash,
      locale: ctx.locale ?? null,
      region: ctx.region ?? null,
    });
  }
}
