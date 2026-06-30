import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Origin Story",
  description: "Why there is no Planet B — the philosophy of the movement.",
};

export default function OriginPage() {
  return (
    <article className="mx-auto max-w-measure px-5 py-20">
      <Reveal>
        <p className="text-xs uppercase tracking-widest text-text-muted">Origin Story</p>
        <h1 className="mt-2 pb-display-2 font-display leading-tight">There is no Planet B.</h1>
      </Reveal>
      <Reveal>
        <div className="prose-pb mt-8 space-y-5 text-lg leading-relaxed">
          <p>
            So this — the soil, the water, the air, the city, the single shared sky — is not a
            draft. It is the only copy.
          </p>
          <p>
            We are artists. We were handed what the world threw away: bottle caps, broken watches,
            drink cans, dead electronics, the plastic tide. We did not look away. We looked closer.
            We picked it up, and we made it look back.
          </p>
          <p>
            Because the planet is watching us. And we are learning to watch over it.{" "}
            <strong>Observation is where responsibility begins.</strong>
          </p>
          <p>
            We are not building a second Earth. We are building humanity&rsquo;s Plan&nbsp;B — a
            plan to keep the first one. Planet B is where that plan is remembered, proven, and
            continued.
          </p>
          <p>
            This began in Abuja, on World Environment Day, with fifteen artists, a gallery that has
            nurtured talent since 1983, and an embassy that crossed an ocean to help. It will not
            end there.
          </p>
          <p className="font-display text-2xl">Because there is no Planet B.</p>
        </div>
      </Reveal>
    </article>
  );
}
