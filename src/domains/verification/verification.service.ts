import "server-only";
/**
 * VerificationService — the trust layer's published behavior.
 *
 * VERIFY works today with no blockchain: recompute the certificate's canonical
 * hash and compare to the stored one; consult the BlockchainService only for the
 * (currently disabled) on-chain dimension. CLAIM implements the workflow:
 * upload → OCR → registry match → human review → attach to (future) Passport.
 * OCR runs through the Intelligence Layer; with the default Noop provider the
 * claim correctly falls back to human review.
 */
import { randomUUID } from "node:crypto";
import {
  ConflictError,
  NotFoundError,
  ok,
  err,
  type Result,
  type Clock,
  systemClock,
} from "@shared/index";
import { blockchain } from "@platform/blockchain";
import { intelligence } from "@intelligence/index";
import { preservation, recordTrustEvent } from "@platform/preservation";
import { certificateService, type CertificateContext } from "@domains/certificate";
import type { VerificationRepository } from "./verification.repository";
import type { ClaimListItem, ClaimStatus, VerifyOutcome, VerifyStatus } from "./verification.types";

/** Loose Levenshtein-free similarity good enough for public-id / name matching. */
function tokenScore(a: string, b: string): number {
  const A = a.toLowerCase().trim();
  const B = b.toLowerCase().trim();
  if (!A || !B) return 0;
  if (A === B) return 1;
  if (A.includes(B) || B.includes(A)) return 0.85;
  return 0;
}

export class VerificationService {
  constructor(
    private readonly repo: VerificationRepository,
    private readonly clock: Clock = systemClock
  ) {}

  // ── VERIFY ────────────────────────────────────────────────────────────────

  private resolve(query: string): CertificateContext | null {
    const q = query.trim();
    return certificateService.getByPublicId(q) ?? certificateService.getByRegistryId(q);
  }

  /** Verify a certificate by its public ID or registry ID. Public; no auth. */
  async verify(query: string, actor = "public"): Promise<VerifyOutcome> {
    const cert = this.resolve(query);
    if (!cert) {
      const out: VerifyOutcome = {
        query,
        found: false,
        status: "not_found",
        hashValid: false,
        onChain: false,
        soulboundRef: null,
        certificate: null,
      };
      recordTrustEvent({ eventType: "verify", entityType: "certificate", actor, result: out });
      return out;
    }

    let status: VerifyStatus;
    let hashValid = false;
    if (cert.status === "reserved") status = "reserved";
    else if (cert.status === "revoked") status = "revoked";
    else if (cert.status !== "issued" || !cert.verificationHash) status = "unissued";
    else {
      const expected = blockchain.hashClaim(certificateService.canonicalClaim(cert));
      hashValid = expected === cert.verificationHash;
      status = hashValid ? "verified" : "mismatch";
    }

    // On-chain dimension (Noop → false today). Off-chain result above is authoritative.
    const chain = await blockchain.verifyCertificate(cert.publicId);
    const onChain = chain.ok ? chain.value.onChain : false;
    const soulboundRef = cert.soulboundRef ?? (chain.ok ? chain.value.soulboundRef ?? null : null);

    const out: VerifyOutcome = {
      query,
      found: true,
      status,
      hashValid,
      onChain,
      soulboundRef,
      certificate: {
        id: cert.id,
        publicId: cert.publicId,
        registryId: cert.registryId,
        recipientName: cert.recipientName,
        roleAtIssue: cert.roleAtIssue,
        chapterName: cert.chapterName,
        issuedOn: cert.issuedOn,
        status: cert.status,
        isGenesisCollection: cert.isGenesisCollection,
      },
    };
    recordTrustEvent({
      eventType: "verify",
      entityType: "certificate",
      entityId: cert.id,
      actor,
      result: { status, hashValid, onChain },
    });
    return out;
  }

  // ── CLAIM ───────────────────────────────────────────────────────────────────

  /** Step 1: a contributor uploads a physical certificate (or enters its ID). */
  submitClaim(input: { fileRef?: string; submittedPublicId?: string; submittedBy?: string }): ClaimListItem {
    const id = randomUUID();
    this.repo.createClaim({
      id,
      fileRef: input.fileRef ?? null,
      submittedPublicId: input.submittedPublicId ?? null,
      submittedBy: input.submittedBy ?? null,
    });
    recordTrustEvent({
      eventType: "claim",
      entityType: "claim_request",
      entityId: id,
      actor: input.submittedBy ?? "public",
      result: { action: "submitted" },
    });
    return this.repo.getClaim(id)!;
  }

  /**
   * Step 2: OCR the uploaded artifact via the Intelligence Layer. With the Noop
   * provider (no AI), there is no OCR — the claim drops to human review, which is
   * the safe, museum-grade default.
   */
  async runOcr(claimId: string, image?: { data: Uint8Array; mime: string }): Promise<Result<ClaimListItem>> {
    const claim = this.repo.getClaim(claimId);
    if (!claim) return err(new NotFoundError("Claim not found."));

    if (!intelligence.ocr || !image) {
      this.repo.updateClaim(claimId, { status: "needs_review" });
      return ok(this.repo.getClaim(claimId)!);
    }
    const res = await intelligence.ocr.recognize(image.data, image.mime);
    if (!res.ok) {
      this.repo.updateClaim(claimId, { status: "needs_review" });
      return ok(this.repo.getClaim(claimId)!);
    }
    this.repo.updateClaim(claimId, {
      ocrText: res.value.text,
      ocrConfidence: res.value.confidence,
      status: "ocr_done",
    });
    return ok(this.repo.getClaim(claimId)!);
  }

  /**
   * Step 3: match the claim to a certificate in the registry. Confident matches
   * advance to `matched`; weak/no matches go to `needs_review` for a human.
   */
  matchClaim(claimId: string): Result<ClaimListItem> {
    const claim = this.repo.getClaim(claimId);
    if (!claim) return err(new NotFoundError("Claim not found."));

    const asserted = (claim.submittedPublicId ?? extractPublicId(claim.ocrText) ?? "").trim();
    let matchedId: string | null = null;
    let confidence = 0;
    if (asserted) {
      const cert = certificateService.getByPublicId(asserted);
      if (cert) {
        matchedId = cert.id;
        confidence = tokenScore(asserted, cert.publicId);
      }
    }
    const status: ClaimStatus = matchedId && confidence >= 0.85 ? "matched" : "needs_review";
    this.repo.updateClaim(claimId, {
      matchedCertificateId: matchedId,
      confidence,
      submittedPublicId: asserted || claim.submittedPublicId,
      status,
    });
    recordTrustEvent({
      eventType: "claim",
      entityType: "claim_request",
      entityId: claimId,
      actor: "system",
      result: { action: "matched", matchedId, confidence, status },
    });
    return ok(this.repo.getClaim(claimId)!);
  }

  /**
   * Step 4: a reviewer approves or rejects. Approval connects the certificate to
   * its recipient's (future) Planet Passport — already possible because the
   * certificate's `personId` identifies the passport with no schema change.
   */
  reviewClaim(
    claimId: string,
    decision: "approve" | "reject",
    reviewer: string,
    note?: string
  ): Result<ClaimListItem> {
    const claim = this.repo.getClaim(claimId);
    if (!claim) return err(new NotFoundError("Claim not found."));
    if (claim.status === "claimed" || claim.status === "rejected")
      return err(new ConflictError(`Claim already ${claim.status}.`));
    if (decision === "approve" && !claim.matchedCertificateId)
      return err(new ConflictError("Cannot approve a claim with no matched certificate."));

    const status: ClaimStatus = decision === "approve" ? "claimed" : "rejected";
    this.repo.updateClaim(claimId, {
      status,
      reviewer,
      reviewNote: note ?? null,
      decidedAt: this.clock.nowIso(),
    });
    preservation.audit({
      actor: reviewer,
      action: `claim.${decision}`,
      entityType: "claim_request",
      entityId: claimId,
      after: { status, matchedCertificateId: claim.matchedCertificateId, note: note ?? null },
    });
    recordTrustEvent({
      eventType: "claim",
      entityType: "claim_request",
      entityId: claimId,
      actor: reviewer,
      result: { action: decision, certificateId: claim.matchedCertificateId },
    });
    return ok(this.repo.getClaim(claimId)!);
  }

  listClaims(opts?: { status?: ClaimStatus }): ClaimListItem[] {
    return this.repo.listClaims(opts);
  }
  getClaim(id: string): ClaimListItem | null {
    return this.repo.getClaim(id);
  }
}

/** Pull a PB-…-NNN public id out of OCR text, if present. */
function extractPublicId(text: string | null): string | null {
  if (!text) return null;
  const m = /PB-[A-Z]{2,5}-\d{4}-\d{2,4}/.exec(text.toUpperCase());
  return m ? m[0] : null;
}
