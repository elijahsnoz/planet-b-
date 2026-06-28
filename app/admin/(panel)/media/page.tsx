import { listMedia } from "@/lib/admin";
import { requirePermission } from "@/lib/auth";
import { PageHeader, StatusPill } from "@/components/admin/ui";

export default async function MediaLibrary() {
  await requirePermission("media.read");
  const rows = listMedia();
  return (
    <div>
      <PageHeader title="Media Library" subtitle={`${rows.length} asset(s) · masters preserved, derivatives regenerable`} />
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-text-muted">
            <th className="py-2 pr-4 font-normal">Registry ID</th>
            <th className="py-2 pr-4 font-normal">Title</th>
            <th className="py-2 pr-4 font-normal">Kind</th>
            <th className="py-2 pr-4 font-normal">Source</th>
            <th className="py-2 pr-4 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id} className="border-b border-border/60 hover:bg-mist/40">
              <td className="py-2 pr-4 font-mono text-xs">{m.registryId}</td>
              <td className="py-2 pr-4">{m.title ?? m.slug}</td>
              <td className="py-2 pr-4 text-text-muted">{m.kind}</td>
              <td className="py-2 pr-4 text-text-muted">{m.source ?? "—"}</td>
              <td className="py-2 pr-4"><StatusPill status={m.status} archived={!!m.archivedAt} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6 text-xs text-text-muted">Upload + derivative pipeline arrives next (docs/architecture/05). This view is read-only.</p>
    </div>
  );
}
