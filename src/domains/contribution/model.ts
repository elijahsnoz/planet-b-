/**
 * Contribution — the primary domain concept of The Garden.
 *
 * Ritual-agnostic by contract: the words Seed / Sow / Plant / Entrust belong to the
 * presentation layer and never appear in this domain. The backend knows only
 * "contributions" and their "type".
 *
 * `type` is DATA (a row in contribution_types), not a compile-time enum — new forms
 * (question, sketch, memory, …) must never require a code change here. The union
 * below exists for editor ergonomics only; the field stays open.
 */
export type KnownContributionType =
  | "dream"
  | "question"
  | "sketch"
  | "artwork"
  | "story"
  | "memory"
  | "hope"
  | "observation"
  | "certificate";

// Open string: any registered type is valid; known ones keep autocomplete.
export type ContributionType = KnownContributionType | (string & {});

export type ContributionStatus = "living" | "held" | "withdrawn" | "transformed";

export interface Contribution {
  readonly id: string; // UUIDv7
  readonly type: ContributionType;
  readonly status: ContributionStatus;
  readonly authorVisitorId: string;
  /** Type-specific payload, validated per contribution_types.content_schema. */
  readonly content: Readonly<Record<string, unknown>>;
  /** Canonical searchable text derived from `content` (drives FTS + embeddings). */
  readonly textProjection: string | null;
  readonly lang: string | null;
  readonly region: string | null;
  readonly parentId: string | null; // continuation — a stranger tends another's contribution
  readonly rootId: string | null; // denormalised lineage root
  readonly depth: number;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt: string | null;
}

/**
 * Visitor — anonymous-first author. Identity FOLLOWS contribution: `personId`
 * (the Passport bridge) is null until a visitor later chooses to claim one.
 */
export interface Visitor {
  readonly id: string;
  readonly personId: string | null;
  readonly locale: string | null;
  readonly region: string | null;
  readonly firstContributedAt: string | null;
  readonly lastSeenAt: string;
  readonly createdAt: string;
  readonly deletedAt: string | null;
}
