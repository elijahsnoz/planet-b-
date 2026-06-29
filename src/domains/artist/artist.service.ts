import "server-only";
/**
 * ArtistService — the public cultural identity, PROJECTED FROM the Passport.
 *
 * It never duplicates Passport data: identity, certificates, artworks, chapters,
 * and contributions come straight from the Passport projection; the Artist adds
 * the public creative facets (stories, collaborators, materials, themes). This
 * keeps the Passport the single institutional identity while the Artist remains
 * an independently presentable public record.
 */
import { passportService } from "@domains/passport";
import type { ArtistRepository } from "./artist.repository";
import type { ArtistProfile, ArtistSummary } from "./artist.types";

export class ArtistService {
  constructor(private readonly repo: ArtistRepository) {}

  list(opts?: { q?: string }): ArtistSummary[] {
    return this.repo.list(opts);
  }

  /** The living archive for one artist (resolve by person slug / passport id). */
  profile(slugOrKey: string): ArtistProfile | null {
    const pa = passportService.archiveFor(slugOrKey, { includePrivate: false });
    if (!pa) return null;
    const personId = pa.person.id;
    const artworkIds = pa.artworks.map((a) => a.id);
    const stories = this.repo.storiesFor(personId, artworkIds);
    const collaborators = this.repo.collaboratorsFor(personId);
    const materials = this.repo.materialsFor(personId);
    const themes = this.repo.themesFor(personId);
    return {
      person: pa.person,
      passportId: pa.passport.passportId,
      isGenesisContributor: pa.isGenesisContributor,
      certificates: pa.certificates,
      artworks: pa.artworks,
      chapters: pa.chapters,
      contributions: pa.contributions,
      stories,
      collaborators,
      materials,
      themes,
      counts: {
        artworks: pa.artworks.length,
        certificates: pa.certificates.length,
        chapters: pa.chapters.length,
        stories: stories.length,
        collaborators: collaborators.length,
      },
    };
  }
}
