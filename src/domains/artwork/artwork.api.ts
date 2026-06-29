"use server";
/**
 * Artwork domain — server-action adapters for provenance curation. RBAC-guarded,
 * validated, audit-logged. Core artwork fields are still edited via the existing
 * artworks admin; this domain adds the accumulating provenance record.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { artworkService } from "./index";
import { PROVENANCE_KINDS } from "./artwork.types";

const idSchema = z.preprocess((v) => (typeof v === "string" ? v.trim() : ""), z.string().min(1).max(64));
const opt = (max: number) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : null), z.string().max(max).nullable());

export async function addProvenanceAction(fd: FormData) {
  const user = await requirePermission("artwork.update");
  const input = z
    .object({
      artworkId: idSchema,
      kind: z.enum(PROVENANCE_KINDS as unknown as [string, ...string[]]),
      title: z.preprocess((v) => (typeof v === "string" ? v.trim() : ""), z.string().min(1, "Title is required.").max(300)),
      description: opt(2000),
      occurredOn: opt(40),
      chapterId: opt(64),
      organizationId: opt(64),
      source: opt(300),
    })
    .parse({
      artworkId: fd.get("artworkId"),
      kind: fd.get("kind"),
      title: fd.get("title"),
      description: fd.get("description"),
      occurredOn: fd.get("occurredOn"),
      chapterId: fd.get("chapterId"),
      organizationId: fd.get("organizationId"),
      source: fd.get("source"),
    });
  const res = artworkService.addProvenance(input as any, user.id);
  if (!res.ok) throw new Error(res.error.message);
  revalidatePath(`/admin/artworks/${input.artworkId}`);
}

export async function archiveProvenanceAction(fd: FormData) {
  const user = await requirePermission("artwork.update");
  const id = idSchema.parse(fd.get("id"));
  const artworkId = idSchema.parse(fd.get("artworkId"));
  const restore = fd.get("restore") === "1";
  const res = artworkService.archiveProvenance(id, user.id, restore);
  if (!res.ok) throw new Error(res.error.message);
  revalidatePath(`/admin/artworks/${artworkId}`);
}
