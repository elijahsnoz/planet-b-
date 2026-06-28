/**
 * Planet Passport domain — entities.
 *
 * A Passport is a LIFELONG INSTITUTIONAL IDENTITY (ADR-0002): a 1:1 projection
 * over a `people` row, never a user account and never a social profile. It is
 * never "completed" — it accumulates certificates, artworks, contributions,
 * chapters, leadership, mentoring, recognition, and (later) on-chain credentials
 * for decades. Aggregations are computed, not duplicated.
 */
import type { CertificateListItem } from "@domains/certificate";

export type PassportStatus = "unclaimed" | "claimed" | "linked";

export type ContributionKind =
  | "exhibition"
  | "award"
  | "mentorship"
  | "interview"
  | "research"
  | "talk"
  | "residency"
  | "role_change"
  | "leadership";

export const CONTRIBUTION_KINDS: readonly ContributionKind[] = [
  "exhibition",
  "award",
  "mentorship",
  "interview",
  "research",
  "talk",
  "residency",
  "role_change",
  "leadership",
];

export interface PassportRow {
  id: string;
  registryId: string | null;
  passportId: string; // PB-ID-NNNNNN
  personId: string;
  country: string | null;
  passportStatus: PassportStatus;
  institutionalNote: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface ContributionRow {
  id: string;
  personId: string;
  kind: ContributionKind;
  title: string;
  description: string | null;
  occurredOn: string | null;
  chapterId: string | null;
  source: string | null;
  verified: boolean;
  sortOrder: number | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface ContributionView extends ContributionRow {
  chapterName: string | null;
}

/** The person facts the Passport surfaces (drawn from the `people` record). */
export interface PassportPerson {
  id: string;
  slug: string | null;
  fullName: string;
  displayName: string | null;
  honorific: string | null;
  primaryRole: string | null;
  roles: string[];
  shortBio: string | null;
  bio: string | null;
  portraitMedia: string | null;
  consentStatus: string;
  status: string;
}

export interface PassportArtwork {
  id: string;
  slug: string | null;
  title: string;
  year: number | null;
  status: string;
  chapterName: string | null;
}

export interface ChapterRef {
  slug: string | null;
  name: string;
  /** The roles this person held in the chapter (participated/organized/led/…). */
  roles?: string[];
  isGenesis?: boolean;
}

/** A row in the passport list (admin + indexes). */
export interface PassportSummary {
  id: string;
  passportId: string;
  personId: string;
  personName: string;
  personSlug: string | null;
  country: string | null;
  passportStatus: PassportStatus;
  consentStatus: string;
  isGenesisContributor: boolean;
  counts: { certificates: number; artworks: number; contributions: number };
}

/**
 * The full Passport — "a museum archive dedicated to one person's lifelong
 * contribution." `institutionalNote` is present only for admin (private) views.
 */
export interface PassportArchive {
  passport: PassportRow;
  person: PassportPerson;
  isGenesisContributor: boolean;
  certificates: CertificateListItem[];
  artworks: PassportArtwork[];
  contributions: ContributionView[];
  chapters: ChapterRef[];
  counts: {
    certificates: number;
    genesisCertificates: number;
    artworks: number;
    contributions: number;
    chapters: number;
  };
  /** Redacted out of public views. */
  private?: { institutionalNote: string | null };
}

export interface NewContribution {
  personId: string;
  kind: ContributionKind;
  title: string;
  description?: string | null;
  occurredOn?: string | null;
  chapterId?: string | null;
  source?: string | null;
  verified?: boolean;
}
