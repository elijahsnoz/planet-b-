"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, or, sql } from "drizzle-orm";
import { db, schema as t } from "@/db/client";
import { requirePermission } from "@/lib/auth";
import { mintRegistryId } from "@/lib/registry";
import { writeAudit, writeRevision } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import { artworkSchema, idSchema, parseForm } from "@/lib/validation";

function parseArtwork(fd: FormData) {
  return parseForm(artworkSchema, {
    title: fd.get("title"),
    artistId: fd.get("artistId"),
    medium: fd.get("medium"),
    dimensions: fd.get("dimensions"),
    year: fd.get("year"),
    statement: fd.get("statement"),
    significance: fd.get("significance"),
    materials: fd.get("materials"),
    status: fd.get("status"),
  });
}

function revalidate(slug?: string | null) {
  revalidatePath("/admin/artworks");
  revalidatePath("/artworks");
  if (slug) revalidatePath(`/artworks/${slug}`);
}

export async function createArtworkAction(fd: FormData) {
  const user = await requirePermission("artwork.create");
  const data = parseArtwork(fd);
  if (!data.title) throw new Error("Title is required.");
  const id = randomUUID();
  const registryId = mintRegistryId("artwork");
  const genesis = db.select({ id: t.chapters.id }).from(t.chapters).where(eq(t.chapters.isGenesis, true)).get();
  db.insert(t.artworks)
    .values({ id, registryId, slug: slugify(data.title), chapterId: genesis?.id, createdBy: user.id, updatedBy: user.id, ...data })
    .run();
  writeRevision({ entityType: "artwork", entityId: id, registryId, snapshot: data, changeSummary: "created", createdBy: user.id });
  writeAudit({ actor: user.id, action: "artwork.create", entityType: "artwork", entityId: id, registryId, after: data });
  revalidate(slugify(data.title));
  redirect(`/admin/artworks/${id}`);
}

export async function updateArtworkAction(fd: FormData) {
  const user = await requirePermission("artwork.update");
  const id = parseForm(idSchema, fd.get("id"));
  const before = db.select().from(t.artworks).where(eq(t.artworks.id, id)).get();
  if (!before) throw new Error("Not found.");
  const data = parseArtwork(fd);
  db.update(t.artworks).set({ ...data, updatedBy: user.id, updatedAt: new Date().toISOString() }).where(eq(t.artworks.id, id)).run();
  writeRevision({ entityType: "artwork", entityId: id, registryId: before.registryId, snapshot: before, changeSummary: "updated", createdBy: user.id });
  writeAudit({ actor: user.id, action: "artwork.update", entityType: "artwork", entityId: id, registryId: before.registryId, before, after: data });
  revalidate(before.slug);
  redirect(`/admin/artworks/${id}`);
}

const countRefs = (tbl: any, where: any) => db.select({ n: sql<number>`count(*)` }).from(tbl).where(where).get()?.n ?? 0;

export async function deleteArtworkAction(fd: FormData) {
  const user = await requirePermission("artwork.manage");
  const id = parseForm(idSchema, fd.get("id"));
  const before = db.select().from(t.artworks).where(eq(t.artworks.id, id)).get();
  if (!before) throw new Error("Not found.");
  const refs = countRefs(t.certificates, eq(t.certificates.artworkId, id));
  if (refs > 0) throw new Error(`Cannot delete “${before.title}” — still referenced by ${refs} certificate(s). Archive it instead.`);
  db.delete(t.entityLinks)
    .where(or(and(eq(t.entityLinks.fromType, "artwork"), eq(t.entityLinks.fromId, id)), and(eq(t.entityLinks.toType, "artwork"), eq(t.entityLinks.toId, id))))
    .run();
  db.delete(t.artworks).where(eq(t.artworks.id, id)).run();
  writeAudit({ actor: user.id, action: "artwork.delete", entityType: "artwork", entityId: id, registryId: before.registryId, before });
  revalidate(before.slug);
  redirect("/admin/artworks");
}

export async function archiveArtworkAction(fd: FormData) {
  const user = await requirePermission("artwork.archive");
  const id = parseForm(idSchema, fd.get("id"));
  const before = db.select().from(t.artworks).where(eq(t.artworks.id, id)).get();
  if (!before) throw new Error("Not found.");
  db.update(t.artworks).set({ archivedAt: new Date().toISOString(), status: "archived", updatedBy: user.id }).where(eq(t.artworks.id, id)).run();
  writeAudit({ actor: user.id, action: "artwork.archive", entityType: "artwork", entityId: id, registryId: before.registryId, before });
  revalidate(before.slug);
  redirect(`/admin/artworks/${id}`);
}

export async function restoreArtworkAction(fd: FormData) {
  const user = await requirePermission("artwork.restore");
  const id = parseForm(idSchema, fd.get("id"));
  const before = db.select().from(t.artworks).where(eq(t.artworks.id, id)).get();
  if (!before) throw new Error("Not found.");
  db.update(t.artworks).set({ archivedAt: null, status: "draft", updatedBy: user.id }).where(eq(t.artworks.id, id)).run();
  writeAudit({ actor: user.id, action: "artwork.restore", entityType: "artwork", entityId: id, registryId: before.registryId, before });
  revalidate(before.slug);
  redirect(`/admin/artworks/${id}`);
}
