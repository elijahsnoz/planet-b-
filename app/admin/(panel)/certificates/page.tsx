import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { GhostLink, PageHeader, StatusPill } from "@/components/admin/ui";
import { certificateService } from "@domains/certificate";
import type { CertificateStatus } from "@domains/certificate";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "issued", label: "Issued" },
  { value: "revoked", label: "Revoked" },
  { value: "reserved", label: "Reserved" },
];

export default async function CertificatesRegistry({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; genesis?: string };
}) {
  await requirePermission("certificate.read");
  const genesisOnly = searchParams.genesis === "1";
  const rows = certificateService.list({
    q: searchParams.q,
    status: (searchParams.status || undefined) as CertificateStatus | undefined,
    genesisCollectionOnly: genesisOnly,
    includeReserved: true,
  });

  return (
    <div>
      <PageHeader
        title="Certificate Registry"
        subtitle={`${rows.length} record(s) — historical artifacts, preserved`}
        action={<GhostLink href="/admin/certificates/genesis">★ Genesis Collection</GhostLink>}
      />

      <form className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search public ID, registry ID, recipient, role…"
          className="w-72 rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
        />
        <select
          name="status"
          aria-label="Filter by status"
          defaultValue={searchParams.status ?? ""}
          className="rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-text-muted">
          <input type="checkbox" name="genesis" value="1" defaultChecked={genesisOnly} /> Genesis Collection only
        </label>
        <button type="submit" className="rounded-sm border border-border px-3 py-2 hover:border-accent">Apply</button>
      </form>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-text-muted">
            <th className="py-2 pr-4 font-normal">Public ID</th>
            <th className="py-2 pr-4 font-normal">Registry ID</th>
            <th className="py-2 pr-4 font-normal">Recipient</th>
            <th className="py-2 pr-4 font-normal">Role / contribution</th>
            <th className="py-2 pr-4 font-normal">Status</th>
            <th className="py-2 pr-4 font-normal">Verification</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="border-b border-border/60 hover:bg-mist/40">
              <td className="py-2 pr-4 font-mono text-xs">
                <Link href={`/admin/certificates/${c.id}`} className="hover:text-accent">
                  {c.publicId}
                </Link>
                {c.isGenesisCollection && <span title="Genesis Collection" className="ml-2 text-accent">★</span>}
              </td>
              <td className="py-2 pr-4 font-mono text-xs text-text-muted">{c.registryId}</td>
              <td className="py-2 pr-4">{c.recipientName ?? <span className="text-stone">— reserved —</span>}</td>
              <td className="py-2 pr-4 text-text-muted">{c.roleAtIssue}</td>
              <td className="py-2 pr-4">
                <StatusPill status={c.status} />
              </td>
              <td className="py-2 pr-4 text-xs text-text-muted">{c.verificationHash ? "✓ hashed" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
