import "server-only";
import {
  ContributeService,
  VisitorService,
  type Contribution,
  type ContributionRepository,
  type VisitorRepository,
} from "@domains/contribution";
import { SupabaseVisitorRepository } from "./visitor.repository";
import { SupabaseContributionRepository } from "./contribution.repository";
import { SqliteVisitorRepository } from "./sqlite/visitor.repository";
import { SqliteContributionRepository } from "./sqlite/contribution.repository";
import { UuidV7Generator } from "./id";
import { SystemClock } from "./clock";

/**
 * Composition root — the outermost layer, where domain use-cases meet infrastructure.
 *
 * The adapter is chosen HERE, by configuration alone: when Supabase is provisioned
 * it is used; otherwise the local SQLite adapter is, so the whole architecture runs
 * and is provable end-to-end with no external infrastructure. The domain and the
 * application never change — swapping the store is exactly this one decision.
 */
function supabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function newVisitorRepo(): VisitorRepository {
  return supabaseConfigured() ? new SupabaseVisitorRepository() : new SqliteVisitorRepository();
}
function newContributionRepo(): ContributionRepository {
  return supabaseConfigured()
    ? new SupabaseContributionRepository()
    : new SqliteContributionRepository();
}

/** Which store is live — surfaced for diagnostics/proof, never for behaviour. */
export function activeStore(): "supabase" | "sqlite" {
  return supabaseConfigured() ? "supabase" : "sqlite";
}

let visitor: VisitorService | null = null;
let contribution: ContributeService | null = null;

export function visitorService(): VisitorService {
  if (!visitor) visitor = new VisitorService(newVisitorRepo(), new UuidV7Generator(), new SystemClock());
  return visitor;
}

export function contributionService(): ContributeService {
  if (!contribution) {
    contribution = new ContributeService(newContributionRepo(), new UuidV7Generator(), new SystemClock());
  }
  return contribution;
}

/** Read a contribution by its permanent id — used by the permanent URL page. */
export function readContribution(id: string): Promise<Contribution | null> {
  return newContributionRepo().byId(id);
}
