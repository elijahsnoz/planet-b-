"use server";
/**
 * Chapter domain — server-action adapters. RBAC-guarded, validated, audit-logged.
 * The Genesis Chapter is protected in the service (never archivable).
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { chapterService } from "./index";

const idSchema = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : ""),
  z.string().min(1, "Missing chapter id.").max(64)
);
const opt = (max: number) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : null), z.string().max(max).nullable());

const patchSchema = z.object({
  id: idSchema,
  name: z.preprocess((v) => (typeof v === "string" ? v.trim() : ""), z.string().min(1, "Name is required.").max(200)),
  city: opt(120),
  country: opt(120),
  venue: opt(200),
  theme: opt(200),
  summary: opt(5000),
  openedOn: opt(40),
  endedOn: opt(40),
  status: z.preprocess(
    (v) => (typeof v === "string" && v ? v : "draft"),
    z.enum(["draft", "in_review", "published", "archived"])
  ),
});

export async function updateChapterAction(fd: FormData) {
  const user = await requirePermission("chapter.update");
  const input = patchSchema.parse({
    id: fd.get("id"),
    name: fd.get("name"),
    city: fd.get("city"),
    country: fd.get("country"),
    venue: fd.get("venue"),
    theme: fd.get("theme"),
    summary: fd.get("summary"),
    openedOn: fd.get("openedOn"),
    endedOn: fd.get("endedOn"),
    status: fd.get("status"),
  });
  const { id, ...patch } = input;
  const res = chapterService.update(id, patch, user.id);
  if (!res.ok) throw new Error(res.error.message);
  revalidatePath("/admin/chapters");
  revalidatePath(`/admin/chapters/${id}`);
  revalidatePath("/chapters");
  if (res.value.chapter.slug) revalidatePath(`/chapters/${res.value.chapter.slug}`);
}
