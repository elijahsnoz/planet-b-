import Image from "next/image";

/**
 * Plate — a framed image with museum matting (docs/05/12). Used for artworks and
 * portraits. Always requires alt text. Caption rendered by the caller where needed.
 */
export function Plate({
  src,
  alt,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 33vw",
  className,
}: {
  src: string | null;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
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
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-text-muted">
          Image pending preservation
        </div>
      )}
    </div>
  );
}
