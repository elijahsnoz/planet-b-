import Link from "next/link";
import { notFound } from "next/navigation";
import { artistOptions, getArtworkById, revisionsFor } from "@/lib/admin";
import { can, requirePermission } from "@/lib/auth";
import { Field, PageHeader, PrimaryButton, STATUS_OPTIONS, Select, StatusPill, TextArea } from "@/components/admin/ui";
import { archiveArtworkAction, restoreArtworkAction, updateArtworkAction } from "../actions";

export default async function EditArtwork({ params }: { params: { id: string } }) {
  const user = await requirePermission("artwork.read");
  const a = getArtworkById(params.id);
  if (!a) notFound();
  const artists = artistOptions();
  const revisions = revisionsFor("artwork", a.id);
  const canUpdate = can(user, "artwork.update");

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={a.title}
        subtitle={`${a.registryId} · /${a.slug}`}
        action={<StatusPill status={a.status} archived={!!a.archivedAt} />}
      />

      <form action={updateArtworkAction} className="space-y-4">
        <input type="hidden" name="id" value={a.id} />
        <Field label="Title" name="title" defaultValue={a.title} required />
        <Select
          label="Artist"
          name="artistId"
          options={artists.map((x) => ({ value: x.id, label: x.name }))}
          defaultValue={a.artistId ?? undefined}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Medium" name="medium" defaultValue={a.medium} />
          <Field label="Dimensions" name="dimensions" defaultValue={a.dimensions} />
        </div>
        <Field label="Year" name="year" type="number" defaultValue={a.year} />
        <Field label="Materials (comma-separated)" name="materials" defaultValue={(a.materials ?? []).join(", ")} />
        <TextArea label="Artist statement" name="statement" defaultValue={a.statement} />
        <TextArea label="Significance" name="significance" defaultValue={a.significance} rows={3} />
        <Select label="Status" name="status" options={STATUS_OPTIONS} defaultValue={a.status} />
        {canUpdate ? <PrimaryButton>Save changes</PrimaryButton> : <p className="text-sm text-stone">Read-only (no update permission).</p>}
      </form>

      <div className="mt-8 flex items-center gap-3">
        {a.archivedAt ? (
          <form action={restoreArtworkAction}>
            <input type="hidden" name="id" value={a.id} />
            <button className="rounded-sm border border-border px-4 py-2 text-sm hover:border-verified hover:text-verified">Restore</button>
          </form>
        ) : (
          <form action={archiveArtworkAction}>
            <input type="hidden" name="id" value={a.id} />
            <button className="rounded-sm border border-border px-4 py-2 text-sm hover:border-accent hover:text-accent">Archive</button>
          </form>
        )}
        {a.status === "published" && !a.archivedAt && (
          <Link href={`/artworks/${a.slug}`} className="text-sm text-text-muted hover:text-accent">
            View public record ↗
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
