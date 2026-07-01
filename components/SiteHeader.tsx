"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PlanetBMark } from "./PlanetBMark";

const NAV = [
  { href: "/origin", label: "Origin" },
  { href: "/chapters/abuja-2026", label: "Genesis Chapter" },
  { href: "/artists", label: "Artists" },
  { href: "/artworks", label: "Artworks" },
  { href: "/partners", label: "Partners" },
];

// Surfaced inside the mobile sheet so the founding document and the archive's
// other institutional rooms are one thumb-reach away — never buried.
const NAV_SECONDARY = [
  { href: "/founders-letter", label: "Founder’s Letter" },
  { href: "/stories", label: "Stories" },
  { href: "/research", label: "Research" },
  { href: "/certificates", label: "Certificates" },
];

/**
 * Site header — navigation that quietly recedes.
 *
 * The chrome is a consequence of the visitor's own motion: it withdraws while they
 * read downward and returns the instant they reach back up, so the institution
 * guides by curiosity rather than a fixed menu bar. At rest it is transparent and
 * borderless; only when it floats over a room's content does it take just enough
 * tint to stay legible. The Threshold (home top) withholds it entirely so the
 * movement dominates first.
 *
 * Phones get a compact bar (logo + a 44×44 menu button) that opens a full-height
 * sheet — focus-trapped, scroll-locked, ESC/backdrop dismissable, closed on
 * navigation. The sheet is a sibling of the header (never a descendant) so the
 * header's recede transform / backdrop blur can never confine it. From `md` up the
 * inline nav expands. Keyboard focus always summons the header back.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [visible, setVisible] = useState(!isHome);
  const [atTop, setAtTop] = useState(true);
  const [open, setOpen] = useState(false);
  const lastY = useRef(0);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Recede while reading down; return on reaching up. On the Threshold, stay
  // withheld until the visitor descends past the first view.
  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY.current;
      lastY.current = y;
      setAtTop(y < 8);
      if (isHome && y < window.innerHeight * 0.6) {
        setVisible(false);
        return;
      }
      if (y < 8) {
        setVisible(true);
        return;
      }
      if (Math.abs(delta) < 6) return; // calm: ignore micro-scrolls, hold state
      setVisible(delta < 0); // reaching up reveals; reading down recedes
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // Close the sheet whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // When closed, the sheet leaves the tab order and the a11y tree entirely.
  useEffect(() => {
    if (overlayRef.current) overlayRef.current.inert = !open;
  }, [open]);

  // While open: lock body scroll, trap focus, ESC to close, restore focus on close.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    const sheet = sheetRef.current;
    const focusables = sheet
      ? sheet.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      : null;
    focusables?.[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "Tab" && focusables && focusables.length) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      root.style.overflow = prevOverflow;
      toggleRef.current?.focus();
    };
  }, [open]);

  const floating = visible || open;
  const position = isHome ? "fixed inset-x-0 top-0" : "sticky top-0";
  const state = floating
    ? "translate-y-0 opacity-100"
    : "pointer-events-none -translate-y-full opacity-0";
  // Transparent and borderless at rest; a whisper of tint only when floating over
  // content (never at the very top of a room, where it sits over its own quiet).
  const surface = floating && !atTop
    ? "border-border/50 bg-bg/70 backdrop-blur"
    : "border-transparent bg-transparent";

  return (
    <>
      <header
        onFocus={() => setVisible(true)}
        className={`${position} z-40 border-b transition-[transform,opacity,background-color,border-color] duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)] ${state} ${surface} [padding-top:env(safe-area-inset-top)]`}
      >
        <div className="mx-auto flex max-w-container-wide items-center justify-between gap-3 px-4 py-2 sm:px-5 sm:py-2.5">
          <Link
            href="/"
            className="-mx-2 flex min-h-[44px] items-center gap-2 rounded px-2 text-text"
            aria-label="Planet B home"
          >
            <PlanetBMark size={24} className="text-accent" />
            <span className="font-display text-base tracking-[0.08em]">PLANET&nbsp;B</span>
          </Link>

          {/* Desktop nav — a quiet inline row from md up. */}
          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-1 text-sm">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-[44px] items-center rounded px-3 text-text-muted transition-colors hover:text-text"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile menu button — 44×44 tap target. */}
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded text-text md:hidden"
          >
            <span className="relative block h-4 w-5" aria-hidden>
              <span
                className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition-transform duration-300 ${
                  open ? "translate-y-[7px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[7px] h-0.5 w-5 bg-current transition-opacity duration-200 ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 top-[14px] h-0.5 w-5 bg-current transition-transform duration-300 ${
                  open ? "-translate-y-[7px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile sheet — a viewport overlay, sibling of the header so the header's
          recede transform / backdrop blur can never confine it. */}
      <div
        ref={overlayRef}
        className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`}
      >
        {/* Backdrop */}
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* Panel */}
        <div
          ref={sheetRef}
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className={`absolute inset-y-0 right-0 flex w-[min(86vw,22rem)] flex-col overflow-y-auto bg-bg shadow-museum-soft transition-transform duration-300 ease-standard [padding:env(safe-area-inset-top)_0_env(safe-area-inset-bottom)] ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-5 py-3">
            <span className="font-display text-base tracking-wide text-text-muted">Planet&nbsp;B</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded text-text"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <nav aria-label="Primary mobile" className="px-3 pb-4 pt-1">
            <ul className="flex flex-col">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex min-h-[52px] items-center rounded-sm px-3 font-display text-xl text-text transition-colors active:bg-mist/40"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="my-3 border-t border-border" />

            <ul className="flex flex-col">
              {NAV_SECONDARY.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex min-h-[48px] items-center rounded-sm px-3 text-base text-text-muted transition-colors active:bg-mist/40"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
