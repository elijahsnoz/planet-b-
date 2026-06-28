/**
 * Digital-preservation primitives shared by every cultural record.
 *
 * These encode the museum-software guarantees (Principle VIII): provenance,
 * lifecycle status, soft-delete, and the contract for audit + version history.
 * Domains compose these; they never re-invent them.
 */

import type { RegistryId, Uuid } from "./id";

/** The publication lifecycle every governed record moves through. */
export type LifecycleStatus = "draft" | "in_review" | "published" | "archived";

export const LIFECYCLE_STATUSES: readonly LifecycleStatus[] = [
  "draft",
  "in_review",
  "published",
  "archived",
];

/** Consent gates publication of people — never hierarchy (Principle IV). */
export type ConsentStatus = "granted" | "pending" | "withheld";

/** Columns every governed cultural entity carries (mirror of db `governance()`). */
export interface Governed {
  id: Uuid;
  registryId?: RegistryId | null;
  slug?: string | null;
  status: LifecycleStatus;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  /** Soft-delete marker; null = live. Nothing is ever hard-deleted. */
  archivedAt?: string | null;
}

/** Is this record currently visible to the public? (published + not archived) */
export function isLive(r: Pick<Governed, "status" | "archivedAt">): boolean {
  return r.status === "published" && !r.archivedAt;
}

/**
 * The preservation side-effects a domain write must emit. The Verification /
 * audit infrastructure implements this; domain services depend on the interface
 * so "every write is audit-logged and snapshotted" is structural, not optional.
 */
export interface PreservationRecorder {
  /** Append an immutable audit entry (who/what/before/after). */
  audit(entry: AuditEntry): void | Promise<void>;
  /** Snapshot a full row as the next immutable revision (version history). */
  revise(entry: RevisionEntry): void | Promise<void>;
}

export interface AuditEntry {
  actor?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  registryId?: RegistryId | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}

export interface RevisionEntry {
  entityType: string;
  entityId: string;
  registryId?: RegistryId | null;
  snapshot: unknown;
  changeSummary?: string;
  createdBy?: string | null;
}
