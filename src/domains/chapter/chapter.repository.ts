/**
 * ChapterRepository — storage contract for the federation node and the
 * chapter-scoped data that emerges from it. Implementation detail; callers use
 * ChapterService.
 */
import type {
  ChapterArtworkRef,
  ChapterParticipation,
  ChapterPartner,
  ChapterPatch,
  ChapterPerson,
  ChapterRow,
  ChapterSummary,
  CouncilEntry,
  ImpactEntry,
  PressEntry,
  TimelineEntry,
} from "./chapter.types";

export interface ChapterRepository {
  getById(id: string): ChapterRow | null;
  getBySlug(slug: string): ChapterRow | null;
  list(): ChapterSummary[];
  update(id: string, patch: ChapterPatch): void;

  partnersFor(chapterId: string): ChapterPartner[];
  peopleFor(chapterId: string): ChapterPerson[];
  artworksFor(chapterId: string): ChapterArtworkRef[];
  timelineFor(chapterId: string): TimelineEntry[];
  pressFor(chapterId: string): PressEntry[];
  impactFor(chapterId: string): ImpactEntry[];
  councilFor(chapterId: string): CouncilEntry[];
  certificateCount(chapterId: string): number;

  /** Every chapter a person took part in, with the roles they held. */
  participationFor(personId: string): ChapterParticipation[];
}
