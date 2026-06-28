"use server";
/**
 * Certificate domain — server-action adapters. The ONLY way the admin UI mutates
 * certificates. Each adapter authorizes (RBAC), delegates to CertificateService,
 * unwraps the Result into a thrown error for the form layer, and revalidates.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { certificateService } from "./index";

const idSchema = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : ""),
  z.string().min(1, "Missing certificate id.").max(64)
);

const relationSchema = z.object({
  id: idSchema,
  relation: z.preprocess((v) => (typeof v === "string" ? v.trim() : ""), z.enum([
    "has_master",
    "related_story",
    "related_press",
    "related_media",
    "related_timeline",
    "signed_by",
  ])),
  toType: z.preprocess((v) => (typeof v === "string" ? v.trim() : ""), z.string().min(1).max(40)),
  toId: z.preprocess((v) => (typeof v === "string" ? v.trim() : ""), z.string().min(1).max(64)),
});

function revalidate(id: string) {
  revalidatePath("/admin/certificates");
  revalidatePath(`/admin/certificates/${id}`);
  revalidatePath("/admin/certificates/genesis");
}

export async function issueCertificateAction(fd: FormData) {
  const user = await requirePermission("certificate.issue");
  const id = idSchema.parse(fd.get("id"));
  const res = certificateService.issue(id, user.id);
  if (!res.ok) throw new Error(res.error.message);
  revalidate(id);
  revalidatePath("/verify");
}

export async function revokeCertificateAction(fd: FormData) {
  const user = await requirePermission("certificate.revoke");
  const id = idSchema.parse(fd.get("id"));
  const reason = typeof fd.get("reason") === "string" ? String(fd.get("reason")).trim() : undefined;
  const res = certificateService.revoke(id, user.id, reason);
  if (!res.ok) throw new Error(res.error.message);
  revalidate(id);
}

export async function relateCertificateAction(fd: FormData) {
  const user = await requirePermission("certificate.update");
  const input = relationSchema.parse({
    id: fd.get("id"),
    relation: fd.get("relation"),
    toType: fd.get("toType"),
    toId: fd.get("toId"),
  });
  const res = certificateService.relate(
    input.id,
    { relation: input.relation, toType: input.toType, toId: input.toId },
    user.id
  );
  if (!res.ok) throw new Error(res.error.message);
  revalidate(input.id);
}

export async function unrelateCertificateAction(fd: FormData) {
  const user = await requirePermission("certificate.update");
  const input = relationSchema.parse({
    id: fd.get("id"),
    relation: fd.get("relation"),
    toType: fd.get("toType"),
    toId: fd.get("toId"),
  });
  const res = certificateService.unrelate(
    input.id,
    { relation: input.relation, toType: input.toType, toId: input.toId },
    user.id
  );
  if (!res.ok) throw new Error(res.error.message);
  revalidate(input.id);
}
