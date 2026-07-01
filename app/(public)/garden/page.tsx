import { notFound } from "next/navigation";
import { flags } from "@/lib/flags";
import { sowAction } from "@/lib/garden/actions";

export const dynamic = "force-dynamic";

/**
 * The Garden — entrance ritual. One dream, one sentence. Works without JavaScript:
 * the form posts to a server action that redirects to the dream's permanent URL.
 */
export default function GardenEntrance({ searchParams }: { searchParams: { error?: string } }) {
  if (!flags.garden) notFound();

  return (
    <section className="mx-auto flex min-h-[80svh] max-w-measure flex-col justify-center px-5 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-text-muted">The Garden</p>
      <h1 className="mt-6 pb-display-2 font-display">Leave one dream.</h1>
      <p className="pb-read mx-auto mt-5 max-w-md text-text-muted">
        One sentence. It doesn’t need to be finished. It becomes part of Planet&nbsp;B — and someone,
        somewhere, may one day continue it.
      </p>

      <form action={sowAction} className="mx-auto mt-10 w-full max-w-md">
        <input type="hidden" name="type" value="dream" />
        <label htmlFor="dream" className="sr-only">
          Your dream
        </label>
        <textarea
          id="dream"
          name="text"
          rows={3}
          maxLength={240}
          required
          placeholder="I dream of…"
          className="w-full resize-none rounded-sm border border-border bg-transparent p-4 text-lg leading-relaxed outline-none focus:border-accent"
        />
        {searchParams.error && <p className="mt-3 text-sm text-accent">{searchParams.error}</p>}
        <button className="mt-6 inline-flex min-h-[52px] items-center justify-center rounded-sm bg-accent px-8 text-sm text-paper transition-transform hover:-translate-y-0.5 active:translate-y-0">
          Sow it
        </button>
      </form>
    </section>
  );
}
