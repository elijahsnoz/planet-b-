import { notFound } from "next/navigation";
import { getOrganizationById, revisionsFor } from "@/lib/admin";
import { can, requirePermission } from "@/lib/auth";
import {
  Field,
  PageHeader,
  PrimaryButton,
  STATUS_OPTIONS,
  Select,
  StatusPill,
  TextArea,
} from "@/components/admin/ui";
import { archiveOrganizationAction, restoreOrganizationAction, updateOrganizationAction } from "../actions";

export default async function EditOrganization({ params }: { params: { id: string } }) {
  const user = await requirePermission("organization.read");
  const o = getOrganizationById(params.id);
  if (!o) notFound();
  const revisions = revisionsFor("organization", o.id);
  const canUpdate = can(user, "organization.update");

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={o.name}
        subtitle={`${o.registryId} · /${o.slug}`}
        action={<StatusPill status={o.status} archived={!!o.archivedAt} />}
      />

      <form action={updateOrganizationAction} className="space-y-4">
        <input type="hidden" name="id" value={o.id} />
        <Field label="Name" name="name" defaultValue={o.name} required />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type" name="type" defaultValue={o.type} />
          <Field label="Role" name="role" defaultValue={o.role} />
        </div>
        <TextArea label="About" name="about" defaultValue={o.about} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Website" name="website" defaultValue={o.website} />
          <Field label="Established" name="established" defaultValue={o.established} />
        </div>
        <Field label="Logo media" name="logoMedia" defaultValue={o.logoMedia} />
        <Select label="Status" name="status" options={STATUS_OPTIONS} defaultValue={o.status} />
        {canUpdate ? <PrimaryButton>Save changes</PrimaryButton> : <p className="text-sm text-stone">Read-only (no update permission).</p>}
      </form>

      <div className="mt-8 flex items-center gap-3">
        {o.archivedAt ? (
          <form action={restoreOrganizationAction}>
            <input type="hidden" name="id" value={o.id} />
            <button className="rounded-sm border border-border px-4 py-2 text-sm hover:border-verified hover:text-verified">
              Restore
            </button>
          </form>
        ) : (
          <form action={archiveOrganizationAction}>
            <input type="hidden" name="id" value={o.id} />
            <button className="rounded-sm border border-border px-4 py-2 text-sm hover:border-accent hover:text-accent">
              Archive
            </button>
          </form>
        )}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg">Version history</h2>
        <ul className="mt-3 space-y-1 text-sm text-text-muted">
          {revisions.length === 0 && <li>No revisions yet.</li>}
          {revisions.map((r) => (
            <li key={r.id} className="flex justify-between gap-3">
              <span>v{r.version} · {r.changeSummary ?? "—"}</span>
              <span className="text-stone">{r.createdAt.slice(0, 16).replace("T", " ")}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
