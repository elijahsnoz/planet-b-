import "server-only";
/**
 * buildPassportView — assembles the serializable view-model the Planet Passport
 * UI (document + printable) consumes, from the Passport domain's public archive.
 * One projection, used by both the on-screen ceremony and the printable
 * credential, so the two can never drift. No new data is stored (Principle V).
 */
import { passportService } from "@domains/passport";
import { passportQrSvg } from "@/lib/qr";
import { getStoriesFeaturingCount } from "@/lib/data";
import type { PassportView } from "@/components/passport/PassportDocument";

const FOUNDER_ID = "PB-ID-000001";

/**
 * Verification base. Intentionally a placeholder until the production domain is
 * finalised — `.example` is the RFC 2606 reserved placeholder TLD (and matches
 * the app's metadataBase), so no temporary production value is ever baked in.
 * Set NEXT_PUBLIC_SITE_URL at deploy time to point QR codes at the real host.
 */
function siteBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://planetb.example").replace(/\/$/, "");
}

/** A path is a usable portrait; a bare media id (PB-MEDIA-…) has no derivative yet. */
function resolvePortrait(portraitMedia: string | null): string | null {
  return portraitMedia?.startsWith("/") ? portraitMedia : null;
}

export async function buildPassportView(idOrKey: string): Promise<PassportView | null> {
  const a = passportService.publicArchive(idOrKey);
  if (!a) return null;

  const genesis = a.isGenesisContributor || a.person.primaryRole === "Founding Artist";
  const primary = a.person.primaryRole ?? a.person.roles[0] ?? "Contributor";
  const line =
    a.passport.passportId === FOUNDER_ID
      ? "Founder · Genesis Contributor"
      : genesis
        ? `${primary} · Genesis Contributor`
        : primary;

  const verifyUrl = `${siteBase()}/verify?q=${encodeURIComponent(a.passport.passportId)}`;
  const qrSvg = await passportQrSvg(verifyUrl);

  return {
    passportId: a.passport.passportId,
    name: a.person.fullName,
    honorific: a.person.honorific,
    roles: a.person.roles,
    line,
    bio: a.person.bio ?? a.person.shortBio,
    portrait: resolvePortrait(a.person.portraitMedia),
    genesis,
    issuedOn: a.passport.createdAt,
    verified: true, // publicArchive only returns granted-consent, published people
    counts: {
      certificates: a.counts.certificates,
      artworks: a.artworks.filter((w) => w.status === "published").length,
      contributions: a.counts.contributions,
      chapters: a.counts.chapters,
      storiesFeatured: getStoriesFeaturingCount(a.person.id),
    },
    certificates: a.certificates.map((c) => ({
      id: c.id,
      role: c.roleAtIssue,
      artwork: c.artworkTitle,
      publicId: c.publicId,
      genesis: c.isGenesisCollection,
    })),
    artworks: a.artworks
      .filter((w) => w.status === "published")
      .map((w) => ({ id: w.id, title: w.title, slug: w.slug, year: w.year })),
    contributions: a.contributions.map((c) => ({
      id: c.id,
      date: c.occurredOn,
      kind: c.kind,
      title: c.title,
      description: c.description,
    })),
    chapters: a.chapters.map((c) => ({
      name: c.name,
      slug: c.slug,
      roles: c.roles ?? [],
      genesis: c.isGenesis,
    })),
    verifyUrl,
    qrSvg,
    printHref: `/passport/${a.passport.passportId}/print`,
  };
}
