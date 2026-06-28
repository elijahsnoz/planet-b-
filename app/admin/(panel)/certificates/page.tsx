import { desc } from "drizzle-orm";
import { db, schema as t } from "@/db/client";
import { requirePermission } from "@/lib/auth";
import { PageHeader, StatusPill } from "@/components/admin/ui";

export default async function CertificatesAdmin() {
  await requirePermission("certificate.read");
  const people = new Map(db.select({ id: t.people.id, name: t.people.fullName }).from(t.people).all().map((p) => [p.id, p.name]));
  const orgs = new Map(db.select({ id: t.organizations.id, name: t.organizations.name }).from(t.organizations).all().map((o) => [o.id, o.name]));
  const rows = db.select().from(t.certificates).orderBy(desc(t.certificates.publicId)).all();

  return (
    <div>
      <PageHeader title="Certificates" subtitle={`${rows.length} credential(s) · contribution, not attendance · blockchain-ready`} />
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-text-muted">
            <th className="py-2 pr-4 font-normal">Public ID</th>
            <th className="py-2 pr-4 font-normal">Recipient</th>
            <th className="py-2 pr-4 font-normal">Role</th>
            <th className="py-2 pr-4 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="border-b border-border/60 hover:bg-mist/40">
              <td className="py-2 pr-4 font-mono text-xs">{c.publicId}</td>
              <td className="py-2 pr-4">
                {c.personId ? people.get(c.personId) : c.organizationId ? orgs.get(c.organizationId) : <span className="text-stone">— reserved —</span>}
              </td>
              <td className="py-2 pr-4 text-text-muted">{c.roleAtIssue}</td>
              <td className="py-2 pr-4"><StatusPill status={c.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
