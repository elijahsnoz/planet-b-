"use server";
/**
 * Story domain — server-action adapters. RBAC-guarded, validated, audit-logged.
 * Composition (sections) and publishing flow through StoryService.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { storyService } from "./index";
import { STORY_KINDS, STORY_REF_TYPES } from "./story.types";

const idSchema = z.preprocess((v) => (typeof v === "string" ? v.trim() : ""), z.string().min(1).max(64));
const opt = (max: number) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : null), z.string().max(max).nullable());
const kindSchema = z.enum(STORY_KINDS as unknown as [string, ...string[]]);

function revalidate(id: string, slug?: string | null) {
  revalidatePath("/admin/stories");
  revalidatePath(`/admin/stories/${id}`);
  revalidatePath("/stories");
  if (slug) revalidatePath(`/stories/${slug}`);
}

export async function createStoryAction(fd: FormData) {
  const user = await requirePermission("story.create");
  const input = z
    .object({
      title: z.preprocess((v) => (typeof v === "string" ? v.trim() : ""), z.string().min(1, "Title is required.").max(200)),
      dek: opt(500),
      kind: kindSchema,
      chapterId: opt(64),
    })
    .parse({ title: fd.get("title"), dek: fd.get("dek"), kind: fd.get("kind"), chapterId: fd.get("chapterId") });
  const res = storyService.create(input as any, user.id);
  if (!res.ok) throw new Error(res.error.message);
  revalidate(res.value.id, res.value.slug);
  redirect(`/admin/stories/${res.value.id}`);
}

export async function updateStoryMetaAction(fd: FormData) {
  const user = await requirePermission("story.update");
  const id = idSchema.parse(fd.get("id"));
  const patch = z
    .object({
      title: z.preprocess((v) => (typeof v === "string" ? v.trim() : ""), z.string().min(1).max(200)),
      subtitle: opt(300),
      dek: opt(500),
      kind: kindSchema,
      chapterId: opt(64),
      coverMedia: opt(200),
    })
    .parse({
      title: fd.get("title"),
      subtitle: fd.get("subtitle"),
      dek: fd.get("dek"),
      kind: fd.get("kind"),
      chapterId: fd.get("chapterId"),
      coverMedia: fd.get("coverMedia"),
    });
  const res = storyService.updateMeta(id, patch, user.id);
  if (!res.ok) throw new Error(res.error.message);
  revalidate(id, res.value.slug);
}

export async function setStoryStatusAction(fd: FormData) {
  const status = z.enum(["draft", "in_review", "published", "archived"]).parse(fd.get("status"));
  const user = await requirePermission(status === "published" ? "story.publish" : "story.update");
  const id = idSchema.parse(fd.get("id"));
  const res = storyService.setStatus(id, status, user.id);
  if (!res.ok) throw new Error(res.error.message);
  revalidate(id, res.value.slug);
}

export async function addSectionAction(fd: FormData) {
  const user = await requirePermission("story.update");
  const id = idSchema.parse(fd.get("id"));
  const kind = z.enum(["heading", "prose", "quote", "record"]).parse(fd.get("sectionKind"));
  const section =
    kind === "record"
      ? {
          kind,
          refType: z.enum(STORY_REF_TYPES as unknown as [string, ...string[]]).parse(fd.get("refType")) as any,
          refId: idSchema.parse(fd.get("refId")),
          caption: opt(300).parse(fd.get("caption")) ?? undefined,
        }
      : {
          kind,
          text: opt(5000).parse(fd.get("text")) ?? "",
          attribution: kind === "quote" ? opt(200).parse(fd.get("attribution")) ?? undefined : undefined,
        };
  const res = storyService.addSection(id, section as any, user.id);
  if (!res.ok) throw new Error(res.error.message);
  revalidate(id, res.value.slug);
}

export async function removeSectionAction(fd: FormData) {
  const user = await requirePermission("story.update");
  const id = idSchema.parse(fd.get("id"));
  const sectionId = idSchema.parse(fd.get("sectionId"));
  const res = storyService.removeSection(id, sectionId, user.id);
  if (!res.ok) throw new Error(res.error.message);
  revalidate(id, res.value.slug);
}

export async function moveSectionAction(fd: FormData) {
  const user = await requirePermission("story.update");
  const id = idSchema.parse(fd.get("id"));
  const sectionId = idSchema.parse(fd.get("sectionId"));
  const dir = z.enum(["up", "down"]).parse(fd.get("dir"));
  const res = storyService.moveSection(id, sectionId, dir, user.id);
  if (!res.ok) throw new Error(res.error.message);
  revalidate(id, res.value.slug);
}
