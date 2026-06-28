import Link from "next/link";
import { dashboardCounts } from "@/lib/admin";
import { recentAudit } from "@/lib/audit";

export default function AdminDashboard() {
  const c = dashboardCounts();
  const audit = recentAudit(8);
  const stats = [
    { label: "Artists", value: c.artists, href: "/admin/artists" },
    { label: "Artworks", value: c.artworks, href: "/admin/artworks" },
    { label: "Media", value: c.media, href: "/admin/media" },
    { label: "Organizations", value: c.organizations, href: "/admin/artists" },
    { label: "Certificates", value: c.certificates, href: "/admin/certificates" },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl">Dashboard</h1>
        <p className="mt-1 text-text-muted">The state of the archive.</p>
      </div>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="block rounded-sm border border-border p-4 transition-colors hover:border-accent">
              <p className="font-display text-3xl">{s.value}</p>
              <p className="mt-1 text-sm text-text-muted">{s.label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-sm border border-border p-5">
          <h2 className="font-display text-lg">Needs attention</h2>
          <ul className="mt-3 space-y-2 text-sm text-text-muted">
            <li>{c.draftArtworks} artwork(s) in draft</li>
            <li>{c.pendingConsent} person profile(s) awaiting consent</li>
            <li>1 founding-artist seat reserved (the unverified 15th)</li>
          </ul>
        </section>
        <section className="rounded-sm border border-border p-5">
          <h2 className="font-display text-lg">Recent activity</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {audit.length === 0 && <li className="text-text-muted">No activity yet.</li>}
            {audit.map((a) => (
              <li key={a.id} className="flex justify-between gap-3">
                <span className="text-text-muted">
                  <span className="font-mono text-xs">{a.action}</span> {a.registryId ?? a.entityId ?? ""}
                </span>
                <span className="shrink-0 text-stone">{a.createdAt.slice(0, 16).replace("T", " ")}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
