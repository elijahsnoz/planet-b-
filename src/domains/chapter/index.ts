import "server-only";
/**
 * @domains/chapter — the Chapter domain's PUBLIC contract.
 * Planet B is a federation of chapters; this is the primary institutional object
 * from which artists, artworks, certificates, stories, media, partners, timeline,
 * press, and impact emerge. The Genesis Chapter is its reference implementation.
 */
import { ChapterService } from "./chapter.service";
import { SqliteChapterRepository } from "./chapter.repository.sqlite";

export { ChapterService } from "./chapter.service";
export type { ChapterRepository } from "./chapter.repository";
export type {
  ChapterRow,
  ChapterSummary,
  ChapterArchive,
  ChapterPartner,
  ChapterPerson,
  ChapterArtworkRef,
  TimelineEntry,
  PressEntry,
  ImpactEntry,
  CouncilEntry,
  ChapterCounts,
  ChapterParticipation,
  ChapterPatch,
  YorubaProverb,
} from "./chapter.types";

/** The wired Chapter service (SQLite backend today). */
export const chapterService = new ChapterService(new SqliteChapterRepository());

export { updateChapterAction } from "./chapter.api";
