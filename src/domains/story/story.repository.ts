/**
 * StoryRepository — storage contract. Implementation detail; callers use
 * StoryService. The repository owns persistence of the story row + its section
 * body, keeps the knowledge-graph edges in sync with the record sections, and
 * resolves record references for display.
 */
import type {
  DiscoveredRecord,
  RelatedStory,
  ResolvedRef,
  StoryRefType,
  StoryRow,
  StorySection,
  StorySummary,
} from "./story.types";

export interface NewStoryRow {
  id: string;
  registryId: string;
  slug: string;
  title: string;
  dek?: string | null;
  subtitle?: string | null;
  kind: string;
  chapterId?: string | null;
  createdBy?: string | null;
}

export interface StoryMetaPatch {
  title?: string;
  subtitle?: string | null;
  dek?: string | null;
  kind?: string;
  chapterId?: string | null;
  coverMedia?: string | null;
  status?: string;
  updatedBy?: string | null;
}

export interface StoryRepository {
  getById(id: string): StoryRow | null;
  getBySlug(slug: string): StoryRow | null;
  list(opts?: { status?: string; kind?: string }): StorySummary[];
  slugExists(slug: string): boolean;

  insert(row: NewStoryRow): void;
  updateMeta(id: string, patch: StoryMetaPatch): void;
  /** Persist the ordered sections AND re-sync the story's graph edges. */
  setSections(id: string, sections: StorySection[]): void;

  /** Resolve a record reference to a display label + link (live data). */
  resolveRef(refType: StoryRefType, refId: string): ResolvedRef;
  chapterName(chapterId: string | null): string | null;
  chapterSlug(chapterId: string | null): string | null;

  // ── graph discovery (one hop beyond the story's own references) ───────────────
  /** Records reachable from the story's featured artworks — related artworks and
   *  the artists behind them — never duplicating what the story already cites. */
  discoverRecords(storyId: string, limit?: number): { artworks: DiscoveredRecord[]; people: DiscoveredRecord[] };
  /** Other published stories that share a featured record, most-shared first. */
  relatedStories(storyId: string, limit?: number): RelatedStory[];
}
