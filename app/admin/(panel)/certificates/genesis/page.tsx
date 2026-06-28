import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { PageHeader, StatusPill } from "@/components/admin/ui";
import { certificateService } from "@domains/certificate";

export default async function GenesisCollectionPage() {
  await requirePermission("certificate.read");
  const rows = certificateService.genesisCollection();
  const issued = rows.filter((r) => r.status === "issued").length;

  return (
    <div>
      <PageHeader
        title="★ Genesis Collection"
        subtitle={`The ${rows.length} founding-artist certificates — sacred historical artifacts. ${issued} issued · ${rows.length - issued} pending issuance.`}
      />

      <div className="mb-6 rounded-sm border border-border bg-mist/30 p-4 text-sm text-text-muted">
        These are not uploads. They are the institutional foundation of Planet B. The software
        preserves them — it never modifies, recreates, or replaces them. Only their digital
        relationships (master scan, verification, related story / press / media / timeline) evolve.
        The 15th founding artist is intentionally reserved (Principle VI) and is not part of the
        issued Collection.
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-text-muted">
            <th className="py-2 pr-4 font-normal">Public ID</th>
            <th className="py-2 pr-4 font-normal">Founding artist</th>
            <th className="py-2 pr-4 font-normal">Artwork</th>
            <th className="py-2 pr-4 font-normal">Status</th>
            <th className="py-2 pr-4 font-normal">Archive</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="border-b border-border/60 hover:bg-mist/40">
              <td className="py-2 pr-4 font-mono text-xs">
                <Link href={`/admin/certificates/${c.id}`} className="hover:text-accent">
                  {c.publicId}
                </Link>
              </td>
              <td className="py-2 pr-4">{c.recipientName ?? "—"}</td>
              <td className="py-2 pr-4 text-text-muted">{c.artworkTitle ?? "—"}</td>
              <td className="py-2 pr-4">
                <StatusPill status={c.status} />
              </td>
              <td className="py-2 pr-4 text-xs text-text-muted">
                {c.verificationHash ? "preserved" : "pending"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
