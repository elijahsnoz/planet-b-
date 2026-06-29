/**
 * ArtistRepository — the public-cultural-facet reads that are NOT already part
 * of the Passport projection (stories, collaborators, materials, themes) plus
 * the artist directory. Identity/certificates/artworks/chapters are projected
 * from the Passport in the service — never duplicated here.
 */
import type { ArtistStoryRef, ArtistSummary, Collaborator } from "./artist.types";

export interface ArtistRepository {
  /** People who are artists (hold at least one artwork). */
  list(opts?: { q?: string }): ArtistSummary[];
  personIdBySlug(slug: string): string | null;

  storiesFor(personId: string, artworkIds: string[]): ArtistStoryRef[];
  collaboratorsFor(personId: string): Collaborator[];
  materialsFor(personId: string): string[];
  themesFor(personId: string): string[];
}
