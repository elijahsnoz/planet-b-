import "server-only";
/**
 * @platform/preservation — the digital-preservation seam.
 *
 * Implements the kernel's `PreservationRecorder` over the existing audit +
 * revision infrastructure (lib/audit). Domains depend on this interface so
 * "every write is audit-logged and snapshotted" (Principle VIII) is structural,
 * not optional. Also exposes the append-only `verification_events` log used by
 * the trust domains.
 */
import { sql } from "drizzle-orm";
import { db } from "@platform/db";
import { schema as t } from "@platform/db";
import { writeAudit, writeRevision } from "@/lib/audit";
import type { AuditEntry, PreservationRecorder, RevisionEntry } from "@shared/index";

export const preservation: PreservationRecorder = {
  audit(entry: AuditEntry) {
    writeAudit(entry);
  },
  revise(entry: RevisionEntry) {
    writeRevision({
      entityType: entry.entityType,
      entityId: entry.entityId,
      registryId: entry.registryId ?? null,
      snapshot: entry.snapshot,
      changeSummary: entry.changeSummary,
      createdBy: entry.createdBy ?? null,
    });
  },
};

/** An append-only trust event (verify/claim/anchor/mint). Never updated/deleted. */
export interface TrustEvent {
  eventType: "verify" | "claim" | "anchor" | "mint";
  entityType?: string;
  entityId?: string;
  actor?: string | null;
  result?: unknown;
}

/** Record a verification_events row. */
export function recordTrustEvent(e: TrustEvent): void {
  db.insert(t.verificationEvents)
    .values({
      eventType: e.eventType,
      entityType: e.entityType,
      entityId: e.entityId,
      actor: e.actor ?? "system",
      result: (e.result ?? null) as unknown,
    })
    .run();
}

/** Read recent trust events for an entity (newest first). */
export function trustEventsFor(entityType: string, entityId: string, limit = 50) {
  return db
    .select()
    .from(t.verificationEvents)
    .where(
      sql`${t.verificationEvents.entityType} = ${entityType} and ${t.verificationEvents.entityId} = ${entityId}`
    )
    .orderBy(sql`${t.verificationEvents.id} desc`)
    .limit(limit)
    .all();
}
