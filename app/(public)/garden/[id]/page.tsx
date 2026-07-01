import Link from "next/link";
import { notFound } from "next/navigation";
import { flags } from "@/lib/flags";
import { readContribution } from "@platform/contribution/container";

export const dynamic = "force-dynamic";

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
  } catch {
    return "";
  }
}

/**
 * A dream's permanent home. Server-rendered from the store on every request, so it
 * survives refresh and resolves at a stable, shareable URL — the first meaningful
 * experience of return: seeing what you left, still held.
 */
export default async function ContributionRecord({ params }: { params: { id: string } }) {
  if (!flags.garden) notFound();
  const c = await readContribution(params.id);
  if (!c) notFound();

  const text = typeof c.content.text === "string" ? c.content.text : "";

  return (
    <section className="mx-auto flex min-h-[80svh] max-w-measure flex-col justify-center px-5 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-text-muted">A dream, held in Planet&nbsp;B</p>

      <blockquote className="mt-10">
        <p className="pb-display-3 font-display leading-snug text-text">&ldquo;{text}&rdquo;</p>
      </blockquote>

      <p className="mt-8 text-sm text-text-muted">
        Sown {fmtDate(c.createdAt)} · kept for as long as Planet&nbsp;B endures
      </p>
      <p className="mt-2 font-mono text-xs text-text-muted">{c.id}</p>

      <div className="mt-12">
        <Link
          href="/garden"
          className="inline-flex min-h-[44px] items-center text-sm text-text-muted underline-offset-4 transition-colors hover:text-text hover:underline"
        >
          Leave another&nbsp;→
        </Link>
      </div>
    </section>
  );
}
