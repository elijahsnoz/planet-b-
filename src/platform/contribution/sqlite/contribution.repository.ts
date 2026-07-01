import "server-only";
import { randomUUID } from "node:crypto";
import type {
  Contribution,
  ContributionRepository,
  CreateContribution,
  DomainEvent,
} from "@domains/contribution";
import { gardenDb } from "./db";

/**
 * Local SQLite adapter for the ContributionRepository port. `create` writes the
 * contribution, its event, and the dispatch row inside a single better-sqlite3
 * transaction — proving the outbox invariant (both land or neither does) with the
 * exact same domain code the Supabase adapter serves.
 */
interface Row {
  id: string;
  type: string;
  status: string;
  author_visitor_id: string;
  content: string;
  text_projection: string | null;
  lang: string | null;
  region: string | null;
  parent_id: string | null;
  root_id: string | null;
  depth: number;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toContribution(r: Row): Contribution {
  return {
    id: r.id,
    type: r.type,
    status: r.status as Contribution["status"],
    authorVisitorId: r.author_visitor_id,
    content: r.content ? (JSON.parse(r.content) as Record<string, unknown>) : {},
    textProjection: r.text_projection,
    lang: r.lang,
    region: r.region,
    parentId: r.parent_id,
    rootId: r.root_id,
    depth: r.depth,
    version: r.version,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

export class SqliteContributionRepository implements ContributionRepository {
  async create(input: CreateContribution, creationEvent: DomainEvent): Promise<Contribution> {
    const db = gardenDb();
    const now = new Date().toISOString();
    const eventId = randomUUID();

    const write = db.transaction(() => {
      db.prepare(
        "insert into contributions (id, type, author_visitor_id, content, text_projection, lang, region, parent_id, root_id, depth, created_at, updated_at) " +
          "values (@id, @type, @author, @content, @text, @lang, @region, @parent, @root, @depth, @now, @now)",
      ).run({
        id: input.id,
        type: input.type,
        author: input.authorVisitorId,
        content: JSON.stringify(input.content),
        text: input.textProjection,
        lang: input.lang,
        region: input.region,
        parent: input.parentId,
        root: input.rootId,
        depth: input.depth,
        now,
      });
      db.prepare(
        "insert into domain_events (id, type, aggregate_type, aggregate_id, payload, idempotency_key, occurred_at) " +
          "values (@id, @type, @atype, @aid, @payload, @idem, @occ)",
      ).run({
        id: eventId,
        type: creationEvent.type,
        atype: creationEvent.aggregateType,
        aid: creationEvent.aggregateId,
        payload: JSON.stringify(creationEvent.payload),
        idem: creationEvent.idempotencyKey ?? null,
        occ: creationEvent.occurredAt,
      });
      db.prepare("insert into event_dispatch (event_id, updated_at) values (?, ?)").run(eventId, now);
    });

    write(); // atomic

    return (await this.byId(input.id))!;
  }

  async byId(id: string): Promise<Contribution | null> {
    const r = gardenDb()
      .prepare("select * from contributions where id = ? and deleted_at is null")
      .get(id) as Row | undefined;
    return r ? toContribution(r) : null;
  }

  async lineage(rootId: string): Promise<Contribution[]> {
    const rows = gardenDb()
      .prepare("select * from contributions where root_id = ? and deleted_at is null order by depth asc, created_at asc")
      .all(rootId) as Row[];
    return rows.map(toContribution);
  }
}
