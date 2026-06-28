import Link from "next/link";
import { listArtworks } from "@/lib/admin";
import { requirePermission } from "@/lib/auth";
import { GhostLink, PageHeader, StatusPill } from "@/components/admin/ui";
import { RowActions } from "@/components/admin/RowActions";
import { deleteArtworkAction } from "./actions";

export default async function ArtworksList({
  searchParams,
}: {
  searchParams: { q?: string; archived?: string };
}) {
  await requirePermission("artwork.read");
  const includeArchived = searchParams.archived === "1";
  const rows = listArtworks({ q: searchParams.q, includeArchived });

  return (
    <div>
      <PageHeader
        title="Artworks"
        subtitle={`${rows.length} record(s)`}
        action={<GhostLink href="/admin/artworks/new">+ New artwork</GhostLink>}
      />

      <form className="mb-4 flex items-center gap-3 text-sm">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search title or registry ID…"
          className="w-64 rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
        />
        <label className="flex items-center gap-2 text-text-muted">
          <input type="checkbox" name="archived" value="1" defaultChecked={includeArchived} /> show archived
        </label>
        <button className="rounded-sm border border-border px-3 py-2 hover:border-accent">Apply</button>
      </form>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-text-muted">
            <th className="py-2 pr-4 font-normal">Registry ID</th>
            <th className="py-2 pr-4 font-normal">Title</th>
            <th className="py-2 pr-4 font-normal">Artist</th>
            <th className="py-2 pr-4 font-normal">Year</th>
            <th className="py-2 pr-4 font-normal">Status</th>
            <th className="py-2 pr-4 text-right font-normal">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="border-b border-border/60 hover:bg-mist/40">
              <td className="py-2 pr-4 font-mono text-xs">{a.registryId}</td>
              <td className="py-2 pr-4">
                <Link href={`/admin/artworks/${a.id}`} className="hover:text-accent">
                  {a.title}
                </Link>
              </td>
              <td className="py-2 pr-4 text-text-muted">{a.artistName}</td>
              <td className="py-2 pr-4 text-text-muted">{a.year}</td>
              <td className="py-2 pr-4">
                <StatusPill status={a.status} archived={!!a.archivedAt} />
              </td>
              <td className="py-2 pl-4">
                <div className="flex justify-end">
                  <RowActions
                    id={a.id}
                    name={a.title}
                    editHref={`/admin/artworks/${a.id}`}
                    viewHref={a.status === "published" && !a.archivedAt ? `/artworks/${a.slug}` : null}
                    deleteAction={deleteArtworkAction}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
