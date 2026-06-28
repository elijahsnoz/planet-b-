import Link from "next/link";
import { notFound } from "next/navigation";
import { can, requirePermission } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import {
  passportService,
  addContributionAction,
  archiveContributionAction,
  updatePassportAction,
  CONTRIBUTION_KINDS,
} from "@domains/passport";

export default async function PassportDetail({ params }: { params: { id: string } }) {
  const user = await requirePermission("passport.read");
  const a = passportService.archiveFor(params.id, { includePrivate: true });
  if (!a) notFound();
  const canEdit = can(user, "passport.update");

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={a.person.fullName}
        subtitle={`${a.passport.passportId}${a.isGenesisContributor ? " · ★ Genesis Contributor" : ""} · ${a.person.primaryRole ?? "—"}`}
        action={
          a.person.status === "published" && a.person.consentStatus === "granted" && a.person.slug ? (
            <Link href={`/passport/${a.passport.passportId}`} className="text-sm text-text-muted hover:text-accent">
              View public Passport ↗
            </Link>
          ) : (
            <span className="text-xs text-stone">Not public (consent/status)</span>
          )
        }
      />

      {/* Private institutional data */}
      <section className="rounded-sm border border-border p-5">
        <h2 className="mb-3 font-display text-lg">Institutional record <span className="text-xs font-normal text-stone">· private</span></h2>
        <form action={updatePassportAction} className="space-y-4 text-sm">
          <input type="hidden" name="id" value={a.passport.id} />
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-text-muted">Country</span>
              <input name="country" defaultValue={a.passport.country ?? ""} className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent" />
            </label>
            <label className="block">
              <span className="text-text-muted">Passport status</span>
              <select name="passportStatus" defaultValue={a.passport.passportStatus} className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent">
                <option value="unclaimed">Unclaimed (historical record)</option>
                <option value="claimed">Claimed</option>
                <option value="linked">Linked</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-text-muted">Institutional note (private)</span>
            <textarea name="institutionalNote" rows={3} defaultValue={a.private?.institutionalNote ?? ""} className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent" />
          </label>
          {canEdit ? (
            <button type="submit" className="rounded-sm bg-accent px-4 py-2 text-paper">Save institutional record</button>
          ) : (
            <p className="text-stone">Read-only (no passport.update permission).</p>
          )}
        </form>
      </section>

      {/* Public identity (managed in the Artist record) */}
      <section className="mt-6 rounded-sm border border-border p-5 text-sm">
        <h2 className="mb-2 font-display text-lg">Public identity</h2>
        <p className="text-text-muted">Roles: {a.person.roles.length ? a.person.roles.join(" · ") : "—"}</p>
        <p className="mt-2">{a.person.shortBio ?? a.person.bio ?? <span className="text-stone">No public biography yet.</span>}</p>
        {a.person.slug && (
          <Link href={`/admin/artists/${a.person.id}`} className="mt-2 inline-block text-text-muted hover:text-accent">
            Edit public identity in the Artist record →
          </Link>
        )}
      </section>

      {/* Certificates */}
      <section className="mt-8">
        <h2 className="font-display text-lg">Certificates <span className="text-sm text-text-muted">({a.counts.certificates}{a.counts.genesisCertificates ? `, ${a.counts.genesisCertificates} Genesis` : ""})</span></h2>
        <ul className="mt-2 space-y-1 text-sm">
          {a.certificates.length === 0 && <li className="text-stone">No certificates yet.</li>}
          {a.certificates.map((c) => (
            <li key={c.id} className="flex justify-between gap-3 border-b border-border/50 py-1">
              <Link href={`/admin/certificates/${c.id}`} className="hover:text-accent">
                <span className="font-mono text-xs">{c.publicId}</span> · {c.roleAtIssue}
                {c.isGenesisCollection && <span className="ml-2 text-accent">★</span>}
              </Link>
              <span className="text-stone">{c.status}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Artworks */}
      <section className="mt-8">
        <h2 className="font-display text-lg">Artworks <span className="text-sm text-text-muted">({a.counts.artworks})</span></h2>
        <ul className="mt-2 space-y-1 text-sm">
          {a.artworks.length === 0 && <li className="text-stone">No artworks linked.</li>}
          {a.artworks.map((w) => (
            <li key={w.id} className="flex justify-between gap-3 border-b border-border/50 py-1">
              <Link href={`/admin/artworks/${w.id}`} className="hover:text-accent">{w.title}</Link>
              <span className="text-stone">{w.year ?? "—"}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Contribution timeline */}
      <section className="mt-8">
        <h2 className="font-display text-lg">Contribution timeline <span className="text-sm text-text-muted">({a.counts.contributions})</span></h2>
        <p className="text-xs text-text-muted">A Passport is never complete — it grows for decades.</p>
        <ul className="mt-3 space-y-1 text-sm">
          {a.contributions.length === 0 && <li className="text-stone">No contributions recorded yet.</li>}
          {a.contributions.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 border-b border-border/50 py-1">
              <span>
                <span className="text-text-muted">{c.occurredOn?.slice(0, 10) ?? "—"}</span> · <span className="uppercase text-xs text-stone">{c.kind}</span> · {c.title}
                {c.chapterName ? <span className="text-text-muted"> ({c.chapterName})</span> : null}
              </span>
              {canEdit && (
                <form action={archiveContributionAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="passportUuid" value={a.passport.id} />
                  <button type="submit" className="text-xs text-stone hover:text-accent">remove</button>
                </form>
              )}
            </li>
          ))}
        </ul>

        {canEdit && (
          <form action={addContributionAction} className="mt-4 grid grid-cols-2 gap-2 rounded-sm border border-border p-4 text-sm">
            <input type="hidden" name="personId" value={a.person.id} />
            <input type="hidden" name="passportUuid" value={a.passport.id} />
            <label className="col-span-1">
              <span className="text-text-muted">Kind</span>
              <select name="kind" className="mt-1 w-full rounded-sm border border-border bg-transparent px-2 py-1.5 outline-none focus:border-accent">
                {CONTRIBUTION_KINDS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </label>
            <label className="col-span-1">
              <span className="text-text-muted">Date</span>
              <input name="occurredOn" type="date" className="mt-1 w-full rounded-sm border border-border bg-transparent px-2 py-1.5 outline-none focus:border-accent" />
            </label>
            <label className="col-span-2">
              <span className="text-text-muted">Title</span>
              <input name="title" required className="mt-1 w-full rounded-sm border border-border bg-transparent px-2 py-1.5 outline-none focus:border-accent" />
            </label>
            <label className="col-span-2">
              <span className="text-text-muted">Description</span>
              <textarea name="description" rows={2} className="mt-1 w-full rounded-sm border border-border bg-transparent px-2 py-1.5 outline-none focus:border-accent" />
            </label>
            <label className="col-span-2">
              <span className="text-text-muted">Source (provenance)</span>
              <input name="source" className="mt-1 w-full rounded-sm border border-border bg-transparent px-2 py-1.5 outline-none focus:border-accent" />
            </label>
            <div className="col-span-2">
              <button type="submit" className="rounded-sm border border-border px-3 py-1.5 hover:border-accent">Add contribution</button>
            </div>
          </form>
        )}
      </section>

      {/* Chapters + future credentials */}
      <section className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-lg">Chapters</h2>
          <ul className="mt-2 space-y-1 text-sm text-text-muted">
            {a.chapters.length === 0 && <li className="text-stone">—</li>}
            {a.chapters.map((c) => (
              <li key={c.name} className="flex justify-between gap-3">
                <span>{c.name}{c.isGenesis ? " ★" : ""}</span>
                <span className="text-stone">{(c.roles ?? []).join(", ")}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-lg">Credentials</h2>
          <p className="mt-2 text-sm text-text-muted">
            On-chain Soulbound credentials are <strong>planned</strong> (Solana, behind the
            BlockchainService). The Passport is already designed to hold them with no redesign.
          </p>
        </div>
      </section>
    </div>
  );
}
