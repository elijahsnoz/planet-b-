import "server-only";
/**
 * ArtworkService — the preserved-object domain's published behavior.
 *
 * Assembles the full Artwork profile (artist, chapter, certificates, featuring
 * stories, and the accumulating provenance timeline) and records provenance.
 * Provenance ACCUMULATES — events are added and soft-archived, never erased
 * (museum-grade history; designed to outlast the move to blockchain).
 */
import { randomUUID } from "node:crypto";
import { NotFoundError, ok, err, type Result, type Clock, systemClock } from "@shared/index";
import { preservation } from "@platform/preservation";
import type { ArtworkRepository } from "./artwork.repository";
import type {
  ArtworkProfile,
  ArtworkRow,
  ArtworkSummary,
  NewProvenanceEvent,
  ProvenanceEvent,
  RelatedArtwork,
} from "./artwork.types";

export class ArtworkService {
  constructor(
    private readonly repo: ArtworkRepository,
    private readonly clock: Clock = systemClock
  ) {}

  list(opts?: { q?: string; chapterId?: string }): ArtworkSummary[] {
    return this.repo.list(opts);
  }
  getRow(slugOrId: string): ArtworkRow | null {
    return this.repo.getById(slugOrId) ?? this.repo.getBySlug(slugOrId);
  }

  /** The full preserved-object record. */
  profile(slugOrId: string): ArtworkProfile | null {
    const artwork = this.repo.getById(slugOrId) ?? this.repo.getBySlug(slugOrId);
    if (!artwork) return null;
    return {
      artwork,
      artist: this.repo.artistFor(artwork.artistId),
      chapter: this.repo.chapterFor(artwork.chapterId),
      certificates: this.repo.certificatesFor(artwork.id),
      stories: this.repo.storiesFeaturing(artwork.id),
      provenance: this.repo.listProvenance(artwork.id),
    };
  }

  listProvenance(artworkId: string): ProvenanceEvent[] {
    return this.repo.listProvenance(artworkId);
  }

  /**
   * Graph-neighbours of an artwork — works sharing its reclaimed materials
   * and/or chapter, most-related first. The knowledge graph, surfaced.
   */
  relatedArtworks(slugOrId: string, limit?: number): RelatedArtwork[] {
    const artwork = this.repo.getById(slugOrId) ?? this.repo.getBySlug(slugOrId);
    if (!artwork) return [];
    return this.repo.relatedArtworks(artwork.id, limit);
  }

  /** Record an event in an artwork's life. History accumulates. */
  addProvenance(e: NewProvenanceEvent, actor: string): Result<ProvenanceEvent> {
    const artwork = this.repo.getById(e.artworkId);
    if (!artwork) return err(new NotFoundError("Artwork not found."));
    const id = randomUUID();
    this.repo.addProvenance(id, e, actor);
    preservation.audit({
      actor,
      action: "artwork.provenance.add",
      entityType: "artwork",
      entityId: e.artworkId,
      registryId: artwork.registryId,
      after: e,
    });
    return ok(this.repo.getProvenance(id)!);
  }

  /** Soft-archive a provenance event (never a hard delete). */
  archiveProvenance(id: string, actor: string, restore = false): Result<ProvenanceEvent> {
    const before = this.repo.getProvenance(id);
    if (!before) return err(new NotFoundError("Provenance event not found."));
    this.repo.archiveProvenance(id, restore ? null : this.clock.nowIso());
    preservation.audit({
      actor,
      action: restore ? "artwork.provenance.restore" : "artwork.provenance.archive",
      entityType: "artwork",
      entityId: before.artworkId,
      after: { provenanceId: id },
    });
    return ok(this.repo.getProvenance(id)!);
  }
}
