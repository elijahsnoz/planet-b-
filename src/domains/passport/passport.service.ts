import "server-only";
/**
 * PassportService — the Planet Passport domain's published behavior.
 *
 * Assembles the "museum archive dedicated to one person": their public identity,
 * certificates (from @domains/certificate), artworks, lifelong contributions,
 * and chapters — and lets curators grow that record over time. The Passport
 * already understands the Genesis Collection: a holder of a Genesis founding
 * certificate is flagged a Genesis Contributor, so when the issuance ceremony
 * eventually happens, no redesign is needed.
 */
import { randomUUID } from "node:crypto";
import {
  NotFoundError,
  ok,
  err,
  type Result,
  type Clock,
  systemClock,
} from "@shared/index";
import { mintRegistryId } from "@domains/registry";
import { certificateService } from "@domains/certificate";
import { chapterService } from "@domains/chapter";
import { preservation } from "@platform/preservation";
import type {
  PassportPatch,
  PassportRepository,
} from "./passport.repository";
import type {
  ContributionView,
  NewContribution,
  PassportArchive,
  PassportStatus,
  PassportSummary,
} from "./passport.types";

export class PassportService {
  constructor(
    private readonly repo: PassportRepository,
    private readonly clock: Clock = systemClock
  ) {}

  list(opts?: { q?: string; status?: PassportStatus }): PassportSummary[] {
    return this.repo.list(opts);
  }

  /** Ensure a person has a Passport, minting PB-ID on first need (Principle IV). */
  ensureForPerson(personId: string): PassportArchive | null {
    let base = this.repo.getByPersonId(personId);
    if (!base) {
      const passportId = mintRegistryId("id"); // PB-ID-NNNNNN
      base = this.repo.ensureForPerson(personId, passportId);
    }
    return this.archiveFor(base.passport.id, { includePrivate: true });
  }

  /**
   * The full archive for a Passport, resolved by passport UUID, PB-ID, or the
   * person's slug. `includePrivate` controls whether institutional notes appear.
   */
  archiveFor(
    idOrKey: string,
    opts: { includePrivate?: boolean } = {}
  ): PassportArchive | null {
    const base =
      this.repo.getByUuid(idOrKey) ??
      this.repo.getByPassportId(idOrKey) ??
      this.repo.getByPersonSlug(idOrKey);
    if (!base) return null;

    const certificates = certificateService.listForPerson(base.person.id);
    const artworks = this.repo.artworksForPerson(base.person.id);
    const contributions = this.repo.listContributions(base.person.id);
    // Role-aware chapter history (participated / organized / facilitated / led …)
    // comes from the Chapter domain — the federation node owns participation.
    const chapters = chapterService.participationFor(base.person.id).map((p) => ({
      slug: p.chapterSlug,
      name: p.chapterName,
      roles: p.roles,
      isGenesis: p.isGenesis,
    }));
    const genesisCertificates = certificates.filter((c) => c.isGenesisCollection).length;

    const archive: PassportArchive = {
      passport: base.passport,
      person: base.person,
      isGenesisContributor: genesisCertificates > 0,
      certificates,
      artworks,
      contributions,
      chapters,
      counts: {
        certificates: certificates.length,
        genesisCertificates,
        artworks: artworks.length,
        contributions: contributions.length,
        chapters: chapters.length,
      },
    };
    if (opts.includePrivate) {
      archive.private = { institutionalNote: base.passport.institutionalNote };
    }
    return archive;
  }

  /** Public view: only granted-consent, published people are exposed. */
  publicArchive(idOrKey: string): PassportArchive | null {
    const archive = this.archiveFor(idOrKey, { includePrivate: false });
    if (!archive) return null;
    if (archive.person.consentStatus !== "granted") return null;
    if (archive.person.status !== "published") return null;
    return archive;
  }

  updatePassport(id: string, patch: PassportPatch, actor: string): Result<PassportArchive> {
    const base = this.repo.getByUuid(id);
    if (!base) return err(new NotFoundError("Passport not found."));
    this.repo.update(id, { ...patch, updatedBy: actor });
    preservation.audit({
      actor,
      action: "passport.update",
      entityType: "passport",
      entityId: id,
      registryId: base.passport.passportId,
      before: {
        country: base.passport.country,
        passportStatus: base.passport.passportStatus,
      },
      after: patch,
    });
    return ok(this.archiveFor(id, { includePrivate: true })!);
  }

  // ── Contributions (the record that grows for decades) ───────────────────────

  addContribution(c: NewContribution, actor: string): Result<ContributionView> {
    const base = this.repo.getByPersonId(c.personId);
    if (!base) return err(new NotFoundError("No Passport for that person."));
    const id = randomUUID();
    this.repo.addContribution(id, c, actor);
    preservation.audit({
      actor,
      action: "contribution.create",
      entityType: "contribution",
      entityId: id,
      after: c,
    });
    return ok(this.repo.getContribution(id)!);
  }

  updateContribution(
    id: string,
    patch: Omit<Parameters<PassportRepository["updateContribution"]>[1], "updatedBy">,
    actor: string
  ): Result<ContributionView> {
    const before = this.repo.getContribution(id);
    if (!before) return err(new NotFoundError("Contribution not found."));
    this.repo.updateContribution(id, { ...patch, updatedBy: actor });
    preservation.audit({
      actor,
      action: "contribution.update",
      entityType: "contribution",
      entityId: id,
      before,
      after: patch,
    });
    return ok(this.repo.getContribution(id)!);
  }

  archiveContribution(id: string, actor: string, restore = false): Result<ContributionView> {
    const before = this.repo.getContribution(id);
    if (!before) return err(new NotFoundError("Contribution not found."));
    this.repo.archiveContribution(id, restore ? null : this.clock.nowIso());
    preservation.audit({
      actor,
      action: restore ? "contribution.restore" : "contribution.archive",
      entityType: "contribution",
      entityId: id,
    });
    return ok(this.repo.getContribution(id)!);
  }
}
