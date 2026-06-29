import "server-only";
/**
 * @domains/artist — the Artist domain's PUBLIC contract.
 * The public cultural identity projected from a Planet Passport — a living
 * archive of one person's creative contribution, woven into the knowledge graph.
 * Read-only: the underlying person is curated via the Passport / artist editor.
 */
import { ArtistService } from "./artist.service";
import { SqliteArtistRepository } from "./artist.repository.sqlite";

export { ArtistService } from "./artist.service";
export type { ArtistRepository } from "./artist.repository";
export type { ArtistProfile, ArtistSummary, ArtistStoryRef, Collaborator } from "./artist.types";

/** The wired Artist service (SQLite backend today). */
export const artistService = new ArtistService(new SqliteArtistRepository());
