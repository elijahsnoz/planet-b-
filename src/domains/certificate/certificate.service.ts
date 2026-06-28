import "server-only";
/**
 * CertificateService — the Certificate domain's published business rules.
 *
 * Guiding principle: a certificate is a historical artifact. This service can
 * complete its *issuance* (draft → issued, computing the verification hash) and
 * *revoke* it (a status, never a deletion), and it can attach/detach digital
 * relationships. It can NEVER rewrite the artifact's identity (publicId,
 * recipient, role, chapter, artwork) — there is simply no method to do so.
 */
import {
  ConflictError,
  NotFoundError,
  ok,
  err,
  type Result,
  type Clock,
  systemClock,
} from "@shared/index";
import { preservation, recordTrustEvent } from "@platform/preservation";
import { blockchain } from "@platform/blockchain";
import type { CertificateClaimV1 } from "@/models";
import type { CertificateRepository } from "./certificate.repository";
import type {
  CertificateContext,
  CertificateListItem,
  CertificateListQuery,
  CertRelation,
} from "./certificate.types";

export class CertificateService {
  constructor(
    private readonly repo: CertificateRepository,
    private readonly clock: Clock = systemClock
  ) {}

  getById(id: string): CertificateContext | null {
    return this.repo.findById(id);
  }
  getByPublicId(publicId: string): CertificateContext | null {
    return this.repo.findByPublicId(publicId);
  }
  getByRegistryId(registryId: string): CertificateContext | null {
    return this.repo.findByRegistryId(registryId);
  }
  list(query: CertificateListQuery = {}): CertificateListItem[] {
    return this.repo.list(query);
  }
  /** The Genesis Collection — the 14 founding-artist certificates. */
  genesisCollection(): CertificateListItem[] {
    return this.repo.listGenesisCollection();
  }
  countByStatus(): Record<string, number> {
    return this.repo.countByStatus();
  }

  /**
   * The exact, ordered fields that get hashed for verification (CertificateClaimV1).
   * Versioned so a hash minted in 2026 still validates decades later.
   */
  canonicalClaim(cert: CertificateContext): CertificateClaimV1 {
    return {
      v: 1,
      publicId: cert.publicId,
      subject: cert.recipientSlug ?? "",
      roleAtIssue: cert.roleAtIssue,
      chapter: cert.chapterSlug ?? "",
      artwork: cert.artworkSlug ?? null,
      issuedOn: cert.issuedOn ?? "",
    };
  }

  /** Compute the verification hash a certificate would carry once issued. */
  previewHash(cert: CertificateContext): string {
    return blockchain.hashClaim(this.canonicalClaim(cert));
  }

  /**
   * Complete issuance: draft → issued, stamp issuedOn, compute + store the
   * verification hash. Reserved/issued/revoked certificates cannot be issued.
   */
  issue(id: string, actor: string): Result<CertificateContext> {
    const cert = this.repo.findById(id);
    if (!cert) return err(new NotFoundError("Certificate not found."));
    if (cert.status === "reserved")
      return err(new ConflictError("This certificate is intentionally reserved and cannot be issued."));
    if (cert.status !== "draft")
      return err(new ConflictError(`Only a draft certificate can be issued (status: ${cert.status}).`));

    const issuedOn = this.clock.nowIso();
    const hash = blockchain.hashClaim({ ...this.canonicalClaim(cert), issuedOn });
    this.repo.setIssued(id, issuedOn, hash, actor);

    preservation.audit({
      actor,
      action: "certificate.issue",
      entityType: "certificate",
      entityId: id,
      registryId: cert.registryId,
      before: { status: cert.status },
      after: { status: "issued", issuedOn, verificationHash: hash },
    });
    preservation.revise({
      entityType: "certificate",
      entityId: id,
      registryId: cert.registryId,
      snapshot: { ...cert, status: "issued", issuedOn, verificationHash: hash },
      changeSummary: "issued",
      createdBy: actor,
    });
    recordTrustEvent({
      eventType: "mint",
      entityType: "certificate",
      entityId: id,
      actor,
      result: { action: "issued", verificationHash: hash },
    });
    return ok(this.repo.findById(id)!);
  }

  /** Revoke an issued certificate (a status, never a deletion). */
  revoke(id: string, actor: string, reason?: string): Result<CertificateContext> {
    const cert = this.repo.findById(id);
    if (!cert) return err(new NotFoundError("Certificate not found."));
    if (cert.status !== "issued")
      return err(new ConflictError(`Only an issued certificate can be revoked (status: ${cert.status}).`));
    this.repo.setStatus(id, "revoked", actor);
    preservation.audit({
      actor,
      action: "certificate.revoke",
      entityType: "certificate",
      entityId: id,
      registryId: cert.registryId,
      before: { status: cert.status },
      after: { status: "revoked", reason: reason ?? null },
    });
    return ok(this.repo.findById(id)!);
  }

  /** Attach a digital relationship (master asset, related story/press/media/timeline). */
  relate(id: string, edge: CertRelation, actor: string): Result<CertificateContext> {
    const cert = this.repo.findById(id);
    if (!cert) return err(new NotFoundError("Certificate not found."));
    this.repo.addRelation({ certId: id, ...edge });
    preservation.audit({
      actor,
      action: "certificate.relate",
      entityType: "certificate",
      entityId: id,
      registryId: cert.registryId,
      after: edge,
    });
    return ok(this.repo.findById(id)!);
  }

  /** Remove a digital relationship. */
  unrelate(id: string, edge: CertRelation, actor: string): Result<CertificateContext> {
    const cert = this.repo.findById(id);
    if (!cert) return err(new NotFoundError("Certificate not found."));
    this.repo.removeRelation({ certId: id, ...edge });
    preservation.audit({
      actor,
      action: "certificate.unrelate",
      entityType: "certificate",
      entityId: id,
      registryId: cert.registryId,
      after: edge,
    });
    return ok(this.repo.findById(id)!);
  }
}
