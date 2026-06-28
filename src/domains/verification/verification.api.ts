"use server";
/**
 * Verification domain — server-action adapters.
 * `verify` is public (anyone can verify a certificate). Claim review requires
 * the `verification.manage` permission. Claim submission is open (a contributor
 * connecting their own certificate) but rate-limited at the route layer later.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { verificationService } from "./index";
import type { VerifyOutcome } from "./verification.types";

const idSchema = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : ""),
  z.string().min(1, "Missing id.").max(64)
);

/** Public verify (used by the /verify page and API). */
export async function verifyCertificate(query: string): Promise<VerifyOutcome> {
  const q = z
    .preprocess((v) => (typeof v === "string" ? v.trim() : ""), z.string().min(1).max(64))
    .parse(query);
  return verificationService.verify(q);
}

export async function submitClaimAction(fd: FormData) {
  const submittedPublicId =
    typeof fd.get("publicId") === "string" ? String(fd.get("publicId")).trim() : undefined;
  const fileRef = typeof fd.get("fileRef") === "string" ? String(fd.get("fileRef")).trim() : undefined;
  const claim = verificationService.submitClaim({ submittedPublicId, fileRef });
  // No OCR image at this layer (Noop provider) → route to human review + match.
  await verificationService.runOcr(claim.id);
  verificationService.matchClaim(claim.id);
  revalidatePath("/admin/verifications");
  return claim.id;
}

export async function matchClaimAction(fd: FormData) {
  await requirePermission("verification.manage");
  const id = idSchema.parse(fd.get("id"));
  const res = verificationService.matchClaim(id);
  if (!res.ok) throw new Error(res.error.message);
  revalidatePath("/admin/verifications");
  revalidatePath(`/admin/verifications/${id}`);
}

export async function reviewClaimAction(fd: FormData) {
  const user = await requirePermission("verification.manage");
  const id = idSchema.parse(fd.get("id"));
  const decision = z.enum(["approve", "reject"]).parse(fd.get("decision"));
  const note = typeof fd.get("note") === "string" ? String(fd.get("note")).trim() : undefined;
  const res = verificationService.reviewClaim(id, decision, user.id, note);
  if (!res.ok) throw new Error(res.error.message);
  revalidatePath("/admin/verifications");
  revalidatePath(`/admin/verifications/${id}`);
}
