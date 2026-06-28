import Link from "next/link";
import { notFound } from "next/navigation";
import { getPersonById, revisionsFor } from "@/lib/admin";
import { can, requirePermission } from "@/lib/auth";
import {
  CONSENT_OPTIONS,
  Field,
  PageHeader,
  PrimaryButton,
  STATUS_OPTIONS,
  Select,
  StatusPill,
  TextArea,
} from "@/components/admin/ui";
import { archivePersonAction, restorePersonAction, updatePersonAction } from "../actions";

export default async function EditPerson({ params }: { params: { id: string } }) {
  const user = await requirePermission("artist.read");
  const p = getPersonById(params.id);
  if (!p) notFound();
  const revisions = revisionsFor("person", p.id);
  const canUpdate = can(user, "artist.update");

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={p.fullName}
        subtitle={`${p.registryId} · /${p.slug}`}
        action={<StatusPill status={p.status} archived={!!p.archivedAt} />}
      />

      <form action={updatePersonAction} className="space-y-4">
        <input type="hidden" name="id" value={p.id} />
        <Field label="Full name" name="fullName" defaultValue={p.fullName} required />
        <Field label="Display name" name="displayName" defaultValue={p.displayName} />
        <Field label="Primary role" name="primaryRole" defaultValue={p.primaryRole} />
        <Field label="Roles (comma-separated)" name="roles" defaultValue={(p.roles ?? []).join(", ")} />
        <TextArea label="Short bio" name="shortBio" defaultValue={p.shortBio} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Consent" name="consentStatus" options={CONSENT_OPTIONS} defaultValue={p.consentStatus} />
          <Select label="Status" name="status" options={STATUS_OPTIONS} defaultValue={p.status} />
        </div>
        {canUpdate ? <PrimaryButton>Save changes</PrimaryButton> : <p className="text-sm text-stone">Read-only (no update permission).</p>}
      </form>

      <div className="mt-8 flex items-center gap-3">
        {p.archivedAt ? (
          <form action={restorePersonAction}>
            <input type="hidden" name="id" value={p.id} />
            <button className="rounded-sm border border-border px-4 py-2 text-sm hover:border-verified hover:text-verified">
              Restore
            </button>
          </form>
        ) : (
          <form action={archivePersonAction}>
            <input type="hidden" name="id" value={p.id} />
            <button className="rounded-sm border border-border px-4 py-2 text-sm hover:border-accent hover:text-accent">
              Archive
            </button>
          </form>
        )}
        {p.status === "published" && !p.archivedAt && (
          <Link href={`/artists/${p.slug}`} className="text-sm text-text-muted hover:text-accent">
            View public profile ↗
          </Link>
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
