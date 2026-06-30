import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { getPress } from "@/lib/data";

export const metadata: Metadata = {
  title: "Press",
  description: "Coverage of the Genesis Chapter.",
};

export default function PressPage() {
  const press = getPress();
  return (
    <div className="mx-auto max-w-container px-5 py-14">
      <Reveal>
        <h1 className="pb-display-2 font-display">Press</h1>
        <p className="mt-3 max-w-measure text-text-muted">National coverage of the Genesis Chapter.</p>
      </Reveal>
      <ul className="mt-10 divide-y divide-border border-y border-border">
        {press.map((item) => (
          <li key={item.url} className="py-5">
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="group block">
              <p className="text-xs uppercase tracking-widest text-text-muted">{item.outlet}</p>
              <h2 className="mt-1 font-display text-xl group-hover:text-accent">{item.title}</h2>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
