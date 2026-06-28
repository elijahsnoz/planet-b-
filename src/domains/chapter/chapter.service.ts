import "server-only";
/**
 * ChapterService — the federation node's published behavior.
 *
 * Assembles the full Chapter archive (everything that emerges from a chapter)
 * and lets curators evolve it. The Genesis Chapter is protected by Principle II:
 * it can be curated but never archived, demoted, or unset as genesis.
 */
import {
  ConflictError,
  NotFoundError,
  ok,
  err,
  type Result,
} from "@shared/index";
import { preservation } from "@platform/preservation";
import type { ChapterRepository } from "./chapter.repository";
import type {
  ChapterArchive,
  ChapterParticipation,
  ChapterPatch,
  ChapterRow,
  ChapterSummary,
} from "./chapter.types";

export class ChapterService {
  constructor(private readonly repo: ChapterRepository) {}

  list(): ChapterSummary[] {
    return this.repo.list();
  }
  getBySlug(slug: string): ChapterRow | null {
    return this.repo.getBySlug(slug);
  }

  /** The full federation node: the chapter and everything that emerges from it. */
  archiveFor(slugOrId: string): ChapterArchive | null {
    const chapter = this.repo.getById(slugOrId) ?? this.repo.getBySlug(slugOrId);
    if (!chapter) return null;
    const partners = this.repo.partnersFor(chapter.id);
    const people = this.repo.peopleFor(chapter.id);
    const artworks = this.repo.artworksFor(chapter.id);
    const timeline = this.repo.timelineFor(chapter.id);
    const press = this.repo.pressFor(chapter.id);
    const impact = this.repo.impactFor(chapter.id);
    const council = this.repo.councilFor(chapter.id);
    const certificates = this.repo.certificateCount(chapter.id);
    const passports = people.filter((p) => p.passportId).length;
    return {
      chapter,
      partners,
      people,
      artworks,
      timeline,
      press,
      impact,
      council,
      counts: {
        artists: people.length,
        artworks: artworks.length,
        certificates,
        partners: partners.length,
        timeline: timeline.length,
        press: press.length,
        impact: impact.length,
        passports,
      },
    };
  }

  /** Curate a chapter. Genesis cannot be archived or demoted (Principle II). */
  update(id: string, patch: ChapterPatch, actor: string): Result<ChapterArchive> {
    const chapter = this.repo.getById(id);
    if (!chapter) return err(new NotFoundError("Chapter not found."));
    if (chapter.isGenesis && patch.status === "archived") {
      return err(new ConflictError("The Genesis Chapter is sacred and can never be archived (Principle II)."));
    }
    this.repo.update(id, { ...patch, updatedBy: actor });
    preservation.audit({
      actor,
      action: "chapter.update",
      entityType: "chapter",
      entityId: id,
      registryId: chapter.registryId,
      before: { name: chapter.name, status: chapter.status, openedOn: chapter.openedOn, endedOn: chapter.endedOn },
      after: patch,
    });
    preservation.revise({
      entityType: "chapter",
      entityId: id,
      registryId: chapter.registryId,
      snapshot: { ...chapter, ...patch },
      changeSummary: "updated",
      createdBy: actor,
    });
    return ok(this.archiveFor(id)!);
  }

  /** A person's institutional history across chapters (for the Planet Passport). */
  participationFor(personId: string): ChapterParticipation[] {
    return this.repo.participationFor(personId);
  }
}
