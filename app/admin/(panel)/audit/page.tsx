import { db, schema as t } from "@/db/client";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/auth";
import { recentAudit } from "@/lib/audit";
import { PageHeader } from "@/components/admin/ui";

export default async function AuditLog() {
  await requirePermission("audit.read");
  const rows = recentAudit(200);
  const users = new Map(db.select({ id: t.users.id, name: t.users.displayName, email: t.users.email }).from(t.users).all().map((u) => [u.id, u.name ?? u.email]));

  return (
    <div>
      <PageHeader title="System Logs" subtitle={`${rows.length} most recent audit entries · immutable`} />
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-text-muted">
            <th className="py-2 pr-4 font-normal">When</th>
            <th className="py-2 pr-4 font-normal">Actor</th>
            <th className="py-2 pr-4 font-normal">Action</th>
            <th className="py-2 pr-4 font-normal">Entity</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={4} className="py-4 text-text-muted">No activity yet. Make an edit to see it logged here.</td></tr>
          )}
          {rows.map((a) => (
            <tr key={a.id} className="border-b border-border/60">
              <td className="py-2 pr-4 text-stone">{a.createdAt.slice(0, 19).replace("T", " ")}</td>
              <td className="py-2 pr-4 text-text-muted">{a.actor ? users.get(a.actor) ?? a.actor : "—"}</td>
              <td className="py-2 pr-4 font-mono text-xs">{a.action}</td>
              <td className="py-2 pr-4 text-text-muted">{a.registryId ?? a.entityId ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
