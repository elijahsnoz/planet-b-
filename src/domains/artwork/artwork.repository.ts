/**
 * ArtworkRepository — storage contract. Implementation detail; callers use
 * ArtworkService. Owns the artwork reads + the provenance log (append-and-
 * accumulate; soft-delete only — provenance is never erased).
 */
import type {
  ArtworkCertificate,
  ArtworkProfile,
  ArtworkRefLite,
  ArtworkRow,
  ArtworkStoryRef,
  ArtworkSummary,
  NewProvenanceEvent,
  ProvenanceEvent,
  RelatedArtwork,
} from "./artwork.types";

export interface ArtworkRepository {
  getById(id: string): ArtworkRow | null;
  getBySlug(slug: string): ArtworkRow | null;
  list(opts?: { q?: string; chapterId?: string }): ArtworkSummary[];

  artistFor(artistId: string | null): (ArtworkRefLite & { passportId: string | null }) | null;
  chapterFor(chapterId: string | null): ArtworkRefLite | null;
  certificatesFor(artworkId: string): ArtworkCertificate[];
  storiesFeaturing(artworkId: string): ArtworkStoryRef[];
  /** Published graph-neighbours by shared materials / same chapter, most-related first. */
  relatedArtworks(artworkId: string, limit?: number): RelatedArtwork[];

  listProvenance(artworkId: string, includeArchived?: boolean): ProvenanceEvent[];
  getProvenance(id: string): ProvenanceEvent | null;
  addProvenance(id: string, e: NewProvenanceEvent, actor: string): void;
  archiveProvenance(id: string, at: string | null): void;
}

export type { ArtworkProfile };
