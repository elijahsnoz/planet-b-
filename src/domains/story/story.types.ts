/**
 * Story domain — entities.
 *
 * A Story is the connective tissue of Planet B: a curated narrative COMPOSED
 * FROM connected records (chapters, passports, artists, artworks, certificates,
 * media, timeline, press, research, impact, organizations), not duplicated
 * content (ADR-0003). It is a living document that evolves as new relationships
 * emerge. Every record reference is mirrored as a knowledge-graph edge so a
 * Story both reads from and contributes to the graph.
 */
import type { LifecycleStatus } from "@shared/index";

export type StoryKind = "feature" | "exhibition" | "profile" | "dispatch" | "essay";

export const STORY_KINDS: readonly StoryKind[] = [
  "feature",
  "exhibition",
  "profile",
  "dispatch",
  "essay",
];

/** The record types a Story section can reference (the narrative graph). */
export type StoryRefType =
  | "chapter"
  | "person"
  | "artwork"
  | "certificate"
  | "media"
  | "timeline"
  | "press"
  | "organization"
  | "impact";

export const STORY_REF_TYPES: readonly StoryRefType[] = [
  "chapter",
  "person",
  "artwork",
  "certificate",
  "media",
  "timeline",
  "press",
  "organization",
  "impact",
];

export type StorySectionKind = "heading" | "prose" | "quote" | "record";

/** One ordered unit of narrative. `record` sections compose from existing data. */
export interface StorySection {
  id: string; // stable uuid (survives reorder)
  kind: StorySectionKind;
  /** heading text / prose body / quotation text. */
  text?: string;
  /** quote attribution. */
  attribution?: string;
  /** record reference (kind === "record"). */
  refType?: StoryRefType;
  refId?: string;
  /** editorial caption shown with a referenced record. */
  caption?: string;
}

export interface StoryRow {
  id: string;
  registryId: string | null;
  slug: string | null;
  status: LifecycleStatus;
  verified: boolean;
  title: string;
  subtitle: string | null;
  dek: string | null;
  body: StorySection[];
  coverMedia: string | null;
  chapterId: string | null;
  kind: StoryKind;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface StorySummary {
  id: string;
  slug: string | null;
  registryId: string | null;
  title: string;
  dek: string | null;
  kind: StoryKind;
  status: LifecycleStatus;
  chapterName: string | null;
  sectionCount: number;
  recordCount: number;
  updatedAt: string;
}

/** A referenced record resolved for display (label + link), so the Story page
 *  shows live data without duplicating it. */
export interface ResolvedRef {
  refType: StoryRefType;
  refId: string;
  label: string;
  sub: string | null;
  href: string | null;
  found: boolean;
}

/** A section with any record reference resolved (for rendering). */
export interface ResolvedSection extends StorySection {
  resolved?: ResolvedRef;
}

export interface StoryView extends Omit<StoryRow, "body"> {
  sections: ResolvedSection[];
  chapterName: string | null;
  chapterSlug: string | null;
}

export interface NewStory {
  title: string;
  dek?: string | null;
  subtitle?: string | null;
  kind: StoryKind;
  chapterId?: string | null;
}
