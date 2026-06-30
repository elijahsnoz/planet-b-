import Link from "next/link";
import type { ReactNode } from "react";
import { Plate } from "./Plate";
import { Reveal } from "./Reveal";

/**
 * ExhibitLayout — the one profile/record template (docs/12) used by Artist,
 * Artwork and Person. Header (image + title + meta) · body · related rail.
 */
export function ExhibitLayout({
  eyebrow,
  title,
  meta,
  image,
  imageAlt,
  children,
  related,
  backHref,
  backLabel,
  fit = "contain",
}: {
  eyebrow?: string;
  title: string;
  meta?: ReactNode;
  image: string | null;
  imageAlt: string;
  children?: ReactNode;
  related?: ReactNode;
  backHref?: string;
  backLabel?: string;
  fit?: "cover" | "contain";
}) {
  return (
    <article className="mx-auto max-w-container px-5 py-12">
      {backHref && (
        <Link href={backHref} className="-ml-2 inline-flex min-h-[44px] items-center rounded px-2 text-sm text-text-muted hover:text-accent">
          ← {backLabel ?? "Back"}
        </Link>
      )}
      <div className="mt-4 grid gap-8 sm:mt-6 sm:gap-10 lg:grid-cols-[1.1fr_1fr]">
        <Reveal>
          <div className="relative aspect-square overflow-hidden rounded-sm bg-mist shadow-museum-soft">
            <Plate src={image} alt={imageAlt} className="aspect-square" priority sizes="(max-width: 1024px) 100vw, 55vw" fit={fit} />
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div>
            {eyebrow && (
              <p className="text-xs uppercase tracking-widest text-text-muted">{eyebrow}</p>
            )}
            <h1 className="mt-2 pb-display-2 font-display leading-tight text-text">{title}</h1>
            {meta && <div className="mt-4 text-sm text-text-muted">{meta}</div>}
            <div className="prose-pb mt-6 max-w-measure text-text">{children}</div>
          </div>
        </Reveal>
      </div>
      {related && <div className="mt-16">{related}</div>}
    </article>
  );
}
