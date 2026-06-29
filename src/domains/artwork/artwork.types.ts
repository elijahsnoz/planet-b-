/**
 * Artwork domain — entities.
 *
 * An Artwork is not an image; it is a PRESERVED CULTURAL OBJECT, designed as
 * though it may one day sit in museums worldwide. Its life-history (provenance)
 * accumulates and is never overwritten — creation → workshop → exhibition →
 * publication → research → collection → verification → future blockchain
 * anchoring. It is a first-class citizen of the knowledge graph.
 */
import type { LifecycleStatus } from "@shared/index";

export type ProvenanceKind =
  | "creation"
  | "workshop"
  | "exhibition"
  | "publication"
  | "research"
  | "collection"
  | "verification"
  | "anchoring"
  | "restoration"
  | "ownership";

export const PROVENANCE_KINDS: readonly ProvenanceKind[] = [
  "creation",
  "workshop",
  "exhibition",
  "publication",
  "research",
  "collection",
  "verification",
  "anchoring",
  "restoration",
  "ownership",
];

export interface ProvenanceEvent {
  id: string;
  artworkId: string;
  kind: ProvenanceKind;
  title: string;
  description: string | null;
  occurredOn: string | null;
  chapterId: string | null;
  organizationId: string | null;
  actorPersonId: string | null;
  source: string | null;
  verified: boolean;
  sortOrder: number | null;
  createdAt: string;
  archivedAt: string | null;
}

export interface ArtworkRow {
  id: string;
  registryId: string | null;
  slug: string | null;
  status: LifecycleStatus;
  verified: boolean;
  title: string;
  titleVariant: string | null;
  artistId: string | null;
  chapterId: string | null;
  medium: string | null;
  dimensions: string | null;
  year: number | null;
  statement: string | null;
  significance: string | null;
  materials: string[];
  primaryMedia: string | null;
  exhibitorRole: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface ArtworkSummary {
  id: string;
  slug: string | null;
  title: string;
  year: number | null;
  status: LifecycleStatus;
  artistName: string | null;
  chapterName: string | null;
  provenanceCount: number;
}

export interface ArtworkRefLite {
  id: string;
  slug: string | null;
  name: string;
}

export interface ArtworkCertificate {
  id: string;
  publicId: string;
  roleAtIssue: string;
  status: string;
}

export interface ArtworkStoryRef {
  slug: string | null;
  title: string;
  dek: string | null;
}

/**
 * A graph-neighbour artwork, surfaced by the connections it shares with the
 * subject — reclaimed materials it is made from, and/or the chapter it belongs
 * to. The shared evidence travels with the ref so the UI can *reveal* the
 * connection, not merely list a thumbnail.
 */
export interface RelatedArtwork {
  id: string;
  slug: string | null;
  title: string;
  year: number | null;
  artistName: string | null;
  sharedMaterials: string[];
  sameChapter: boolean;
}

/** The full Artwork — preserved object + its accumulating provenance + graph. */
export interface ArtworkProfile {
  artwork: ArtworkRow;
  artist: (ArtworkRefLite & { passportId: string | null }) | null;
  chapter: ArtworkRefLite | null;
  certificates: ArtworkCertificate[];
  stories: ArtworkStoryRef[];
  provenance: ProvenanceEvent[];
}

export interface NewProvenanceEvent {
  artworkId: string;
  kind: ProvenanceKind;
  title: string;
  description?: string | null;
  occurredOn?: string | null;
  chapterId?: string | null;
  organizationId?: string | null;
  source?: string | null;
  verified?: boolean;
}
