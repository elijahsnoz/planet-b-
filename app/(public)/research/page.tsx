import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Research",
  description: "Citable records and methodology for the Planet B archive.",
};

export default function ResearchPage() {
  return (
    <div className="mx-auto max-w-measure px-5 py-20">
      <Reveal>
        <h1 className="pb-display-2 font-display">Research</h1>
        <p className="mt-4 text-text-muted">
          Planet B is built to be trusted and cited. Every record has a stable, permanent URL; the
          source catalogue, dimensions, materials, and provenance are preserved with checksums.
        </p>
        <p className="mt-4 text-text-muted">
          A full research portal — downloadable catalogue, dataset exports, and a citation format —
          arrives in a later phase. The underlying records are already structured and verifiable.
        </p>
      </Reveal>
    </div>
  );
}
