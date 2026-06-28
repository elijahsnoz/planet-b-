import Link from "next/link";
import { listPeople } from "@/lib/admin";
import { requirePermission } from "@/lib/auth";
import { GhostLink, PageHeader, StatusPill } from "@/components/admin/ui";

export default async function ArtistsList({
  searchParams,
}: {
  searchParams: { q?: string; archived?: string };
}) {
  await requirePermission("artist.read");
  const includeArchived = searchParams.archived === "1";
  const rows = listPeople({ q: searchParams.q, includeArchived });

  return (
    <div>
      <PageHeader
        title="Artists & People"
        subtitle={`${rows.length} record(s)`}
        action={<GhostLink href="/admin/artists/new">+ New person</GhostLink>}
      />

      <form className="mb-4 flex items-center gap-3 text-sm">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search name or registry ID…"
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
            <th className="py-2 pr-4 font-normal">Name</th>
            <th className="py-2 pr-4 font-normal">Role</th>
            <th className="py-2 pr-4 font-normal">Consent</th>
            <th className="py-2 pr-4 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-b border-border/60 hover:bg-mist/40">
              <td className="py-2 pr-4 font-mono text-xs">{p.registryId}</td>
              <td className="py-2 pr-4">
                <Link href={`/admin/artists/${p.id}`} className="hover:text-accent">
                  {p.fullName}
                </Link>
              </td>
              <td className="py-2 pr-4 text-text-muted">{p.primaryRole ?? "—"}</td>
              <td className="py-2 pr-4 text-text-muted">{p.consentStatus}</td>
              <td className="py-2 pr-4">
                <StatusPill status={p.status} archived={!!p.archivedAt} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
