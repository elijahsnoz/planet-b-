import "server-only";
/**
 * @domains/artwork — the Artwork domain's PUBLIC contract.
 * A preserved cultural object with an accumulating provenance record, designed
 * for eventual museum-grade cataloguing; a first-class citizen of the graph.
 */
import { ArtworkService } from "./artwork.service";
import { SqliteArtworkRepository } from "./artwork.repository.sqlite";

export { ArtworkService } from "./artwork.service";
export type { ArtworkRepository } from "./artwork.repository";
export { PROVENANCE_KINDS } from "./artwork.types";
export type {
  ProvenanceKind,
  ProvenanceEvent,
  ArtworkRow,
  ArtworkSummary,
  ArtworkCertificate,
  ArtworkStoryRef,
  ArtworkProfile,
  NewProvenanceEvent,
  RelatedArtwork,
} from "./artwork.types";

/** The wired Artwork service (SQLite backend today). */
export const artworkService = new ArtworkService(new SqliteArtworkRepository());

export { addProvenanceAction, archiveProvenanceAction } from "./artwork.api";
