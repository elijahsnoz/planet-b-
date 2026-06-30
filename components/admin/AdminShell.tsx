"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PlanetBMark } from "@/components/PlanetBMark";

type Item = { href: string; label: string; star?: boolean };

/**
 * AdminShell — the responsive console chrome (Gate 9).
 *
 * Museum staff manage Planet B from an iPad as comfortably as a desktop. From lg
 * up the 240px sidebar is permanent; below lg (iPad portrait and phones) it
 * collapses into a focus-trappable drawer reached from a 44px menu button, so the
 * content gets the full width instead of being crushed beside a fixed rail.
 *
 * The server layout still owns auth; it passes the permitted nav items, the user
 * label, and the logout server action down to this client shell.
 */
export function AdminShell({
  items,
  userLabel,
  roles,
  logoutAction,
  children,
}: {
  items: Item[];
  userLabel: string;
  roles: string;
  logoutAction: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      root.style.overflow = prev;
    };
  }, [open]);

  const navList = (
    <ul className="space-y-0.5 text-sm">
      {items.map((i) => (
        <li key={i.href}>
          <Link
            href={i.href}
            className="flex min-h-[44px] items-center justify-between rounded-sm px-3 text-text-muted transition-colors hover:bg-mist hover:text-text"
          >
            <span>{i.label}</span>
            {i.star && (
              <span title="Sacred — never deleted" className="text-accent">
                ★
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="pb-admin min-h-screen bg-bg text-text lg:grid lg:grid-cols-[240px_1fr]">
      {/* Permanent sidebar — lg and up */}
      <aside className="hidden border-r border-border bg-ink/[0.02] p-4 lg:block">
        <Link href="/admin" className="mb-6 flex items-center gap-2 text-accent">
          <PlanetBMark size={26} />
          <span className="font-display text-lg text-text">Planet&nbsp;B</span>
        </Link>
        <nav aria-label="Admin">{navList}</nav>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-bg/95 px-4 py-2 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="admin-nav"
              className="pb-touch -ml-2 inline-flex items-center justify-center rounded text-text lg:hidden"
            >
              <span className="relative block h-4 w-5" aria-hidden>
                <span className="absolute left-0 top-0 h-0.5 w-5 bg-current" />
                <span className="absolute left-0 top-[7px] h-0.5 w-5 bg-current" />
                <span className="absolute left-0 top-[14px] h-0.5 w-5 bg-current" />
              </span>
            </button>
            <p className="truncate text-xs uppercase tracking-widest text-text-muted">
              Collections Management
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-sm">
            <span className="hidden text-text-muted sm:inline">
              {userLabel} <span className="text-stone">· {roles}</span>
            </span>
            <form action={logoutAction}>
              <button className="inline-flex min-h-[40px] items-center rounded-sm border border-border px-3 transition-colors hover:border-accent hover:text-accent">
                Sign out
              </button>
            </form>
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6">{children}</div>
      </div>

      {/* Drawer — below lg */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          id="admin-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation"
          className={`absolute inset-y-0 left-0 flex w-[min(82vw,18rem)] flex-col overflow-y-auto bg-bg p-4 shadow-museum-soft transition-transform duration-300 ease-standard [padding-top:env(safe-area-inset-top)] ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2 text-accent">
              <PlanetBMark size={24} />
              <span className="font-display text-base text-text">Planet&nbsp;B</span>
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="pb-touch inline-flex items-center justify-center rounded text-text"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav aria-label="Admin">{navList}</nav>
        </div>
      </div>
    </div>
  );
}
