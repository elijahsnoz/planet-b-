import Image from "next/image";

/**
 * Plate — a framed image with museum matting (docs/05/12).
 * `fit="contain"` shows the whole image (used for catalogue spreads, which
 * include the artist's name — nothing is cropped). `fit="cover"` fills the
 * frame (used for portrait headshots). Always requires alt text.
 */
export function Plate({
  src,
  alt,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 33vw",
  className,
  fit = "cover",
}: {
  src: string | null;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  fit?: "cover" | "contain";
}) {
  return (
    <div
      className={`relative aspect-[4/3] overflow-hidden rounded-sm bg-mist shadow-museum-soft ${className ?? ""}`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={fit === "contain" ? "object-contain" : "object-cover"}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-6 text-center text-xs uppercase tracking-widest text-text-muted">
          Image to be added
        </div>
      )}
    </div>
  );
}
