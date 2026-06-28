import Link from "next/link";
import { PlanetBMark } from "@/components/PlanetBMark";
import { can, requireUser } from "@/lib/auth";
import { logoutAction } from "./actions";

const NAV: { href: string; label: string; perm?: string; star?: boolean }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/chapters", label: "Genesis Chapter", perm: "chapter.read", star: true },
  { href: "/admin/passports", label: "Planet Passports", perm: "passport.read" },
  { href: "/admin/artists", label: "Artists", perm: "artist.read" },
  { href: "/admin/artworks", label: "Artworks", perm: "artwork.read" },
  { href: "/admin/organizations", label: "Organizations", perm: "organization.read" },
  { href: "/admin/media", label: "Media Library", perm: "media.read" },
  { href: "/admin/certificates", label: "Certificates", perm: "certificate.read" },
  { href: "/admin/certificates/genesis", label: "Genesis Collection", perm: "certificate.read", star: true },
  { href: "/admin/verifications", label: "Verification Queue", perm: "verification.read" },
  { href: "/admin/audit", label: "System Logs", perm: "audit.read" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const items = NAV.filter((i) => !i.perm || can(user, i.perm));

  return (
    <div className="pb-admin grid min-h-screen grid-cols-[240px_1fr] bg-bg text-text">
      <aside className="border-r border-border bg-ink/[0.02] p-4">
        <Link href="/admin" className="mb-6 flex items-center gap-2 text-accent">
          <PlanetBMark size={26} />
          <span className="font-display text-lg text-text">Planet&nbsp;B</span>
        </Link>
        <nav>
          <ul className="space-y-1 text-sm">
            {items.map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  className="flex items-center justify-between rounded-sm px-3 py-2 text-text-muted transition-colors hover:bg-mist hover:text-text"
                >
                  <span>{i.label}</span>
                  {i.star && <span title="Sacred — never deleted" className="text-accent">★</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-3">
          <p className="text-xs uppercase tracking-widest text-text-muted">Collections Management</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-text-muted">
              {user.displayName ?? user.email}{" "}
              <span className="text-stone">· {user.roles.join(", ")}</span>
            </span>
            <form action={logoutAction}>
              <button className="rounded-sm border border-border px-3 py-1 transition-colors hover:border-accent hover:text-accent">
                Sign out
              </button>
            </form>
          </div>
        </header>
        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
