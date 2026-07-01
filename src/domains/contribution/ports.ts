import type { Contribution } from "./model";
import type { DomainEvent } from "./events";
import type { ContributionInput } from "./validation";

/**
 * Hexagonal ports. The Supabase Postgres implementation is an adapter behind these
 * interfaces, so the store/transport can graduate (read replicas, sharding, a real
 * event broker) without touching a single caller. This is the seam that lets the
 * system reach 50M contributions without a rewrite.
 */

/** UUIDv7 generator — time-ordered ids for index locality at scale. */
export interface IdGenerator {
  next(): string;
}

export interface Clock {
  now(): string; // ISO 8601
}

export interface CreateContribution {
  id: string;
  type: string;
  authorVisitorId: string;
  content: Record<string, unknown>;
  textProjection: string | null;
  lang: string | null;
  region: string | null;
  parentId: string | null;
  rootId: string | null;
  depth: number;
}

export interface ContributionRepository {
  create(input: CreateContribution): Promise<Contribution>;
  byId(id: string): Promise<Contribution | null>;
  /** The full lineage tree for a root — how one contribution grew. */
  lineage(rootId: string): Promise<Contribution[]>;
}

/**
 * Appends a domain event to the transactional outbox. Implementations MUST enlist
 * in the same transaction as the state change that produced the event.
 */
export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

/** The write use-case. Never requires auth — identity follows contribution. */
export interface ContributionService {
  contribute(visitorId: string, input: ContributionInput): Promise<Contribution>;
}
