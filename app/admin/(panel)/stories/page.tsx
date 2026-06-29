import Link from "next/link";
import { can, requirePermission } from "@/lib/auth";
import { PageHeader, StatusPill } from "@/components/admin/ui";
import { storyService, STORY_KINDS, createStoryAction } from "@domains/story";
import { chapterService } from "@domains/chapter";

export default async function StoriesAdmin() {
  const user = await requirePermission("story.read");
  const stories = storyService.list();
  const chapters = chapterService.list();
  const canCreate = can(user, "story.create");

  return (
    <div>
      <PageHeader
        title="Stories"
        subtitle="The narrative layer — curated stories composed from connected records."
      />

      {canCreate && (
        <form action={createStoryAction} className="mb-8 grid grid-cols-2 gap-3 rounded-sm border border-border p-4 text-sm">
          <label className="col-span-2"><span className="text-text-muted">Title</span>
            <input name="title" required className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent" /></label>
          <label className="col-span-2"><span className="text-text-muted">Dek (standfirst)</span>
            <input name="dek" className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent" /></label>
          <label><span className="text-text-muted">Kind</span>
            <select name="kind" className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent">
              {STORY_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select></label>
          <label><span className="text-text-muted">Chapter (optional)</span>
            <select name="chapterId" className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent">
              <option value="">—</option>
              {chapters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
          <div className="col-span-2"><button type="submit" className="rounded-sm bg-accent px-4 py-2 text-paper">Compose new story</button></div>
        </form>
      )}

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-text-muted">
            <th className="py-2 pr-4 font-normal">Title</th>
            <th className="py-2 pr-4 font-normal">Kind</th>
            <th className="py-2 pr-4 font-normal">Chapter</th>
            <th className="py-2 pr-4 font-normal">Sections</th>
            <th className="py-2 pr-4 font-normal">Records</th>
            <th className="py-2 pr-4 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {stories.length === 0 && (
            <tr><td colSpan={6} className="py-6 text-center text-text-muted">No stories yet.</td></tr>
          )}
          {stories.map((s) => (
            <tr key={s.id} className="border-b border-border/60 hover:bg-mist/40">
              <td className="py-2 pr-4">
                <Link href={`/admin/stories/${s.id}`} className="hover:text-accent">{s.title}</Link>
                {s.dek && <div className="text-xs text-text-muted">{s.dek}</div>}
              </td>
              <td className="py-2 pr-4 text-text-muted">{s.kind}</td>
              <td className="py-2 pr-4 text-text-muted">{s.chapterName ?? "—"}</td>
              <td className="py-2 pr-4 text-text-muted">{s.sectionCount}</td>
              <td className="py-2 pr-4 text-text-muted">{s.recordCount}</td>
              <td className="py-2 pr-4"><StatusPill status={s.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
