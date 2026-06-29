import "server-only";
/**
 * StoryService — the narrative layer's published behavior.
 *
 * Composes a Story from connected records, lets curators reorder/feature/quote,
 * keeps the knowledge graph in sync, and snapshots every meaningful change as an
 * immutable revision (a Story is a living document with version history). It
 * NEVER duplicates record content — record sections resolve to live data.
 */
import { randomUUID } from "node:crypto";
import { NotFoundError, ok, err, type Result } from "@shared/index";
import { mintRegistryId } from "@domains/registry";
import { preservation } from "@platform/preservation";
import { slugify } from "@/lib/slug";
import type { StoryMetaPatch, StoryRepository } from "./story.repository";
import type {
  NewStory,
  ResolvedSection,
  StoryDiscovery,
  StoryRow,
  StorySection,
  StorySummary,
  StoryView,
} from "./story.types";

export class StoryService {
  constructor(private readonly repo: StoryRepository) {}

  list(opts?: { status?: string; kind?: string }): StorySummary[] {
    return this.repo.list(opts);
  }
  getRow(id: string): StoryRow | null {
    return this.repo.getById(id);
  }

  /** A Story resolved for rendering: record sections become live links/labels. */
  getView(slugOrId: string): StoryView | null {
    const row = this.repo.getById(slugOrId) ?? this.repo.getBySlug(slugOrId);
    if (!row) return null;
    const sections: ResolvedSection[] = row.body.map((s) =>
      s.kind === "record" && s.refType && s.refId
        ? { ...s, resolved: this.repo.resolveRef(s.refType, s.refId) }
        : { ...s }
    );
    const { body: _omit, ...rest } = row;
    void _omit;
    return {
      ...rest,
      sections,
      chapterName: this.repo.chapterName(row.chapterId),
      chapterSlug: this.repo.chapterSlug(row.chapterId),
    };
  }

  /**
   * The discovery layer: one hop beyond a story's own references into the
   * knowledge graph — related artworks, the artists behind them, and sibling
   * stories woven from the same records. Reading-only; never mutates the graph.
   */
  discover(slugOrId: string): StoryDiscovery {
    const row = this.repo.getById(slugOrId) ?? this.repo.getBySlug(slugOrId);
    if (!row) return { artworks: [], people: [], stories: [] };
    const { artworks, people } = this.repo.discoverRecords(row.id);
    return { artworks, people, stories: this.repo.relatedStories(row.id) };
  }

  private uniqueSlug(title: string): string {
    const base = slugify(title) || "story";
    let slug = base;
    let n = 2;
    while (this.repo.slugExists(slug)) slug = `${base}-${n++}`;
    return slug;
  }

  create(input: NewStory, actor: string): Result<StoryRow> {
    const id = randomUUID();
    const registryId = mintRegistryId("story");
    const slug = this.uniqueSlug(input.title);
    this.repo.insert({
      id,
      registryId,
      slug,
      title: input.title,
      dek: input.dek ?? null,
      subtitle: input.subtitle ?? null,
      kind: input.kind,
      chapterId: input.chapterId ?? null,
      createdBy: actor,
    });
    preservation.audit({ actor, action: "story.create", entityType: "story", entityId: id, registryId, after: input });
    this.snapshot(id, "created", actor);
    return ok(this.repo.getById(id)!);
  }

  updateMeta(id: string, patch: StoryMetaPatch, actor: string): Result<StoryRow> {
    const before = this.repo.getById(id);
    if (!before) return err(new NotFoundError("Story not found."));
    this.repo.updateMeta(id, { ...patch, updatedBy: actor });
    preservation.audit({ actor, action: "story.update", entityType: "story", entityId: id, registryId: before.registryId, before: { title: before.title, status: before.status }, after: patch });
    this.snapshot(id, "metadata updated", actor);
    return ok(this.repo.getById(id)!);
  }

  setStatus(id: string, status: "draft" | "in_review" | "published" | "archived", actor: string): Result<StoryRow> {
    const before = this.repo.getById(id);
    if (!before) return err(new NotFoundError("Story not found."));
    this.repo.updateMeta(id, { status, updatedBy: actor });
    preservation.audit({ actor, action: `story.${status}`, entityType: "story", entityId: id, registryId: before.registryId, before: { status: before.status }, after: { status } });
    this.snapshot(id, status, actor);
    return ok(this.repo.getById(id)!);
  }

  // ── section composition ─────────────────────────────────────────────────────

  addSection(id: string, section: Omit<StorySection, "id">, actor: string): Result<StoryRow> {
    const row = this.repo.getById(id);
    if (!row) return err(new NotFoundError("Story not found."));
    const next = [...row.body, { ...section, id: randomUUID() }];
    this.repo.setSections(id, next);
    preservation.audit({ actor, action: "story.section.add", entityType: "story", entityId: id, after: section });
    this.snapshot(id, "section added", actor);
    return ok(this.repo.getById(id)!);
  }

  removeSection(id: string, sectionId: string, actor: string): Result<StoryRow> {
    const row = this.repo.getById(id);
    if (!row) return err(new NotFoundError("Story not found."));
    this.repo.setSections(id, row.body.filter((s) => s.id !== sectionId));
    preservation.audit({ actor, action: "story.section.remove", entityType: "story", entityId: id, after: { sectionId } });
    this.snapshot(id, "section removed", actor);
    return ok(this.repo.getById(id)!);
  }

  moveSection(id: string, sectionId: string, dir: "up" | "down", actor: string): Result<StoryRow> {
    const row = this.repo.getById(id);
    if (!row) return err(new NotFoundError("Story not found."));
    const body = [...row.body];
    const i = body.findIndex((s) => s.id === sectionId);
    if (i < 0) return err(new NotFoundError("Section not found."));
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= body.length) return ok(row); // no-op at edges
    [body[i], body[j]] = [body[j]!, body[i]!];
    this.repo.setSections(id, body);
    this.snapshot(id, "section reordered", actor);
    return ok(this.repo.getById(id)!);
  }

  /** Append-or-update a revision snapshot of the whole story (version history). */
  private snapshot(id: string, summary: string, actor: string): void {
    const row = this.repo.getById(id);
    if (!row) return;
    preservation.revise({
      entityType: "story",
      entityId: id,
      registryId: row.registryId,
      snapshot: row,
      changeSummary: summary,
      createdBy: actor,
    });
  }
}
