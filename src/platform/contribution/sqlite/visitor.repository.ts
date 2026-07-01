import "server-only";
import type { Visitor, VisitorRepository } from "@domains/contribution";
import { gardenDb } from "./db";

/** Local SQLite adapter for the VisitorRepository port. Same interface as Supabase. */
interface Row {
  id: string;
  person_id: string | null;
  locale: string | null;
  region: string | null;
  first_contributed_at: string | null;
  last_seen_at: string;
  created_at: string;
  deleted_at: string | null;
}

function toVisitor(r: Row): Visitor {
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

export class SqliteVisitorRepository implements VisitorRepository {
  async findByAnonTokenHash(anonTokenHash: string): Promise<Visitor | null> {
    const r = gardenDb()
      .prepare("select * from visitors where anon_token_hash = ? and deleted_at is null")
      .get(anonTokenHash) as Row | undefined;
    return r ? toVisitor(r) : null;
  }

  async create(input: {
    id: string;
    anonTokenHash: string;
    locale: string | null;
    region: string | null;
  }): Promise<Visitor> {
    const now = new Date().toISOString();
    try {
      gardenDb()
        .prepare(
          "insert into visitors (id, anon_token_hash, locale, region, last_seen_at, created_at, updated_at) " +
            "values (@id, @hash, @locale, @region, @now, @now, @now)",
        )
        .run({ id: input.id, hash: input.anonTokenHash, locale: input.locale, region: input.region, now });
    } catch (e) {
      if (String((e as Error).message).includes("UNIQUE")) {
        const existing = await this.findByAnonTokenHash(input.anonTokenHash);
        if (existing) return existing;
      }
      throw e;
    }
    return (await this.findByAnonTokenHash(input.anonTokenHash))!;
  }

  async touch(id: string): Promise<void> {
    gardenDb().prepare("update visitors set last_seen_at = ? where id = ?").run(new Date().toISOString(), id);
  }
}
