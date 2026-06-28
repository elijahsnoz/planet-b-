/**
 * VideoPlayer — native, lazy (preload=none), poster-first. Sound never autoplays.
 * Captions/transcripts are a preservation follow-up (docs/architecture/05).
 */
export function VideoPlayer({ src, title, poster }: { src: string; title: string; poster?: string }) {
  return (
    <figure className="overflow-hidden rounded-sm border border-border bg-ink shadow-museum-soft">
      <video
        controls
        preload="none"
        poster={poster}
        className="aspect-video w-full bg-ink"
        aria-label={title}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support embedded video.
      </video>
      <figcaption className="px-4 py-3 text-sm text-text-muted">{title}</figcaption>
    </figure>
  );
}
