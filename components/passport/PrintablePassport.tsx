import Image from "next/image";
import { PassportSeal } from "./PassportSeal";
import { PrintToolbar } from "./PrintButton";
import type { PassportView } from "./PassportDocument";

/**
 * The printable Planet Passport — a museum-quality cultural credential, sized
 * for A4 and worthy of framing. Server-rendered; the only client island is the
 * print toolbar (hidden on paper). All required fields are present: number,
 * name, portrait, roles, chapters, certificates, artworks, contribution
 * timeline, QR verification, the Eye seal, an institutional signature, issue
 * date, verification status and the reserved future on-chain status.
 */

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

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

const PRINT_CSS = `
  .pbp-stage { background: var(--pb-mist); padding: 2.5rem 1rem 4rem; }
  .pbp-sheet { box-shadow: 0 30px 70px -28px rgba(11,11,12,0.45); }
  @media screen and (max-width: 840px) { .pbp-sheet { transform: none; } }
  @media print {
    @page { size: A4 portrait; margin: 13mm; }
    html, body { background: #fff !important; }
    .pbp-toolbar { display: none !important; }
    .pbp-stage { background: #fff !important; padding: 0 !important; }
    .pbp-sheet {
      box-shadow: none !important; width: 100% !important; max-width: none !important;
      margin: 0 !important; border-width: 1px !important;
    }
    .pbp-break { break-inside: avoid; }
    a { color: inherit !important; text-decoration: none !important; }
  }
`;

function Field({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink/12 py-2">
      <span className="text-[0.58rem] uppercase tracking-[0.2em] text-ink/50">{label}</span>
      <span className={`text-right text-sm font-medium ${accent ? "text-[var(--pb-signal)]" : "text-ink"}`}>{value}</span>
    </div>
  );
}

function Block({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <section className="pbp-break mt-6">
      <h2 className="flex items-baseline justify-between border-b border-ink pb-1 font-display text-base">
        <span>{title}</span>
        <span className="font-mono text-[0.7rem] text-ink/50">{String(count).padStart(2, "0")}</span>
      </h2>
      <div className="mt-2 text-[0.82rem] leading-relaxed text-ink/90">{children}</div>
    </section>
  );
}

export function PrintablePassport({ v }: { v: PassportView }) {
  const [l1, l2] = mrz(v.name, v.passportId);

  return (
    <div className="pbp-stage min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <PrintToolbar backHref={`/passport/${v.passportId}`} />

      <article
        className="pbp-sheet relative mx-auto max-w-[820px] bg-paper text-ink"
        style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact", border: "1px solid var(--pb-ink)" }}
        aria-label={`Printable Planet Passport for ${v.name}`}
      >
        {/* inner diplomatic keyline */}
        <div className="pointer-events-none absolute inset-[6px] border border-ink/25" aria-hidden />

        <div className="relative px-9 py-9 sm:px-12 sm:py-11">
          {/* masthead */}
          <header className="flex items-center justify-between border-b border-ink pb-5">
            <div className="flex items-center gap-3">
              <PassportSeal size={52} className="text-ink" />
              <div>
                <p className="font-display text-xl leading-none tracking-[0.04em]">PLANET PASSPORT</p>
                <p className="mt-1 text-[0.56rem] uppercase tracking-[0.28em] text-ink/55">
                  Office of the Planetary Federation
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm tracking-[0.12em] text-[var(--pb-oxblood)]">{v.passportId}</p>
              <p className="mt-1 text-[0.56rem] uppercase tracking-[0.2em] text-ink/55">PLB · Lifelong</p>
            </div>
          </header>

          {/* identity */}
          <div className="mt-7 grid gap-8 sm:grid-cols-[150px_1fr]">
            <div className="flex flex-col gap-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-sm border border-ink/30 bg-mist">
                {v.portrait ? (
                  <Image src={v.portrait} alt={v.name} fill sizes="150px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink/30">
                    <PassportSeal size={92} ring={false} />
                  </div>
                )}
              </div>
              <div className="flex items-start gap-2">
                <div
                  className="h-[68px] w-[68px] shrink-0 rounded-sm border border-ink/25 bg-white p-1"
                  aria-hidden
                  dangerouslySetInnerHTML={{ __html: v.qrSvg }}
                />
                <p className="text-[0.54rem] leading-snug text-ink/60">
                  Scan to verify
                  <br />
                  <span className="break-all font-mono">{v.verifyUrl.replace(/^https?:\/\//, "")}</span>
                </p>
              </div>
            </div>

            <div>
              {v.genesis && (
                <p className="text-[0.58rem] uppercase tracking-[0.28em] text-[var(--pb-oxblood)]">
                  Genesis Contributor
                </p>
              )}
              <h1 className="mt-1 font-display text-3xl leading-[1.05]">
                {v.honorific ? `${v.honorific} ` : ""}
                {v.name}
              </h1>
              {v.roles.length > 0 && <p className="mt-2 text-sm text-ink/65">{v.roles.join(" · ")}</p>}
              {v.bio && <p className="mt-3 max-w-prose text-[0.82rem] leading-relaxed text-ink/80">{v.bio}</p>}

              <div className="mt-5 max-w-md">
                <Field label="Date of issue" value={fmtDate(v.issuedOn)} />
                <Field label="Issuing authority" value="Planetary Federation" />
                <Field label="Verification status" value={v.verified ? "Verified" : "Pending"} accent={v.verified} />
                <Field label="Validity" value="Lifelong · does not expire" />
              </div>
            </div>
          </div>

          {/* the lifelong record */}
          <div className="mt-2">
            <Block title="Chapters" count={v.chapters.length}>
              <ul className="space-y-1">
                {v.chapters.map((c) => (
                  <li key={c.name} className="flex justify-between gap-3">
                    <span>{c.name}{c.genesis ? " ★" : ""}</span>
                    <span className="text-ink/55">{c.roles.join(" · ")}</span>
                  </li>
                ))}
              </ul>
            </Block>

            <Block title="Certificates" count={v.certificates.length}>
              <ul className="space-y-1">
                {v.certificates.map((c) => (
                  <li key={c.id} className="flex justify-between gap-3">
                    <span>{c.role}{c.artwork ? ` — ${c.artwork}` : ""}{c.genesis ? " ★" : ""}</span>
                    <span className="font-mono text-[0.72rem] text-ink/55">{c.publicId}</span>
                  </li>
                ))}
              </ul>
            </Block>

            <Block title="Artworks" count={v.artworks.length}>
              <ul className="space-y-1">
                {v.artworks.map((w) => (
                  <li key={w.id} className="flex justify-between gap-3">
                    <span>{w.title}</span>
                    <span className="text-ink/55">{w.year ?? ""}</span>
                  </li>
                ))}
              </ul>
            </Block>

            <Block title="Contribution timeline" count={v.contributions.length}>
              <ul className="space-y-1.5">
                {v.contributions.map((c) => (
                  <li key={c.id} className="flex gap-3">
                    <span className="w-20 shrink-0 font-mono text-[0.7rem] text-ink/50">{c.date?.slice(0, 10) ?? "—"}</span>
                    <span>
                      <span className="text-[0.6rem] uppercase tracking-[0.14em] text-ink/45">{c.kind.replace(/_/g, " ")}</span>{" "}
                      {c.title}
                    </span>
                  </li>
                ))}
              </ul>
            </Block>
          </div>

          {/* machine-readable zone */}
          <pre className="pbp-break mt-7 overflow-hidden whitespace-pre rounded-sm border border-ink/20 bg-mist/60 px-4 py-3 font-mono text-[0.6rem] leading-5 tracking-[0.16em] text-ink/70">
{l1}
{l2}
          </pre>

          {/* provenance + signature */}
          <footer className="pbp-break mt-7 grid items-end gap-6 border-t border-ink pt-5 sm:grid-cols-[1fr_auto]">
            <div>
              <p className="text-[0.58rem] uppercase tracking-[0.2em] text-ink/50">Provenance &amp; future status</p>
              <p className="mt-2 text-[0.72rem] leading-relaxed text-ink/70">
                Institutional digital signature · <span className="text-[var(--pb-signal)]">Active</span> &nbsp;·&nbsp;
                QR verification · <span className="text-[var(--pb-signal)]">Active</span> &nbsp;·&nbsp;
                Solana soulbound credential · Reserved &nbsp;·&nbsp; On-chain verification · Reserved
              </p>
              <div className="mt-5">
                <p className="font-display text-2xl italic leading-none text-ink/85">Planet&nbsp;B</p>
                <p className="mt-1 text-[0.54rem] uppercase tracking-[0.2em] text-ink/50">
                  Authorised signature · Office of the Planetary Federation
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <PassportSeal size={92} className="text-ink/70" />
              <p className="mt-2 text-[0.54rem] uppercase tracking-[0.2em] text-ink/45">Official seal</p>
            </div>
          </footer>

          <p className="mt-6 text-center text-[0.56rem] uppercase tracking-[0.24em] text-ink/40">
            Because there is no Planet B
          </p>
        </div>
      </article>
    </div>
  );
}
