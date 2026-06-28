import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { passportService } from "@domains/passport";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const a = passportService.publicArchive(decodeURIComponent(params.id));
  if (!a) return { title: "Planet Passport" };
  return {
    title: `${a.person.fullName} — Planet Passport`,
    description: `The lifelong Planet B contribution record of ${a.person.fullName} (${a.passport.passportId}).`,
  };
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="font-display text-2xl">
        {title}
        {count !== undefined && <span className="ml-2 text-base text-text-muted">({count})</span>}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function PublicPassport({ params }: { params: { id: string } }) {
  const a = passportService.publicArchive(decodeURIComponent(params.id));
  if (!a) notFound();

  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-xs uppercase tracking-widest text-text-muted">Planet B · Planet Passport</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl leading-tight">
          {a.person.honorific ? `${a.person.honorific} ` : ""}
          {a.person.fullName}
        </h1>
        {a.isGenesisContributor && (
          <span className="rounded-full border border-accent px-3 py-1 text-xs uppercase tracking-widest text-accent">
            Genesis Contributor
          </span>
        )}
      </div>
      <p className="mt-2 font-mono text-xs text-text-muted">{a.passport.passportId}</p>
      {a.person.roles.length > 0 && (
        <p className="mt-3 text-lg text-text-muted">{a.person.roles.join(" · ")}</p>
      )}
      {(a.person.bio ?? a.person.shortBio) && (
        <p className="mt-6 max-w-2xl text-lg leading-relaxed">{a.person.bio ?? a.person.shortBio}</p>
      )}

      <p className="mt-6 text-sm text-text-muted">
        This is a record of <em>contribution</em> — a lifelong archive that grows over time, not a
        social profile. {a.counts.certificates} certificate(s) · {a.counts.artworks} artwork(s) ·{" "}
        {a.counts.contributions} recorded contribution(s) · {a.counts.chapters} chapter(s).
      </p>

      {a.certificates.length > 0 && (
        <Section title="Certificates" count={a.counts.certificates}>
          <ul className="space-y-2">
            {a.certificates.map((c) => (
              <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/50 pb-2">
                <span>
                  <span className="font-medium">{c.roleAtIssue}</span>
                  {c.artworkTitle ? <span className="text-text-muted"> — {c.artworkTitle}</span> : null}
                  {c.isGenesisCollection && <span className="ml-2 text-accent" title="Genesis Collection">★</span>}
                </span>
                <Link href={`/verify?q=${encodeURIComponent(c.publicId)}`} className="font-mono text-xs text-text-muted hover:text-accent">
                  {c.publicId} ↗
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {a.artworks.length > 0 && (
        <Section title="Artworks" count={a.counts.artworks}>
          <ul className="space-y-2">
            {a.artworks
              .filter((w) => w.status === "published")
              .map((w) => (
                <li key={w.id} className="flex items-baseline justify-between gap-2 border-b border-border/50 pb-2">
                  <span>
                    {w.slug ? (
                      <Link href={`/artworks/${w.slug}`} className="hover:text-accent">{w.title}</Link>
                    ) : (
                      w.title
                    )}
                  </span>
                  <span className="text-text-muted">{w.year ?? ""}</span>
                </li>
              ))}
          </ul>
        </Section>
      )}

      {a.contributions.length > 0 && (
        <Section title="Contribution timeline" count={a.counts.contributions}>
          <ol className="space-y-3">
            {a.contributions.map((c) => (
              <li key={c.id} className="flex gap-4">
                <span className="w-24 shrink-0 font-mono text-xs text-text-muted">
                  {c.occurredOn?.slice(0, 10) ?? "—"}
                </span>
                <span>
                  <span className="uppercase text-xs tracking-wide text-stone">{c.kind.replace("_", " ")}</span>
                  <br />
                  {c.title}
                  {c.description && <span className="block text-sm text-text-muted">{c.description}</span>}
                </span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {a.chapters.length > 0 && (
        <Section title="Chapters" count={a.counts.chapters}>
          <ul className="space-y-2">
            {a.chapters.map((c) => (
              <li key={c.name} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/50 pb-2">
                <span>
                  {c.slug ? (
                    <Link href={`/chapters/${c.slug}`} className="hover:text-accent">{c.name}</Link>
                  ) : (
                    c.name
                  )}
                  {c.isGenesis && <span className="ml-2 text-accent" title="Genesis Chapter">★</span>}
                </span>
                <span className="text-sm text-text-muted">{(c.roles ?? []).join(" · ")}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <p className="mt-12 text-sm text-text-muted">
        Verify any certificate on the{" "}
        <Link href="/verify" className="text-accent hover:underline">verification page</Link>. Explore the{" "}
        <Link href="/chapters/abuja-2026" className="text-accent hover:underline">Genesis Chapter</Link>.
      </p>
    </main>
  );
}
