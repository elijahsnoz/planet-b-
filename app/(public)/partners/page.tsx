import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { getOrganizations } from "@/lib/data";

export const metadata: Metadata = {
  title: "Partners & Sponsors",
  description: "The institutions that made the Genesis Chapter possible.",
};

export default function PartnersPage() {
  const organizations = getOrganizations();
  return (
    <div className="mx-auto max-w-container px-5 py-24 sm:py-32">
      <Reveal>
        <h1 className="pb-display-2 font-display">Partners &amp; Sponsors</h1>
        <p className="pb-read mt-5 max-w-measure leading-relaxed text-text-muted">
          Planet B credits every institution with equal warmth. The Genesis Chapter was sponsored
          by the Royal Norwegian Embassy and hosted by Nike Art Gallery.
        </p>
      </Reveal>
      <ul className="mt-16 grid gap-8 sm:mt-24 sm:grid-cols-2 sm:gap-10">
        {organizations.map((org, i) => (
          <Reveal as="li" key={org.slug} delay={(i % 2) * 0.05}>
            <div className="h-full rounded-sm border border-border p-8 sm:p-10">
              <p className="text-xs uppercase tracking-[0.24em] text-text-muted">{org.role ?? org.type}</p>
              <h2 className="mt-3 font-display text-2xl">{org.name}</h2>
              {org.about && <p className="mt-4 text-sm leading-relaxed text-text-muted">{org.about}</p>}
            </div>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
