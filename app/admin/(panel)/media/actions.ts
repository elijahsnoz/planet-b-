"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema as t } from "@/db/client";
import { requirePermission } from "@/lib/auth";
import { mintRegistryId } from "@/lib/registry";
import { writeAudit, writeRevision } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import { mediaSchema, idSchema, parseForm } from "@/lib/validation";
import { processImageUpload } from "@/lib/media-upload";

function parseMedia(fd: FormData) {
  return parseForm(mediaSchema, {
    title: fd.get("title"),
    description: fd.get("description"),
    altText: fd.get("altText"),
    caption: fd.get("caption"),
    credit: fd.get("credit"),
    source: fd.get("source"),
    license: fd.get("license"),
    author: fd.get("author"),
    copyright: fd.get("copyright"),
    captureDate: fd.get("captureDate"),
    location: fd.get("location"),
    tags: fd.get("tags"),
    status: fd.get("status"),
  });
}

/** A readable, collision-free slug: a title stem (or "image") + a short unique tail. */
function mediaSlug(title: string | null, id: string) {
  const stem = title ? slugify(title) : "image";
  return `${stem || "image"}-${id.slice(0, 8)}`;
}

export async function uploadMediaAction(fd: FormData) {
  const user = await requirePermission("media.upload");
  const file = fd.get("file");
  const data = parseMedia(fd);
  const id = randomUUID();
  const registryId = mintRegistryId("media");

  // Process + store the picture first; if it isn't a valid image this throws and
  // no half-record is written.
  const img = await processImageUpload(file as File, id);

  db.insert(t.media)
    .values({
      id,
      registryId,
      slug: mediaSlug(data.title, id),
      kind: "image",
      storagePath: img.storagePath,
      masterPath: img.storagePath,
      sha256: img.sha256,
      bytes: img.bytes,
      mime: img.mime,
      width: img.width,
      height: img.height,
      createdBy: user.id,
      updatedBy: user.id,
      ...data,
    })
    .run();

  writeRevision({ entityType: "media", entityId: id, registryId, snapshot: { ...data, ...img }, changeSummary: "uploaded", createdBy: user.id });
  writeAudit({ actor: user.id, action: "media.upload", entityType: "media", entityId: id, registryId, after: { ...data, storagePath: img.storagePath } });
  revalidatePath("/admin/media");
  redirect(`/admin/media/${id}`);
}

export async function updateMediaAction(fd: FormData) {
  const user = await requirePermission("media.update");
  const id = parseForm(idSchema, fd.get("id"));
  const before = db.select().from(t.media).where(eq(t.media.id, id)).get();
  if (!before) throw new Error("Not found.");
  const data = parseMedia(fd);
  db.update(t.media)
    .set({ ...data, updatedBy: user.id, updatedAt: new Date().toISOString() })
    .where(eq(t.media.id, id))
    .run();
  writeRevision({ entityType: "media", entityId: id, registryId: before.registryId, snapshot: before, changeSummary: "updated", createdBy: user.id });
  writeAudit({ actor: user.id, action: "media.update", entityType: "media", entityId: id, registryId: before.registryId, before, after: data });
  revalidatePath("/admin/media");
  redirect(`/admin/media/${id}`);
}

/** Swap the picture on an existing record, keeping its identity and metadata. */
export async function replaceMediaImageAction(fd: FormData) {
  const user = await requirePermission("media.upload");
  const id = parseForm(idSchema, fd.get("id"));
  const before = db.select().from(t.media).where(eq(t.media.id, id)).get();
  if (!before) throw new Error("Not found.");
  const img = await processImageUpload(fd.get("file") as File, id);
  db.update(t.media)
    .set({
      storagePath: img.storagePath,
      masterPath: img.storagePath,
      sha256: img.sha256,
      bytes: img.bytes,
      mime: img.mime,
      width: img.width,
      height: img.height,
      updatedBy: user.id,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(t.media.id, id))
    .run();
  writeAudit({ actor: user.id, action: "media.replace", entityType: "media", entityId: id, registryId: before.registryId, before, after: { storagePath: img.storagePath } });
  revalidatePath("/admin/media");
  redirect(`/admin/media/${id}`);
}

export async function archiveMediaAction(fd: FormData) {
  const user = await requirePermission("media.archive");
  const id = parseForm(idSchema, fd.get("id"));
  const before = db.select().from(t.media).where(eq(t.media.id, id)).get();
  if (!before) throw new Error("Not found.");
  db.update(t.media)
    .set({ archivedAt: new Date().toISOString(), status: "archived", updatedBy: user.id })
    .where(eq(t.media.id, id))
    .run();
  writeAudit({ actor: user.id, action: "media.archive", entityType: "media", entityId: id, registryId: before.registryId, before });
  revalidatePath("/admin/media");
  redirect(`/admin/media/${id}`);
}

export async function restoreMediaAction(fd: FormData) {
  const user = await requirePermission("media.restore");
  const id = parseForm(idSchema, fd.get("id"));
  const before = db.select().from(t.media).where(eq(t.media.id, id)).get();
  if (!before) throw new Error("Not found.");
  db.update(t.media)
    .set({ archivedAt: null, status: "draft", updatedBy: user.id })
    .where(eq(t.media.id, id))
    .run();
  writeAudit({ actor: user.id, action: "media.restore", entityType: "media", entityId: id, registryId: before.registryId, before });
  revalidatePath("/admin/media");
  redirect(`/admin/media/${id}`);
}
