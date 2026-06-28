import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { passportService } from "@domains/passport";
import type { PassportStatus } from "@domains/passport";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "unclaimed", label: "Unclaimed" },
  { value: "claimed", label: "Claimed" },
  { value: "linked", label: "Linked" },
];

export default async function PassportsList({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  await requirePermission("passport.read");
  const rows = passportService.list({
    q: searchParams.q,
    status: (searchParams.status || undefined) as PassportStatus | undefined,
  });

  return (
    <div>
      <PageHeader
        title="Planet Passports"
        subtitle={`${rows.length} lifelong institutional identities — records of contribution`}
      />

      <form className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search name or PB-ID…"
          className="w-64 rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
        />
        <select
          name="status"
          aria-label="Filter by passport status"
          defaultValue={searchParams.status ?? ""}
          className="rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-sm border border-border px-3 py-2 hover:border-accent">Apply</button>
      </form>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-text-muted">
            <th className="py-2 pr-4 font-normal">Passport ID</th>
            <th className="py-2 pr-4 font-normal">Contributor</th>
            <th className="py-2 pr-4 font-normal">Country</th>
            <th className="py-2 pr-4 font-normal">Status</th>
            <th className="py-2 pr-4 font-normal">Certs</th>
            <th className="py-2 pr-4 font-normal">Works</th>
            <th className="py-2 pr-4 font-normal">Contrib.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-b border-border/60 hover:bg-mist/40">
              <td className="py-2 pr-4 font-mono text-xs">
                <Link href={`/admin/passports/${p.id}`} className="hover:text-accent">
                  {p.passportId}
                </Link>
                {p.isGenesisContributor && <span title="Genesis Contributor" className="ml-2 text-accent">★</span>}
              </td>
              <td className="py-2 pr-4">{p.personName}</td>
              <td className="py-2 pr-4 text-text-muted">{p.country ?? "—"}</td>
              <td className="py-2 pr-4 text-text-muted">{p.passportStatus}</td>
              <td className="py-2 pr-4 text-text-muted">{p.counts.certificates}</td>
              <td className="py-2 pr-4 text-text-muted">{p.counts.artworks}</td>
              <td className="py-2 pr-4 text-text-muted">{p.counts.contributions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
