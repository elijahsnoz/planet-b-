import Link from "next/link";
import { notFound } from "next/navigation";
import { artistOptions, getArtworkById, revisionsFor } from "@/lib/admin";
import { can, requirePermission } from "@/lib/auth";
import { Field, PageHeader, PrimaryButton, STATUS_OPTIONS, Select, StatusPill, TextArea } from "@/components/admin/ui";
import { archiveArtworkAction, restoreArtworkAction, updateArtworkAction } from "../actions";
import { artworkService, addProvenanceAction, archiveProvenanceAction, PROVENANCE_KINDS } from "@domains/artwork";

export default async function EditArtwork({ params }: { params: { id: string } }) {
  const user = await requirePermission("artwork.read");
  const a = getArtworkById(params.id);
  if (!a) notFound();
  const artists = artistOptions();
  const revisions = revisionsFor("artwork", a.id);
  const canUpdate = can(user, "artwork.update");
  const provenance = artworkService.listProvenance(a.id);

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
        <h2 className="font-display text-lg">Provenance</h2>
        <p className="text-xs text-text-muted">The accumulating life of this object — never overwritten, only added to.</p>
        <ol className="mt-3 space-y-2">
          {provenance.length === 0 && <li className="text-stone text-sm">No provenance recorded yet.</li>}
          {provenance.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 border-b border-border/50 py-1 text-sm">
              <span>
                <span className="uppercase text-xs tracking-wide text-stone">{e.kind}</span>
                {e.occurredOn ? <span className="text-text-muted"> · {e.occurredOn.slice(0, 10)}</span> : null} · {e.title}
                {e.description ? <span className="block text-xs text-text-muted">{e.description}</span> : null}
              </span>
              {canUpdate && (
                <form action={archiveProvenanceAction}>
                  <input type="hidden" name="id" value={e.id} />
                  <input type="hidden" name="artworkId" value={a.id} />
                  <button type="submit" className="text-xs text-stone hover:text-accent">remove</button>
                </form>
              )}
            </li>
          ))}
        </ol>
        {canUpdate && (
          <form action={addProvenanceAction} className="mt-4 grid grid-cols-2 gap-2 rounded-sm border border-border p-4 text-sm">
            <input type="hidden" name="artworkId" value={a.id} />
            <label><span className="text-text-muted">Kind</span>
              <select name="kind" className="mt-1 w-full rounded-sm border border-border bg-transparent px-2 py-1.5 outline-none focus:border-accent">
                {PROVENANCE_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select></label>
            <label><span className="text-text-muted">Date (optional)</span>
              <input name="occurredOn" type="date" className="mt-1 w-full rounded-sm border border-border bg-transparent px-2 py-1.5 outline-none focus:border-accent" /></label>
            <label className="col-span-2"><span className="text-text-muted">Title</span>
              <input name="title" required className="mt-1 w-full rounded-sm border border-border bg-transparent px-2 py-1.5 outline-none focus:border-accent" /></label>
            <label className="col-span-2"><span className="text-text-muted">Description</span>
              <textarea name="description" rows={2} className="mt-1 w-full rounded-sm border border-border bg-transparent px-2 py-1.5 outline-none focus:border-accent" /></label>
            <label className="col-span-2"><span className="text-text-muted">Source (provenance of the fact)</span>
              <input name="source" className="mt-1 w-full rounded-sm border border-border bg-transparent px-2 py-1.5 outline-none focus:border-accent" /></label>
            <div className="col-span-2"><button type="submit" className="rounded-sm border border-border px-3 py-1.5 hover:border-accent">Add provenance event</button></div>
          </form>
        )}
      </section>

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
