import "server-only";
import type {
  Contribution,
  ContributionRepository,
  CreateContribution,
  DomainEvent,
} from "@domains/contribution";
import { supabaseServiceClient } from "@platform/supabase/client";

/**
 * Supabase adapter for the ContributionRepository port. Infrastructure only: it
 * maps rows to domain objects and calls the atomic write function. The domain and
 * application depend on the interface, never on this file.
 */
const COLUMNS =
  "id, type, status, author_visitor_id, content, text_projection, lang, region, parent_id, root_id, depth, version, created_at, updated_at, deleted_at";

interface ContributionRow {
  id: string;
  type: string;
  status: string;
  author_visitor_id: string;
  content: Record<string, unknown>;
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

function toContribution(r: ContributionRow): Contribution {
  return {
    id: r.id,
    type: r.type,
    status: r.status as Contribution["status"],
    authorVisitorId: r.author_visitor_id,
    content: r.content ?? {},
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

export class SupabaseContributionRepository implements ContributionRepository {
  private get db() {
    return supabaseServiceClient();
  }

  async create(input: CreateContribution, creationEvent: DomainEvent): Promise<Contribution> {
    // One RPC = one transaction: the contribution and its event land together.
    const { data, error } = await this.db.rpc("garden_create_contribution", {
      p_id: input.id,
      p_type: input.type,
      p_author: input.authorVisitorId,
      p_content: input.content,
      p_text: input.textProjection,
      p_lang: input.lang,
      p_region: input.region,
      p_parent: input.parentId,
      p_root: input.rootId,
      p_depth: input.depth,
      p_event_type: creationEvent.type,
      p_event_payload: creationEvent.payload,
      p_event_idem: creationEvent.idempotencyKey ?? null,
    });
    if (error) throw error;
    return toContribution(data as ContributionRow);
  }

  async byId(id: string): Promise<Contribution | null> {
    const { data, error } = await this.db
      .from("contributions")
      .select(COLUMNS)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    return data ? toContribution(data as ContributionRow) : null;
  }

  async lineage(rootId: string): Promise<Contribution[]> {
    const { data, error } = await this.db
      .from("contributions")
      .select(COLUMNS)
      .eq("root_id", rootId)
      .is("deleted_at", null)
      .order("depth", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data as ContributionRow[]).map(toContribution);
  }
}
