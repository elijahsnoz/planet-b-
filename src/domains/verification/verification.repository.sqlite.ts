import "server-only";
/**
 * SqliteVerificationRepository — better-sqlite3 implementation of the claim
 * workflow store. Swapped for Postgres later (ADR-0001).
 */
import { desc, eq } from "drizzle-orm";
import { db, schema as t } from "@platform/db";
import type {
  ClaimPatch,
  NewClaim,
  VerificationRepository,
} from "./verification.repository";
import type { ClaimListItem, ClaimRequestRow, ClaimStatus } from "./verification.types";

function rowToItem(r: any): ClaimListItem {
  return {
    id: r.id,
    fileRef: r.fileRef,
    ocrText: r.ocrText,
    ocrConfidence: r.ocrConfidence,
    parsedFields: r.parsedFields,
    submittedPublicId: r.submittedPublicId,
    matchedCertificateId: r.matchedCertificateId,
    confidence: r.confidence,
    status: r.status as ClaimStatus,
    submittedBy: r.submittedBy,
    reviewer: r.reviewer,
    reviewNote: r.reviewNote,
    decidedAt: r.decidedAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    matchedPublicId: r.matchedPublicId ?? null,
    matchedRecipientName: r.matchedRecipientName ?? null,
  };
}

function selectWithMatch() {
  return db
    .select({
      id: t.claimRequests.id,
      fileRef: t.claimRequests.fileRef,
      ocrText: t.claimRequests.ocrText,
      ocrConfidence: t.claimRequests.ocrConfidence,
      parsedFields: t.claimRequests.parsedFields,
      submittedPublicId: t.claimRequests.submittedPublicId,
      matchedCertificateId: t.claimRequests.matchedCertificateId,
      confidence: t.claimRequests.confidence,
      status: t.claimRequests.status,
      submittedBy: t.claimRequests.submittedBy,
      reviewer: t.claimRequests.reviewer,
      reviewNote: t.claimRequests.reviewNote,
      decidedAt: t.claimRequests.decidedAt,
      createdAt: t.claimRequests.createdAt,
      updatedAt: t.claimRequests.updatedAt,
      matchedPublicId: t.certificates.publicId,
      matchedRecipientName: t.people.fullName,
    })
    .from(t.claimRequests)
    .leftJoin(t.certificates, eq(t.certificates.id, t.claimRequests.matchedCertificateId))
    .leftJoin(t.people, eq(t.people.id, t.certificates.personId));
}

export class SqliteVerificationRepository implements VerificationRepository {
  createClaim(claim: NewClaim): ClaimRequestRow {
    db.insert(t.claimRequests)
      .values({
        id: claim.id,
        fileRef: claim.fileRef ?? null,
        submittedPublicId: claim.submittedPublicId ?? null,
        submittedBy: claim.submittedBy ?? null,
        status: "uploaded",
      })
      .run();
    return this.getClaim(claim.id)!;
  }

  getClaim(id: string): ClaimListItem | null {
    const r = selectWithMatch().where(eq(t.claimRequests.id, id)).get();
    return r ? rowToItem(r) : null;
  }

  listClaims(opts: { status?: ClaimStatus } = {}): ClaimListItem[] {
    const q = selectWithMatch().orderBy(desc(t.claimRequests.createdAt));
    const rows = (opts.status ? q.where(eq(t.claimRequests.status, opts.status)) : q).all();
    return rows.map(rowToItem);
  }

  updateClaim(id: string, patch: ClaimPatch): void {
    db.update(t.claimRequests)
      .set({ ...patch, updatedAt: new Date().toISOString() } as any)
      .where(eq(t.claimRequests.id, id))
      .run();
  }
}
