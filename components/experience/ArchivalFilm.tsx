import { Reveal } from "@/components/Reveal";

/**
 * ArchivalFilm — a film presented as part of the archive, not a media block.
 *
 * Native, lazy (`preload="none"` so nothing downloads until play — essential for
 * the large interview file), sound never autoplays. The frame, the archive line,
 * and the caption do the work of making it feel like a record being shown, rather
 * than a player being embedded.
 *
 * Truthfulness over presentation (founder decision, World Environment Day 2026):
 * we do not fabricate poster frames or transcripts. Until genuine archival
 * enrichments exist, the frame stays honest (no poster) and a quiet line states
 * that those materials are being prepared. The caption must be factual — a plain
 * description of the record, never invented detail.
 *
 * All source files are H.264/AAC MP4 served as video/mp4. Sources with spaces in
 * the filename must be URL-encoded by the caller.
 */
export function ArchivalFilm({
  src,
  type = "video/mp4",
  label,
  kicker,
  heading,
  caption,
}: {
  src: string;
  type?: string;
  /** Accessible name announced for the video. */
  label: string;
  /** Quiet eyebrow, e.g. "Archival Film · 01". */
  kicker: string;
  /** Optional title shown above the frame, e.g. "Final Conversation". */
  heading?: string;
  /** A factual description of the record. Never fabricated. */
  caption: string;
}) {
  return (
    <Reveal className="my-16 sm:my-20">
      <figure>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.28em] text-text-muted">{kicker}</p>
          <span className="text-xs uppercase tracking-[0.28em] text-text-muted">Planet B Archive</span>
        </div>

        {heading && (
          <h2 className="mt-3 font-display text-2xl leading-tight text-text">{heading}</h2>
        )}

        <div className="mt-5 overflow-hidden rounded-sm border border-border bg-ink shadow-museum-soft">
          <video
            controls
            preload="none"
            playsInline
            className="aspect-video w-full bg-ink"
            aria-label={label}
          >
            <source src={src} type={type} />
            Your browser does not support embedded video. The film is held in the Planet B archive.
          </video>
        </div>

        <figcaption className="mt-4 max-w-measure text-sm italic leading-relaxed text-text-muted">
          {caption}
        </figcaption>

        {/* Honest about the un-enriched state — no fabricated posters or transcripts.
            These genuine archival materials are still being prepared. */}
        <p className="mt-3 max-w-measure text-xs leading-relaxed text-text-muted/80">
          A poster frame and a faithful transcript are being prepared as part of the permanent
          Planet&nbsp;B archive.
        </p>
      </figure>
    </Reveal>
  );
}
