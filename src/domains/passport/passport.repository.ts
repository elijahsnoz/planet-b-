/**
 * PassportRepository — storage contract for the Passport domain (implementation
 * detail; callers use PassportService). Certificates are aggregated by the
 * service via @domains/certificate; this repo owns passports, contributions, and
 * the person/artwork/chapter joins the Passport surfaces.
 */
import type {
  ChapterRef,
  ContributionView,
  NewContribution,
  PassportArtwork,
  PassportPerson,
  PassportRow,
  PassportStatus,
  PassportSummary,
} from "./passport.types";

export interface PassportBase {
  passport: PassportRow;
  person: PassportPerson;
}

export interface PassportPatch {
  country?: string | null;
  passportStatus?: PassportStatus;
  institutionalNote?: string | null;
  updatedBy?: string | null;
}

export interface ContributionPatch {
  kind?: string;
  title?: string;
  description?: string | null;
  occurredOn?: string | null;
  chapterId?: string | null;
  source?: string | null;
  verified?: boolean;
  updatedBy?: string | null;
}

export interface PassportRepository {
  getByUuid(id: string): PassportBase | null;
  getByPassportId(passportId: string): PassportBase | null;
  getByPersonId(personId: string): PassportBase | null;
  getByPersonSlug(slug: string): PassportBase | null;
  list(opts?: { q?: string; status?: PassportStatus }): PassportSummary[];

  ensureForPerson(personId: string, passportId: string): PassportBase;
  update(id: string, patch: PassportPatch): void;

  artworksForPerson(personId: string): PassportArtwork[];
  chaptersForPerson(personId: string): ChapterRef[];

  listContributions(personId: string, includeArchived?: boolean): ContributionView[];
  addContribution(id: string, c: NewContribution, actor: string): void;
  updateContribution(id: string, patch: ContributionPatch): void;
  archiveContribution(id: string, at: string | null): void;
  getContribution(id: string): ContributionView | null;
}
