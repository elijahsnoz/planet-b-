import { AdminShell } from "@/components/admin/AdminShell";
import { can, requireUser } from "@/lib/auth";
import { logoutAction } from "./actions";

const NAV: { href: string; label: string; perm?: string; star?: boolean }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/chapters", label: "Genesis Chapter", perm: "chapter.read", star: true },
  { href: "/admin/passports", label: "Planet Passports", perm: "passport.read" },
  { href: "/admin/artists", label: "Artists", perm: "artist.read" },
  { href: "/admin/artworks", label: "Artworks", perm: "artwork.read" },
  { href: "/admin/stories", label: "Stories", perm: "story.read" },
  { href: "/admin/organizations", label: "Organizations", perm: "organization.read" },
  { href: "/admin/media", label: "Media Library", perm: "media.read" },
  { href: "/admin/certificates", label: "Certificates", perm: "certificate.read" },
  { href: "/admin/certificates/genesis", label: "Genesis Collection", perm: "certificate.read", star: true },
  { href: "/admin/verifications", label: "Verification Queue", perm: "verification.read" },
  { href: "/admin/audit", label: "System Logs", perm: "audit.read" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const items = NAV.filter((i) => !i.perm || can(user, i.perm)).map(({ href, label, star }) => ({
    href,
    label,
    star,
  }));

  return (
    <AdminShell
      items={items}
      userLabel={user.displayName ?? user.email}
      roles={user.roles.join(", ")}
      logoutAction={logoutAction}
    >
      {children}
    </AdminShell>
  );
}
