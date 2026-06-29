"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PassportCover } from "./PassportCover";
import { PassportSeal } from "./PassportSeal";

export type PassportView = {
  passportId: string;
  name: string;
  honorific?: string | null;
  roles: string[];
  line: string;
  bio?: string | null;
  portrait?: string | null;
  genesis: boolean;
  issuedOn: string;
  verified: boolean;
  counts: { certificates: number; artworks: number; contributions: number; chapters: number };
  certificates: { id: string; role: string; artwork?: string | null; publicId: string; genesis?: boolean }[];
  artworks: { id: string; title: string; slug?: string | null; year?: number | null }[];
  contributions: { id: string; date?: string | null; kind: string; title: string; description?: string | null }[];
  chapters: { name: string; slug?: string | null; roles: string[]; genesis?: boolean }[];
  verifyUrl: string;
  qrSvg: string;
  printHref: string;
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

/** A decorative TD3-style machine-readable zone — the iconic passport texture. */
function mrz(name: string, id: string): [string, string] {
  const clean = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, "<");
  const parts = name.trim().split(/\s+/);
  const surname = clean(parts[parts.length - 1] ?? "");
  const given = clean(parts.slice(0, -1).join(" ")) || surname;
  const l1 = `P<PLB${surname}<<${given}`.padEnd(44, "<").slice(0, 44);
  const num = clean(id).slice(0, 9).padEnd(9, "<");
  const l2 = `${num}PLB<<FEDERATION<<2026<<<<<<<<`.padEnd(44, "<").slice(0, 44);
  return [l1, l2];
}

// ── presentational atoms ─────────────────────────────────────────────────────

function StatusRow({ label, value, tone }: { label: string; value: string; tone?: "verified" }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 py-2.5 text-sm">
      <span className="text-[0.62rem] uppercase tracking-[0.22em] text-text-muted">{label}</span>
      <span className={`text-right font-medium ${tone === "verified" ? "text-verified" : "text-text"}`}>
        {value}
      </span>
    </div>
  );
}

function ArchiveSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section className="border-t border-border pt-8">
      <header className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl">{title}</h2>
        <span className="font-mono text-xs text-text-muted">{String(count).padStart(2, "0")}</span>
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}

// ── the document ─────────────────────────────────────────────────────────────

export function PassportDocument({ v }: { v: PassportView }) {
  const reduce = useReducedMotion();
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    if (reduce) setOpened(true);
  }, [reduce]);

  const [l1, l2] = mrz(v.name, v.passportId);

  return (
    <div className="bg-bg">
      {/* ── THE CEREMONY · closed cover → identity spread ──────────────── */}
      <section
        data-theme="ink"
        className="relative grid min-h-[92svh] place-items-center overflow-hidden bg-bg px-5 py-24 text-text"
        style={{ perspective: "1600px" }}
      >
        {/* the vitrine light */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(246,243,236,0.09), transparent 72%)" }}
        />

        {/* the identity spread (revealed) */}
        <motion.div
          className="relative w-full max-w-3xl"
          initial={false}
          animate={{ opacity: opened ? 1 : 0, y: opened ? 0 : 24, scale: opened ? 1 : 0.98 }}
          transition={{ duration: reduce ? 0 : 0.9, ease: [0.22, 0.61, 0.36, 1], delay: opened && !reduce ? 0.35 : 0 }}
          aria-hidden={!opened}
        >
          <IdentitySpread v={v} mrz={[l1, l2]} />
        </motion.div>

        {/* the closed cover, lifted away on open */}
        <AnimatePresence>
          {!opened && (
            <motion.div
              key="cover"
              className="absolute flex flex-col items-center"
              initial={false}
              exit={{ rotateY: reduce ? 0 : -118, opacity: 0, x: reduce ? 0 : -40 }}
              transition={{ duration: reduce ? 0 : 1.1, ease: [0.4, 0, 0.2, 1] }}
              style={{ transformOrigin: "left center", transformStyle: "preserve-3d" }}
            >
              <div className="w-[min(72vw,19rem)]">
                <PassportCover holder={{ passportId: v.passportId, name: v.name, line: v.line, genesis: v.genesis }} />
              </div>
              <button
                type="button"
                onClick={() => setOpened(true)}
                className="mt-8 inline-flex items-center gap-2 rounded-sm border border-paper/30 px-6 py-3 text-sm tracking-wide text-paper transition-all duration-300 hover:-translate-y-0.5 hover:border-paper/70"
              >
                Open Passport <span aria-hidden>→</span>
              </button>
              <p className="mt-3 text-[0.62rem] uppercase tracking-[0.3em] text-text-muted">
                A ceremony of record
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── THE LIFELONG RECORD ────────────────────────────────────────── */}
      <motion.div
        initial={false}
        animate={{ opacity: opened ? 1 : 0 }}
        transition={{ duration: reduce ? 0 : 0.7, delay: opened && !reduce ? 0.6 : 0 }}
        aria-hidden={!opened}
        className={opened ? "" : "pointer-events-none"}
      >
        <div className="mx-auto max-w-3xl px-5 py-24">
          <p className="max-w-measure text-pretty text-lg leading-relaxed text-text">
            This is a record of <em>contribution</em> — not a profile, not an account. It does not
            expire and nothing is ever replaced. Every verified act of contribution extends it, for a
            lifetime.
          </p>

          <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-4">
            {[
              ["Certificates", v.counts.certificates],
              ["Artworks", v.counts.artworks],
              ["Contributions", v.counts.contributions],
              ["Chapters", v.counts.chapters],
            ].map(([label, n]) => (
              <div key={label as string} className="bg-bg p-5 text-center">
                <dd className="font-mono text-3xl text-text">{String(n).padStart(2, "0")}</dd>
                <dt className="mt-1 text-[0.6rem] uppercase tracking-[0.22em] text-text-muted">{label}</dt>
              </div>
            ))}
          </dl>

          <div className="mt-16 space-y-14">
            <ArchiveSection title="Certificates" count={v.counts.certificates}>
              <ul className="space-y-2.5">
                {v.certificates.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-2.5">
                    <span>
                      <span className="font-medium">{c.role}</span>
                      {c.artwork && <span className="text-text-muted"> — {c.artwork}</span>}
                      {c.genesis && <span className="ml-2 text-accent" title="Genesis Collection">★</span>}
                    </span>
                    <Link href={`/verify?q=${encodeURIComponent(c.publicId)}`} className="font-mono text-xs text-text-muted hover:text-accent">
                      {c.publicId} ↗
                    </Link>
                  </li>
                ))}
              </ul>
            </ArchiveSection>

            <ArchiveSection title="Artworks" count={v.counts.artworks}>
              <ul className="space-y-2.5">
                {v.artworks.map((w) => (
                  <li key={w.id} className="flex items-baseline justify-between gap-2 border-b border-border/60 pb-2.5">
                    <span>
                      {w.slug ? <Link href={`/artworks/${w.slug}`} className="hover:text-accent">{w.title}</Link> : w.title}
                    </span>
                    <span className="text-text-muted">{w.year ?? ""}</span>
                  </li>
                ))}
              </ul>
            </ArchiveSection>

            <ArchiveSection title="Contribution timeline" count={v.counts.contributions}>
              <ol className="space-y-4">
                {v.contributions.map((c) => (
                  <li key={c.id} className="flex gap-5">
                    <span className="w-24 shrink-0 font-mono text-xs text-text-muted">{c.date?.slice(0, 10) ?? "—"}</span>
                    <span>
                      <span className="text-[0.62rem] uppercase tracking-[0.18em] text-stone">{c.kind.replace(/_/g, " ")}</span>
                      <br />
                      <span className="font-medium">{c.title}</span>
                      {c.description && <span className="mt-0.5 block text-sm text-text-muted">{c.description}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </ArchiveSection>

            <ArchiveSection title="Chapters" count={v.counts.chapters}>
              <ul className="space-y-2.5">
                {v.chapters.map((c) => (
                  <li key={c.name} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-2.5">
                    <span>
                      {c.slug ? <Link href={`/chapters/${c.slug}`} className="hover:text-accent">{c.name}</Link> : c.name}
                      {c.genesis && <span className="ml-2 text-accent" title="Genesis Chapter">★</span>}
                    </span>
                    <span className="text-sm text-text-muted">{c.roles.join(" · ")}</span>
                  </li>
                ))}
              </ul>
            </ArchiveSection>
          </div>

          {/* future-ready provenance — honest about what is active vs reserved */}
          <section className="mt-16 border-t border-border pt-8">
            <h2 className="font-display text-2xl">Provenance &amp; future status</h2>
            <p className="mt-2 max-w-measure text-sm text-text-muted">
              The Passport is designed so these credentials can be added without ever changing the
              holder&rsquo;s experience.
            </p>
            <dl className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <StatusRow label="Institutional digital signature" value="Active" tone="verified" />
              <StatusRow label="QR verification" value="Active" tone="verified" />
              <StatusRow label="Solana soulbound credential" value="Reserved" />
              <StatusRow label="On-chain verification" value="Reserved" />
              <StatusRow label="Cross-chapter recognition" value="Reserved" />
              <StatusRow label="Museum & embassy recognition" value="Reserved" />
            </dl>
          </section>

          <div className="mt-14 flex flex-wrap items-center gap-4">
            <Link
              href={v.printHref}
              className="inline-flex items-center gap-2 rounded-sm bg-accent px-6 py-3 text-sm text-paper transition-transform hover:-translate-y-0.5"
            >
              Generate printable Passport <span aria-hidden>↗</span>
            </Link>
            <Link href="/verify" className="text-sm text-text-muted underline-offset-4 hover:text-text hover:underline">
              Verify a certificate
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── the identity spread (the photo page) ─────────────────────────────────────

function IdentitySpread({ v, mrz: [l1, l2] }: { v: PassportView; mrz: [string, string] }) {
  return (
    <div
      className="overflow-hidden rounded-sm bg-paper text-ink shadow-museum-soft"
      style={{ boxShadow: "0 40px 80px -30px rgba(0,0,0,0.6)" }}
    >
      <div className="relative grid gap-8 p-7 sm:grid-cols-[200px_1fr] sm:p-9">
        {/* watermark seal */}
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 text-ink/[0.04]">
          <PassportSeal size={260} ring={false} />
        </div>

        {/* left rail — portrait, QR, status */}
        <div className="relative flex flex-col gap-5">
          <div className="relative aspect-[3/4] overflow-hidden rounded-sm border border-border bg-mist">
            {v.portrait ? (
              <Image src={v.portrait} alt={v.name} fill sizes="200px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-ink/35">
                <PassportSeal size={120} ring={false} />
              </div>
            )}
            {v.genesis && (
              <span className="absolute left-2 top-2 rounded-full bg-ink/85 px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.16em] text-paper">
                Genesis
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div
              className="h-16 w-16 shrink-0 rounded-sm border border-border bg-white p-1"
              aria-hidden
              dangerouslySetInnerHTML={{ __html: v.qrSvg }}
            />
            <p className="text-[0.62rem] leading-snug text-text-muted">
              Scan to verify this Passport at <span className="break-all font-mono">{v.verifyUrl.replace(/^https?:\/\//, "")}</span>
            </p>
          </div>
        </div>

        {/* right — identity */}
        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="text-[0.62rem] uppercase tracking-[0.32em] text-text-muted">Planet B · Planet Passport</p>
            <PassportSeal size={40} className="text-accent" ring={false} />
          </div>

          <h1 className="mt-4 font-display text-4xl leading-[1.05] sm:text-5xl">
            {v.honorific ? `${v.honorific} ` : ""}
            {v.name}
          </h1>
          <p className="mt-2 font-mono text-sm tracking-[0.12em] text-accent">{v.passportId}</p>

          {v.roles.length > 0 && (
            <p className="mt-4 text-sm text-text-muted">{v.roles.join(" · ")}</p>
          )}
          {v.bio && <p className="mt-5 max-w-measure text-[0.95rem] leading-relaxed">{v.bio}</p>}

          <dl className="mt-7 max-w-sm">
            <StatusRow label="Date of issue" value={fmtDate(v.issuedOn)} />
            <StatusRow label="Issuing authority" value="Planetary Federation" />
            <StatusRow label="Verification" value={v.verified ? "Verified" : "Pending"} tone={v.verified ? "verified" : undefined} />
            <StatusRow label="Validity" value="Lifelong · does not expire" />
          </dl>

          {/* institutional signature */}
          <div className="mt-7 flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-2xl italic leading-none text-ink/80">Planet&nbsp;B</p>
              <p className="mt-1 text-[0.58rem] uppercase tracking-[0.22em] text-text-muted">
                Office of the Planetary Federation
              </p>
            </div>
            <PassportSeal size={56} className="text-ink/45" />
          </div>
        </div>
      </div>

      {/* machine-readable zone */}
      <div className="border-t border-border bg-mist/60 px-7 py-4 sm:px-9">
        <pre className="overflow-x-auto whitespace-pre font-mono text-[0.62rem] leading-5 tracking-[0.18em] text-ink/70 sm:text-xs">
{l1}
{l2}
        </pre>
      </div>
    </div>
  );
}
