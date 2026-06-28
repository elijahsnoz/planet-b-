import Link from "next/link";
import { listOrganizations } from "@/lib/admin";
import { requirePermission } from "@/lib/auth";
import { GhostLink, PageHeader, StatusPill } from "@/components/admin/ui";
import { RowActions } from "@/components/admin/RowActions";
import { deleteOrganizationAction } from "./actions";

export default async function OrganizationsList({
  searchParams,
}: {
  searchParams: { q?: string; archived?: string };
}) {
  await requirePermission("organization.read");
  const includeArchived = searchParams.archived === "1";
  const rows = listOrganizations({ q: searchParams.q, includeArchived });

  return (
    <div>
      <PageHeader
        title="Organizations & Partners"
        subtitle={`${rows.length} record(s)`}
        action={<GhostLink href="/admin/organizations/new">+ New organization</GhostLink>}
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
            <th className="py-2 pr-4 font-normal">Type</th>
            <th className="py-2 pr-4 font-normal">Role</th>
            <th className="py-2 pr-4 font-normal">Status</th>
            <th className="py-2 pr-4 text-right font-normal">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-center text-text-muted">No organizations yet.</td>
            </tr>
          )}
          {rows.map((o) => (
            <tr key={o.id} className="border-b border-border/60 hover:bg-mist/40">
              <td className="py-2 pr-4 font-mono text-xs">{o.registryId}</td>
              <td className="py-2 pr-4">
                <Link href={`/admin/organizations/${o.id}`} className="hover:text-accent">
                  {o.name}
                </Link>
              </td>
              <td className="py-2 pr-4 text-text-muted">{o.type ?? "—"}</td>
              <td className="py-2 pr-4 text-text-muted">{o.role ?? "—"}</td>
              <td className="py-2 pr-4">
                <StatusPill status={o.status} archived={!!o.archivedAt} />
              </td>
              <td className="py-2 pl-4">
                <div className="flex justify-end">
                  <RowActions
                    id={o.id}
                    name={o.name}
                    editHref={`/admin/organizations/${o.id}`}
                    viewHref={o.status === "published" && !o.archivedAt ? "/partners" : null}
                    deleteAction={deleteOrganizationAction}
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
