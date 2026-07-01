/**
 * Immutable, versioned domain events.
 *
 * Producers append these to the transactional outbox (domain_events) in the SAME
 * transaction as the state change — so no event is ever lost and there is no
 * dual-write race. Async consumers drive every side effect (embeddings, echo
 * discovery, garden refresh, projections, notifications). Because producers only
 * ever write to the outbox, the transport can graduate to a real broker later
 * without touching a single caller.
 *
 * Events are immutable and payload-versioned: consumers must tolerate old versions
 * forever (a 10-year archive replays its own history).
 */
export type AggregateType = "contribution" | "visitor" | "passport" | "garden";

export interface DomainEventEnvelope<TType extends string, TPayload> {
  readonly type: TType;
  readonly aggregateType: AggregateType;
  readonly aggregateId: string | null;
  readonly payloadVersion: number;
  readonly occurredAt: string;
  readonly payload: Readonly<TPayload>;
  /** Deduplication key for exactly-once consumer effects. */
  readonly idempotencyKey?: string;
}

export type ContributionCreated = DomainEventEnvelope<
  "ContributionCreated",
  { contributionId: string; type: string; authorVisitorId: string; parentId: string | null }
>;

export type ContributionUpdated = DomainEventEnvelope<
  "ContributionUpdated",
  { contributionId: string; changed: readonly string[] }
>;

export type EchoDiscovered = DomainEventEnvelope<
  "EchoDiscovered",
  { fromContributionId: string; toContributionId: string; strength: number }
>;

export type TransformationCreated = DomainEventEnvelope<
  "TransformationCreated",
  { contributionId: string; targetType: "story" | "artwork" | "certificate"; targetId: string }
>;

export type PassportUpdated = DomainEventEnvelope<
  "PassportUpdated",
  { passportId: string; visitorId: string; reason: string }
>;

export type GardenRefreshed = DomainEventEnvelope<
  "GardenRefreshed",
  { surfaceVersion: string; size: number }
>;

export type EmbeddingCompleted = DomainEventEnvelope<
  "EmbeddingCompleted",
  { contributionId: string; model: string; dimensions: number }
>;

export type DomainEvent =
  | ContributionCreated
  | ContributionUpdated
  | EchoDiscovered
  | TransformationCreated
  | PassportUpdated
  | GardenRefreshed
  | EmbeddingCompleted;

export type DomainEventType = DomainEvent["type"];
