import "server-only";
import type { Visitor, VisitorRepository } from "@domains/contribution";
import { supabaseServiceClient } from "@platform/supabase/client";

/**
 * Supabase adapter for the domain's VisitorRepository port. This is infrastructure:
 * it maps database rows to domain objects and back. The domain and application never
 * import this file — they depend on the interface. Swap the store and this is the
 * only place that changes.
 */
const COLUMNS =
  "id, person_id, locale, region, first_contributed_at, last_seen_at, created_at, deleted_at";

interface VisitorRow {
  id: string;
  person_id: string | null;
  locale: string | null;
  region: string | null;
  first_contributed_at: string | null;
  last_seen_at: string;
  created_at: string;
  deleted_at: string | null;
}

function toVisitor(r: VisitorRow): Visitor {
  return {
    id: r.id,
    personId: r.person_id,
    locale: r.locale,
    region: r.region,
    firstContributedAt: r.first_contributed_at,
    lastSeenAt: r.last_seen_at,
    createdAt: r.created_at,
    deletedAt: r.deleted_at,
  };
}

export class SupabaseVisitorRepository implements VisitorRepository {
  private get db() {
    return supabaseServiceClient();
  }

  async findByAnonTokenHash(anonTokenHash: string): Promise<Visitor | null> {
    const { data, error } = await this.db
      .from("visitors")
      .select(COLUMNS)
      .eq("anon_token_hash", anonTokenHash)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    return data ? toVisitor(data as VisitorRow) : null;
  }

  async create(input: {
    id: string;
    anonTokenHash: string;
    locale: string | null;
    region: string | null;
  }): Promise<Visitor> {
    const { data, error } = await this.db
      .from("visitors")
      .insert({
        id: input.id,
        anon_token_hash: input.anonTokenHash,
        locale: input.locale,
        region: input.region,
      })
      .select(COLUMNS)
      .single();

    if (error) {
      // Concurrent first-arrival: another request won the unique(anon_token_hash)
      // race. Return the winner rather than fail — creation stays idempotent.
      if ((error as { code?: string }).code === "23505") {
        const existing = await this.findByAnonTokenHash(input.anonTokenHash);
        if (existing) return existing;
      }
      throw error;
    }
    return toVisitor(data as VisitorRow);
  }

  async touch(id: string): Promise<void> {
    const { error } = await this.db
      .from("visitors")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }
}
