"use client";

import Link from "next/link";

/**
 * The print toolbar — screen-only (hidden by the printable's @media print rules).
 * "Print" opens the browser dialog, where the holder can also Save as PDF.
 */
export function PrintToolbar({ backHref }: { backHref: string }) {
  return (
    <div className="pbp-toolbar mx-auto mb-8 flex max-w-[820px] flex-wrap items-center justify-between gap-4 px-5">
      <Link href={backHref} className="text-sm text-text-muted underline-offset-4 hover:text-text hover:underline">
        ← Back to Passport
      </Link>
      <div className="flex items-center gap-4">
        <p className="hidden text-xs text-text-muted sm:block">
          Choose “Save as PDF” in the print dialog for a framed digital copy.
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-sm bg-accent px-6 py-3 text-sm text-paper transition-transform hover:-translate-y-0.5"
        >
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}
