import Link from "next/link";
import { notFound } from "next/navigation";
import { can, requirePermission } from "@/lib/auth";
import { revisionsFor } from "@/lib/admin";
import { PageHeader, StatusPill } from "@/components/admin/ui";
import {
  storyService,
  STORY_KINDS,
  STORY_REF_TYPES,
  updateStoryMetaAction,
  setStoryStatusAction,
  addSectionAction,
  removeSectionAction,
  moveSectionAction,
} from "@domains/story";
import { chapterService } from "@domains/chapter";

export default async function StoryEditor({ params }: { params: { id: string } }) {
  const user = await requirePermission("story.read");
  const story = storyService.getView(params.id);
  if (!story) notFound();
  const chapters = chapterService.list();
  const revisions = revisionsFor("story", story.id);
  const canEdit = can(user, "story.update");
  const canPublish = can(user, "story.publish");

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={story.title}
        subtitle={`${story.registryId ?? "—"} · /${story.slug}`}
        action={<StatusPill status={story.status} />}
      />

      {/* Status workflow */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        {(["draft", "in_review", "published", "archived"] as const).map((s) => {
          const allowed = s === "published" ? canPublish : canEdit;
          return (
            <form action={setStoryStatusAction} key={s}>
              <input type="hidden" name="id" value={story.id} />
              <input type="hidden" name="status" value={s} />
              <button
                type="submit"
                disabled={!allowed || story.status === s}
                className="rounded-sm border border-border px-3 py-1.5 disabled:opacity-40 hover:border-accent hover:text-accent"
              >
                {story.status === s ? `● ${s}` : s}
              </button>
            </form>
          );
        })}
        {story.status === "published" && (
          <Link href={`/stories/${story.slug}`} className="ml-auto text-text-muted hover:text-accent">View public story ↗</Link>
        )}
      </div>

      {/* Metadata */}
      <form action={updateStoryMetaAction} className="space-y-3 rounded-sm border border-border p-4 text-sm">
        <input type="hidden" name="id" value={story.id} />
        <label className="block"><span className="text-text-muted">Title</span>
          <input name="title" defaultValue={story.title} required className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent" /></label>
        <label className="block"><span className="text-text-muted">Subtitle</span>
          <input name="subtitle" defaultValue={story.subtitle ?? ""} className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent" /></label>
        <label className="block"><span className="text-text-muted">Dek (standfirst)</span>
          <input name="dek" defaultValue={story.dek ?? ""} className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-text-muted">Kind</span>
            <select name="kind" defaultValue={story.kind} className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent">
              {STORY_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select></label>
          <label className="block"><span className="text-text-muted">Chapter</span>
            <select name="chapterId" defaultValue={story.chapterId ?? ""} className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent">
              <option value="">—</option>
              {chapters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
        </div>
        <input type="hidden" name="coverMedia" value={story.coverMedia ?? ""} />
        {canEdit && <button type="submit" className="rounded-sm bg-accent px-4 py-2 text-paper">Save details</button>}
      </form>

      {/* Sections */}
      <section className="mt-8">
        <h2 className="font-display text-lg">Narrative sections <span className="text-sm text-text-muted">({story.sections.length})</span></h2>
        <p className="text-xs text-text-muted">Composed from connected records — reorder, feature, and quote. Record sections show live data, never copies.</p>
        <ol className="mt-3 space-y-2">
          {story.sections.map((s) => (
            <li key={s.id} className="rounded-sm border border-border/70 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs uppercase tracking-wide text-stone">{s.kind}</span>
                  {s.kind === "record" ? (
                    <span className="ml-2">
                      {s.resolved?.found ? (
                        <>
                          <span className="text-text-muted">{s.refType}:</span> {s.resolved.label}
                          {s.resolved.sub ? <span className="text-stone"> · {s.resolved.sub}</span> : null}
                        </>
                      ) : (
                        <span className="text-accent">missing {s.refType} record</span>
                      )}
                      {s.caption ? <span className="block text-xs text-text-muted">“{s.caption}”</span> : null}
                    </span>
                  ) : (
                    <span className="ml-2">{s.kind === "heading" ? <strong>{s.text}</strong> : s.text}{s.attribution ? <span className="text-stone"> — {s.attribution}</span> : null}</span>
                  )}
                </div>
                {canEdit && (
                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    <form action={moveSectionAction}><input type="hidden" name="id" value={story.id} /><input type="hidden" name="sectionId" value={s.id} /><input type="hidden" name="dir" value="up" /><button type="submit" className="text-stone hover:text-accent">↑</button></form>
                    <form action={moveSectionAction}><input type="hidden" name="id" value={story.id} /><input type="hidden" name="sectionId" value={s.id} /><input type="hidden" name="dir" value="down" /><button type="submit" className="text-stone hover:text-accent">↓</button></form>
                    <form action={removeSectionAction}><input type="hidden" name="id" value={story.id} /><input type="hidden" name="sectionId" value={s.id} /><button type="submit" className="text-stone hover:text-accent">✕</button></form>
                  </div>
                )}
              </div>
            </li>
          ))}
          {story.sections.length === 0 && <li className="text-stone">No sections yet — add the first below.</li>}
        </ol>

        {canEdit && (
          <form action={addSectionAction} className="mt-4 space-y-2 rounded-sm border border-border p-4 text-sm">
            <input type="hidden" name="id" value={story.id} />
            <div className="grid grid-cols-2 gap-2">
              <label><span className="text-text-muted">Section kind</span>
                <select name="sectionKind" className="mt-1 w-full rounded-sm border border-border bg-transparent px-2 py-1.5 outline-none focus:border-accent">
                  <option value="heading">heading</option>
                  <option value="prose">prose</option>
                  <option value="quote">quote</option>
                  <option value="record">record</option>
                </select></label>
              <label><span className="text-text-muted">Record type (for record)</span>
                <select name="refType" className="mt-1 w-full rounded-sm border border-border bg-transparent px-2 py-1.5 outline-none focus:border-accent">
                  {STORY_REF_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select></label>
            </div>
            <label className="block"><span className="text-text-muted">Text (heading / prose / quote)</span>
              <textarea name="text" rows={2} className="mt-1 w-full rounded-sm border border-border bg-transparent px-2 py-1.5 outline-none focus:border-accent" /></label>
            <div className="grid grid-cols-2 gap-2">
              <label><span className="text-text-muted">Quote attribution</span>
                <input name="attribution" className="mt-1 w-full rounded-sm border border-border bg-transparent px-2 py-1.5 outline-none focus:border-accent" /></label>
              <label><span className="text-text-muted">Record id (for record)</span>
                <input name="refId" className="mt-1 w-full rounded-sm border border-border bg-transparent px-2 py-1.5 outline-none focus:border-accent" /></label>
            </div>
            <label className="block"><span className="text-text-muted">Caption (for record)</span>
              <input name="caption" className="mt-1 w-full rounded-sm border border-border bg-transparent px-2 py-1.5 outline-none focus:border-accent" /></label>
            <button type="submit" className="rounded-sm border border-border px-3 py-1.5 hover:border-accent">Add section</button>
          </form>
        )}
      </section>

      {/* Version history */}
      <section className="mt-8">
        <h2 className="font-display text-lg">Version history</h2>
        <ul className="mt-2 space-y-1 text-sm text-text-muted">
          {revisions.length === 0 && <li>No revisions yet.</li>}
          {revisions.map((r) => (
            <li key={r.id} className="flex justify-between gap-3">
              <span>v{r.version} · {r.changeSummary ?? "—"}</span>
              <span className="text-stone">{r.createdAt.slice(0, 16).replace("T", " ")}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
