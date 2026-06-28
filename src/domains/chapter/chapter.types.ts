/**
 * Chapter domain — entities.
 *
 * Planet B is a FEDERATION OF CHAPTERS. A Chapter is a primary institutional
 * object from which artists, artworks, certificates, stories, media, partners,
 * workshops, exhibitions, timeline, press, and impact all emerge. Every future
 * event — hosted by a museum, embassy, university, NGO, or community — is
 * representable as a Chapter with no architectural change (the host is simply an
 * organization of the appropriate type).
 */
import type { LifecycleStatus } from "@shared/index";

export interface YorubaProverb {
  yoruba: string;
  english: string;
}

export interface ChapterRow {
  id: string;
  registryId: string | null;
  slug: string | null;
  status: LifecycleStatus;
  verified: boolean;
  name: string;
  city: string | null;
  country: string | null;
  isGenesis: boolean;
  immutable: boolean;
  movement: string;
  theme: string | null;
  eventName: string | null;
  openedOn: string | null; // start / opening
  endedOn: string | null; // close (null = ongoing)
  venue: string | null;
  summary: string | null;
  yorubaProverbs: YorubaProverb[] | null;
  heroMedia: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

/** An organization related to a chapter (host / sponsor / partner). */
export interface ChapterPartner {
  id: string;
  slug: string | null;
  name: string;
  type: string | null; // embassy | gallery | foundation | museum | university | ngo | govt | …
  relation: string; // hosted_by | sponsored_by | partnered_with
  label: string; // Host | Sponsor | Partner
}

/** A person related to a chapter, with the roles they held there. */
export interface ChapterPerson {
  id: string;
  slug: string | null;
  name: string;
  passportId: string | null;
  roles: string[];
}

export interface ChapterArtworkRef {
  id: string;
  slug: string | null;
  title: string;
  year: number | null;
  status: string;
  artistName: string | null;
}

export interface TimelineEntry {
  id: string;
  phase: string | null;
  title: string;
  eventDate: string | null;
  description: string | null;
  sortOrder: number;
}

export interface PressEntry {
  id: string;
  outlet: string;
  title: string | null;
  url: string;
  publishedOn: string | null;
}

export interface ImpactEntry {
  id: string;
  metric: string;
  value: number;
  unit: string | null;
  asOf: string | null;
  verified: boolean;
}

export interface CouncilEntry {
  personId: string | null;
  personName: string | null;
  councilCategory: string;
  citation: string | null;
  isCharterMember: boolean;
}

export interface ChapterCounts {
  artists: number;
  artworks: number;
  certificates: number;
  partners: number;
  timeline: number;
  press: number;
  impact: number;
  passports: number;
}

export interface ChapterSummary {
  id: string;
  slug: string | null;
  name: string;
  city: string | null;
  country: string | null;
  status: LifecycleStatus;
  isGenesis: boolean;
  openedOn: string | null;
  endedOn: string | null;
  counts: Pick<ChapterCounts, "artists" | "artworks" | "certificates">;
}

/** The full Chapter — the federation node and all that emerges from it. */
export interface ChapterArchive {
  chapter: ChapterRow;
  partners: ChapterPartner[];
  people: ChapterPerson[];
  artworks: ChapterArtworkRef[];
  timeline: TimelineEntry[];
  press: PressEntry[];
  impact: ImpactEntry[];
  council: CouncilEntry[];
  counts: ChapterCounts;
}

/** One person's involvement in a chapter (feeds the Planet Passport). */
export interface ChapterParticipation {
  chapterId: string;
  chapterSlug: string | null;
  chapterName: string;
  isGenesis: boolean;
  roles: string[];
}

export interface ChapterPatch {
  name?: string;
  city?: string | null;
  country?: string | null;
  venue?: string | null;
  theme?: string | null;
  summary?: string | null;
  openedOn?: string | null;
  endedOn?: string | null;
  status?: LifecycleStatus;
  updatedBy?: string | null;
}
