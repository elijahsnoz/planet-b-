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

function parseOrganization(fd: FormData) {
  return {
    name: String(fd.get("name") ?? "").trim(),
    type: String(fd.get("type") ?? "").trim() || null,
    role: String(fd.get("role") ?? "").trim() || null,
    about: String(fd.get("about") ?? "").trim() || null,
    website: String(fd.get("website") ?? "").trim() || null,
    logoMedia: String(fd.get("logoMedia") ?? "").trim() || null,
    established: String(fd.get("established") ?? "").trim() || null,
    status: String(fd.get("status") ?? "draft"),
  };
}

function revalidate(slug?: string | null) {
  revalidatePath("/admin/organizations");
  revalidatePath("/partners");
  if (slug) revalidatePath(`/partners/${slug}`);
}

export async function createOrganizationAction(fd: FormData) {
  const user = await requirePermission("organization.create");
  const data = parseOrganization(fd);
  if (!data.name) throw new Error("Name is required.");
  const id = randomUUID();
  const registryId = mintRegistryId("org");
  db.insert(t.organizations)
    .values({
      id,
      registryId,
      slug: slugify(data.name),
      createdBy: user.id,
      updatedBy: user.id,
      ...data,
    })
    .run();
  writeRevision({ entityType: "organization", entityId: id, registryId, snapshot: data, changeSummary: "created", createdBy: user.id });
  writeAudit({ actor: user.id, action: "organization.create", entityType: "organization", entityId: id, registryId, after: data });
  revalidate(slugify(data.name));
  redirect(`/admin/organizations/${id}`);
}

export async function updateOrganizationAction(fd: FormData) {
  const user = await requirePermission("organization.update");
  const id = String(fd.get("id"));
  const before = db.select().from(t.organizations).where(eq(t.organizations.id, id)).get();
  if (!before) throw new Error("Not found.");
  const data = parseOrganization(fd);
  db.update(t.organizations)
    .set({ ...data, updatedBy: user.id, updatedAt: new Date().toISOString() })
    .where(eq(t.organizations.id, id))
    .run();
  writeRevision({ entityType: "organization", entityId: id, registryId: before.registryId, snapshot: before, changeSummary: "updated", createdBy: user.id });
  writeAudit({ actor: user.id, action: "organization.update", entityType: "organization", entityId: id, registryId: before.registryId, before, after: data });
  revalidate(before.slug);
  redirect(`/admin/organizations/${id}`);
}

const countRefs = (tbl: any, where: any) => db.select({ n: sql<number>`count(*)` }).from(tbl).where(where).get()?.n ?? 0;

export async function deleteOrganizationAction(fd: FormData) {
  const user = await requirePermission("organization.manage");
  const id = String(fd.get("id"));
  const before = db.select().from(t.organizations).where(eq(t.organizations.id, id)).get();
  if (!before) throw new Error("Not found.");
  const refs = countRefs(t.certificates, eq(t.certificates.organizationId, id));
  if (refs > 0) throw new Error(`Cannot delete “${before.name}” — still referenced by ${refs} certificate(s). Archive it instead.`);
  db.delete(t.entityLinks)
    .where(or(and(eq(t.entityLinks.fromType, "organization"), eq(t.entityLinks.fromId, id)), and(eq(t.entityLinks.toType, "organization"), eq(t.entityLinks.toId, id))))
    .run();
  db.delete(t.organizations).where(eq(t.organizations.id, id)).run();
  writeAudit({ actor: user.id, action: "organization.delete", entityType: "organization", entityId: id, registryId: before.registryId, before });
  revalidate(before.slug);
  redirect("/admin/organizations");
}

export async function archiveOrganizationAction(fd: FormData) {
  const user = await requirePermission("organization.archive");
  const id = String(fd.get("id"));
  const before = db.select().from(t.organizations).where(eq(t.organizations.id, id)).get();
  if (!before) throw new Error("Not found.");
  db.update(t.organizations)
    .set({ archivedAt: new Date().toISOString(), status: "archived", updatedBy: user.id })
    .where(eq(t.organizations.id, id))
    .run();
  writeAudit({ actor: user.id, action: "organization.archive", entityType: "organization", entityId: id, registryId: before.registryId, before });
  revalidate(before.slug);
  redirect(`/admin/organizations/${id}`);
}

export async function restoreOrganizationAction(fd: FormData) {
  const user = await requirePermission("organization.restore");
  const id = String(fd.get("id"));
  const before = db.select().from(t.organizations).where(eq(t.organizations.id, id)).get();
  if (!before) throw new Error("Not found.");
  db.update(t.organizations)
    .set({ archivedAt: null, status: "draft", updatedBy: user.id })
    .where(eq(t.organizations.id, id))
    .run();
  writeAudit({ actor: user.id, action: "organization.restore", entityType: "organization", entityId: id, registryId: before.registryId, before });
  revalidate(before.slug);
  redirect(`/admin/organizations/${id}`);
}
