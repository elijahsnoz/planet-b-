import "server-only";
import { and, desc, eq, max } from "drizzle-orm";
import { db, schema as t } from "@/db/client";

/** Append an audit log entry (who/what/before/after). Never updated/deleted. */
export function writeAudit(entry: {
  actor?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  registryId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}) {
  db.insert(t.auditLogs).values({
    actor: entry.actor ?? null,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    registryId: entry.registryId ?? null,
    before: entry.before ?? null,
    after: entry.after ?? null,
    ip: entry.ip ?? null,
    userAgent: entry.userAgent ?? null,
  }).run();
}

/** Snapshot a full row as a new immutable revision (version history). */
export function writeRevision(opts: {
  entityType: string;
  entityId: string;
  registryId?: string | null;
  snapshot: unknown;
  changeSummary?: string;
  createdBy?: string | null;
}) {
  const last = db
    .select({ v: max(t.revisions.version) })
    .from(t.revisions)
    .where(and(eq(t.revisions.entityType, opts.entityType), eq(t.revisions.entityId, opts.entityId)))
    .get();
  const version = (last?.v ?? 0) + 1;
  db.insert(t.revisions).values({
    entityType: opts.entityType,
    entityId: opts.entityId,
    registryId: opts.registryId ?? null,
    version,
    snapshot: opts.snapshot,
    changeSummary: opts.changeSummary,
    createdBy: opts.createdBy ?? null,
  }).run();
  return version;
}

export function recentAudit(limit = 100) {
  return db.select().from(t.auditLogs).orderBy(desc(t.auditLogs.id)).limit(limit).all();
}
