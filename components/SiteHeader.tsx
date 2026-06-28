"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PlanetBMark } from "./PlanetBMark";

const NAV = [
  { href: "/origin", label: "Origin" },
  { href: "/chapters/abuja-2026", label: "Genesis Chapter" },
  { href: "/artists", label: "Artists" },
  { href: "/artworks", label: "Artworks" },
  { href: "/partners", label: "Partners" },
];

/**
 * Reveal-on-scroll header (docs/experience/07). On the Threshold (home top) the
 * nav is withheld so the movement dominates; it fades in once the visitor
 * descends. On inner pages it is always present.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [shown, setShown] = useState(!isHome);

  useEffect(() => {
    if (!isHome) {
      setShown(true);
      return;
    }
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // On the Threshold: a fixed overlay that fades in on descent.
  // On inner pages: a normal sticky bar that occupies layout (no overlap).
  const position = isHome ? "fixed inset-x-0 top-0" : "sticky top-0";
  const reveal = shown
    ? "translate-y-0 border-border bg-bg/80 opacity-100 backdrop-blur"
    : "pointer-events-none -translate-y-2 border-transparent opacity-0";

  return (
    <header className={`${position} z-40 border-b transition-all duration-500 ${reveal}`}>
      <div className="mx-auto flex max-w-container-wide items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2 text-text" aria-label="Planet B home">
          <PlanetBMark size={28} className="text-accent" />
          <span className="font-display text-lg tracking-wide">PLANET&nbsp;B</span>
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-5 text-sm">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-text-muted transition-colors hover:text-text">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
