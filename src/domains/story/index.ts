import "server-only";
/**
 * @domains/story — the Story domain's PUBLIC contract.
 * The narrative layer that transforms an archive into a movement: curated
 * stories composed from connected records, living in the knowledge graph.
 */
import { StoryService } from "./story.service";
import { SqliteStoryRepository } from "./story.repository.sqlite";

export { StoryService } from "./story.service";
export type { StoryRepository } from "./story.repository";
export { STORY_KINDS, STORY_REF_TYPES } from "./story.types";
export type {
  StoryKind,
  StoryRefType,
  StorySectionKind,
  StorySection,
  StoryRow,
  StorySummary,
  ResolvedRef,
  ResolvedSection,
  StoryView,
  NewStory,
} from "./story.types";

/** The wired Story service (SQLite backend today). */
export const storyService = new StoryService(new SqliteStoryRepository());

export {
  createStoryAction,
  updateStoryMetaAction,
  setStoryStatusAction,
  addSectionAction,
  removeSectionAction,
  moveSectionAction,
} from "./story.api";
