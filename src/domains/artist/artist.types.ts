/**
 * Artist domain — entities.
 *
 * An Artist is the PUBLIC CULTURAL IDENTITY that emerges from a Planet Passport.
 * The Passport remains the institutional identity; the Artist projects from it
 * (never duplicating it) and adds public creative facets — stories, materials,
 * themes, collaborations. It is a living archive, not a profile page, and a
 * first-class citizen of the knowledge graph.
 */
import type { CertificateListItem } from "@domains/certificate";
import type { ChapterRef, ContributionView, PassportArtwork, PassportPerson } from "@domains/passport";

export interface ArtistStoryRef {
  slug: string | null;
  title: string;
  dek: string | null;
}

export interface Collaborator {
  id: string;
  slug: string | null;
  name: string;
  passportId: string | null;
}

export interface ArtistSummary {
  id: string;
  slug: string | null;
  name: string;
  primaryRole: string | null;
  passportId: string | null;
  artworkCount: number;
  isGenesisContributor: boolean;
}

/** The living archive of one artist — projected from the Passport + facets. */
export interface ArtistProfile {
  person: PassportPerson;
  passportId: string | null;
  isGenesisContributor: boolean;
  certificates: CertificateListItem[];
  artworks: PassportArtwork[];
  chapters: ChapterRef[];
  contributions: ContributionView[];
  stories: ArtistStoryRef[];
  collaborators: Collaborator[];
  materials: string[];
  themes: string[];
  counts: {
    artworks: number;
    certificates: number;
    chapters: number;
    stories: number;
    collaborators: number;
  };
}
