import Link from "next/link";
import { notFound } from "next/navigation";
import { can, requirePermission } from "@/lib/auth";
import { PageHeader, StatusPill } from "@/components/admin/ui";
import { chapterService, updateChapterAction } from "@domains/chapter";

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border border-border px-3 py-2 text-center">
      <div className="font-display text-xl">{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  );
}

export default async function ChapterDetail({ params }: { params: { id: string } }) {
  const user = await requirePermission("chapter.read");
  const a = chapterService.archiveFor(params.id);
  if (!a) notFound();
  const c = a.chapter;
  const canEdit = can(user, "chapter.update");
  const STATUSES = ["draft", "in_review", "published", "archived"];

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={c.isGenesis ? `★ ${c.name} — Genesis Chapter` : c.name}
        subtitle={`${c.registryId ?? "—"} · ${[c.city, c.country].filter(Boolean).join(", ")}`}
        action={<StatusPill status={c.status} />}
      />

      {c.isGenesis && (
        <p className="mb-5 rounded-sm bg-mist/50 p-3 text-xs text-text-muted">
          🔒 Protected by Principle II — sacred, immutable, and never archivable. It is the reference
          implementation every future chapter inherits from.
        </p>
      )}

      {/* Federation overview */}
      <div className="mb-8 grid grid-cols-4 gap-3 sm:grid-cols-8">
        <Count label="Contributors" value={a.counts.artists} />
        <Count label="Passports" value={a.counts.passports} />
        <Count label="Artworks" value={a.counts.artworks} />
        <Count label="Certificates" value={a.counts.certificates} />
        <Count label="Partners" value={a.counts.partners} />
        <Count label="Timeline" value={a.counts.timeline} />
        <Count label="Press" value={a.counts.press} />
        <Count label="Impact" value={a.counts.impact} />
      </div>

      {/* Edit */}
      <form action={updateChapterAction} className="space-y-4">
        <input type="hidden" name="id" value={c.id} />
        <div className="grid grid-cols-2 gap-4 text-sm">
          <label className="block"><span className="text-text-muted">Name</span>
            <input name="name" defaultValue={c.name} required className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent" /></label>
          <label className="block"><span className="text-text-muted">Venue</span>
            <input name="venue" defaultValue={c.venue ?? ""} className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent" /></label>
          <label className="block"><span className="text-text-muted">City</span>
            <input name="city" defaultValue={c.city ?? ""} className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent" /></label>
          <label className="block"><span className="text-text-muted">Country</span>
            <input name="country" defaultValue={c.country ?? ""} className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent" /></label>
          <label className="block"><span className="text-text-muted">Opened on (start)</span>
            <input name="openedOn" type="date" defaultValue={c.openedOn ?? ""} className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent" /></label>
          <label className="block"><span className="text-text-muted">Ended on (close)</span>
            <input name="endedOn" type="date" defaultValue={c.endedOn ?? ""} className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent" /></label>
          <label className="block"><span className="text-text-muted">Theme</span>
            <input name="theme" defaultValue={c.theme ?? ""} className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent" /></label>
          <label className="block"><span className="text-text-muted">Status</span>
            <select name="status" defaultValue={c.status} className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent">
              {STATUSES.map((s) => <option key={s} value={s} disabled={s === "archived" && c.isGenesis}>{s}</option>)}
            </select></label>
        </div>
        <label className="block text-sm"><span className="text-text-muted">Summary / description</span>
          <textarea name="summary" rows={4} defaultValue={c.summary ?? ""} className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent" /></label>
        {canEdit ? (
          <button type="submit" className="rounded-sm bg-accent px-4 py-2 text-sm text-paper">Save chapter</button>
        ) : (
          <p className="text-sm text-stone">Read-only (no chapter.update permission).</p>
        )}
      </form>

      {/* Partners / host */}
      <section className="mt-10">
        <h2 className="font-display text-lg">Partners &amp; host</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {a.partners.length === 0 && <li className="text-stone">None linked.</li>}
          {a.partners.map((p) => (
            <li key={`${p.id}:${p.relation}`} className="flex justify-between gap-3 border-b border-border/50 py-1">
              <span>{p.name} <span className="text-text-muted">({p.type ?? "—"})</span></span>
              <span className="text-stone">{p.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Contributors */}
      <section className="mt-8">
        <h2 className="font-display text-lg">Contributors <span className="text-sm text-text-muted">({a.counts.artists})</span></h2>
        <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {a.people.map((p) => (
            <li key={p.id} className="flex justify-between gap-3 border-b border-border/40 py-1">
              <span>
                {p.passportId ? (
                  <Link href={`/passport/${p.passportId}`} className="hover:text-accent">{p.name}</Link>
                ) : (
                  p.name
                )}
              </span>
              <span className="text-stone">{p.roles.join(", ")}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Timeline */}
      <section className="mt-8">
        <h2 className="font-display text-lg">Timeline <span className="text-sm text-text-muted">({a.counts.timeline})</span></h2>
        <ol className="mt-2 space-y-1 text-sm">
          {a.timeline.map((e) => (
            <li key={e.id} className="flex gap-3">
              <span className="w-24 shrink-0 text-text-muted">{e.eventDate ?? e.phase ?? "—"}</span>
              <span>{e.title}</span>
            </li>
          ))}
        </ol>
      </section>

      <Link href={c.slug ? `/chapters/${c.slug}` : "/chapters"} className="mt-8 inline-block text-sm text-accent hover:underline">
        View public chapter ↗
      </Link>
    </div>
  );
}
