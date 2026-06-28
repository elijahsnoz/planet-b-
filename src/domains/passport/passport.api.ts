"use server";
/**
 * Passport domain — server-action adapters. The only way the admin mutates a
 * Passport or its contributions. RBAC-guarded, validated, audit-logged.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { passportService } from "./index";
import { CONTRIBUTION_KINDS } from "./passport.types";

const idSchema = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : ""),
  z.string().min(1, "Missing id.").max(64)
);
const opt = (max: number) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : null), z.string().max(max).nullable());

const passportPatch = z.object({
  id: idSchema,
  country: opt(80),
  passportStatus: z.preprocess(
    (v) => (typeof v === "string" && v ? v : "unclaimed"),
    z.enum(["unclaimed", "claimed", "linked"])
  ),
  institutionalNote: opt(5000),
});

const contributionInput = z.object({
  personId: idSchema,
  kind: z.enum(CONTRIBUTION_KINDS as unknown as [string, ...string[]]),
  title: z.preprocess((v) => (typeof v === "string" ? v.trim() : ""), z.string().min(1, "Title is required.").max(300)),
  description: opt(5000),
  occurredOn: opt(40),
  chapterId: opt(64),
  source: opt(300),
});

function revalidate(personSlug?: string | null) {
  revalidatePath("/admin/passports");
  if (personSlug) revalidatePath(`/passport/${personSlug}`);
}

export async function updatePassportAction(fd: FormData) {
  const user = await requirePermission("passport.update");
  const input = passportPatch.parse({
    id: fd.get("id"),
    country: fd.get("country"),
    passportStatus: fd.get("passportStatus"),
    institutionalNote: fd.get("institutionalNote"),
  });
  const res = passportService.updatePassport(
    input.id,
    { country: input.country, passportStatus: input.passportStatus, institutionalNote: input.institutionalNote },
    user.id
  );
  if (!res.ok) throw new Error(res.error.message);
  revalidatePath(`/admin/passports/${input.id}`);
  revalidate(res.value.person.slug);
}

export async function addContributionAction(fd: FormData) {
  const user = await requirePermission("passport.update");
  const input = contributionInput.parse({
    personId: fd.get("personId"),
    kind: fd.get("kind"),
    title: fd.get("title"),
    description: fd.get("description"),
    occurredOn: fd.get("occurredOn"),
    chapterId: fd.get("chapterId"),
    source: fd.get("source"),
  });
  const res = passportService.addContribution(input as any, user.id);
  if (!res.ok) throw new Error(res.error.message);
  const pid = fd.get("passportUuid");
  if (typeof pid === "string") revalidatePath(`/admin/passports/${pid}`);
  revalidatePath("/admin/passports");
}

export async function archiveContributionAction(fd: FormData) {
  const user = await requirePermission("passport.update");
  const id = idSchema.parse(fd.get("id"));
  const restore = fd.get("restore") === "1";
  const res = passportService.archiveContribution(id, user.id, restore);
  if (!res.ok) throw new Error(res.error.message);
  const pid = fd.get("passportUuid");
  if (typeof pid === "string") revalidatePath(`/admin/passports/${pid}`);
}
