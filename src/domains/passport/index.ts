import "server-only";
/**
 * @domains/passport — the Planet Passport domain's PUBLIC contract.
 * A lifelong institutional identity: the museum archive of one person's
 * contribution to Planet B. Not a profile; not an account (ADR-0002).
 */
import { PassportService } from "./passport.service";
import { SqlitePassportRepository } from "./passport.repository.sqlite";

export { PassportService } from "./passport.service";
export type { PassportRepository } from "./passport.repository";
export {
  CONTRIBUTION_KINDS,
} from "./passport.types";
export type {
  PassportStatus,
  ContributionKind,
  PassportRow,
  ContributionRow,
  ContributionView,
  PassportPerson,
  PassportArtwork,
  ChapterRef,
  PassportSummary,
  PassportArchive,
  NewContribution,
} from "./passport.types";

/** The wired Passport service (SQLite backend today). */
export const passportService = new PassportService(new SqlitePassportRepository());

export {
  updatePassportAction,
  addContributionAction,
  archiveContributionAction,
} from "./passport.api";
