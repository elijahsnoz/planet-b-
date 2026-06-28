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

function parsePerson(fd: FormData) {
  return {
    fullName: String(fd.get("fullName") ?? "").trim(),
    displayName: String(fd.get("displayName") ?? "").trim() || null,
    primaryRole: String(fd.get("primaryRole") ?? "").trim() || null,
    roles: String(fd.get("roles") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    shortBio: String(fd.get("shortBio") ?? "").trim() || null,
    consentStatus: String(fd.get("consentStatus") ?? "pending"),
    status: String(fd.get("status") ?? "draft"),
  };
}

function revalidate(slug?: string | null) {
  revalidatePath("/admin/artists");
  revalidatePath("/artists");
  if (slug) revalidatePath(`/artists/${slug}`);
}

export async function createPersonAction(fd: FormData) {
  const user = await requirePermission("artist.create");
  const data = parsePerson(fd);
  if (!data.fullName) throw new Error("Full name is required.");
  const id = randomUUID();
  const registryId = mintRegistryId("artist");
  db.insert(t.people)
    .values({
      id,
      registryId,
      slug: slugify(data.fullName),
      status: data.status,
      fullName: data.fullName,
      displayName: data.displayName,
      primaryRole: data.primaryRole,
      roles: data.roles,
      shortBio: data.shortBio,
      consentStatus: data.consentStatus,
      createdBy: user.id,
      updatedBy: user.id,
    })
    .run();
  writeRevision({ entityType: "person", entityId: id, registryId, snapshot: data, changeSummary: "created", createdBy: user.id });
  writeAudit({ actor: user.id, action: "artist.create", entityType: "person", entityId: id, registryId, after: data });
  revalidate(slugify(data.fullName));
  redirect(`/admin/artists/${id}`);
}

export async function updatePersonAction(fd: FormData) {
  const user = await requirePermission("artist.update");
  const id = String(fd.get("id"));
  const before = db.select().from(t.people).where(eq(t.people.id, id)).get();
  if (!before) throw new Error("Not found.");
  const data = parsePerson(fd);
  db.update(t.people)
    .set({ ...data, updatedBy: user.id, updatedAt: new Date().toISOString() })
    .where(eq(t.people.id, id))
    .run();
  writeRevision({ entityType: "person", entityId: id, registryId: before.registryId, snapshot: before, changeSummary: "updated", createdBy: user.id });
  writeAudit({ actor: user.id, action: "artist.update", entityType: "person", entityId: id, registryId: before.registryId, before, after: data });
  revalidate(before.slug);
  redirect(`/admin/artists/${id}`);
}

const countRefs = (tbl: any, where: any) => db.select({ n: sql<number>`count(*)` }).from(tbl).where(where).get()?.n ?? 0;

export async function deletePersonAction(fd: FormData) {
  const user = await requirePermission("artist.manage");
  const id = String(fd.get("id"));
  const before = db.select().from(t.people).where(eq(t.people.id, id)).get();
  if (!before) throw new Error("Not found.");
  const refs =
    countRefs(t.artworks, eq(t.artworks.artistId, id)) +
    countRefs(t.certificates, eq(t.certificates.personId, id)) +
    countRefs(t.foundingCouncil, eq(t.foundingCouncil.personId, id));
  if (refs > 0) throw new Error(`Cannot delete “${before.fullName}” — still referenced by ${refs} record(s) (artworks, certificates or council). Archive it instead.`);
  db.delete(t.entityLinks)
    .where(or(and(eq(t.entityLinks.fromType, "person"), eq(t.entityLinks.fromId, id)), and(eq(t.entityLinks.toType, "person"), eq(t.entityLinks.toId, id))))
    .run();
  db.delete(t.people).where(eq(t.people.id, id)).run();
  writeAudit({ actor: user.id, action: "artist.delete", entityType: "person", entityId: id, registryId: before.registryId, before });
  revalidate(before.slug);
  redirect("/admin/artists");
}

export async function archivePersonAction(fd: FormData) {
  const user = await requirePermission("artist.archive");
  const id = String(fd.get("id"));
  const before = db.select().from(t.people).where(eq(t.people.id, id)).get();
  if (!before) throw new Error("Not found.");
  db.update(t.people)
    .set({ archivedAt: new Date().toISOString(), status: "archived", updatedBy: user.id })
    .where(eq(t.people.id, id))
    .run();
  writeAudit({ actor: user.id, action: "artist.archive", entityType: "person", entityId: id, registryId: before.registryId, before });
  revalidate(before.slug);
  redirect(`/admin/artists/${id}`);
}

export async function restorePersonAction(fd: FormData) {
  const user = await requirePermission("artist.restore");
  const id = String(fd.get("id"));
  const before = db.select().from(t.people).where(eq(t.people.id, id)).get();
  if (!before) throw new Error("Not found.");
  db.update(t.people)
    .set({ archivedAt: null, status: "draft", updatedBy: user.id })
    .where(eq(t.people.id, id))
    .run();
  writeAudit({ actor: user.id, action: "artist.restore", entityType: "person", entityId: id, registryId: before.registryId, before });
  revalidate(before.slug);
  redirect(`/admin/artists/${id}`);
}
