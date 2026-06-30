import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { AliveEye } from "@/components/experience/AliveEye";
import { verificationService } from "@domains/verification";
import type { VerifyOutcome, VerifyStatus } from "@domains/verification";

// The trust layer reads live registry state and records a trust event on each
// look-up — always current, never cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Trust Layer · Verify a record",
  description:
    "Enter the trust layer of Planet B. Confirm a certificate against the permanent archive — independent of any blockchain. Authenticity today; issuance is a separate institutional act.",
};

/* ─────────────────────────────────────────────────────────────────────────────
 * The Trust Layer — Experience Gate 6.
 *
 * Not a utility page; the room where a record is examined like an artifact in a
 * museum archive. The emotional arc: arrival → verification → understanding →
 * trust → institutional record.
 *
 * HISTORICAL ACCURACY (load-bearing): the Genesis certificates are archived but
 * have NOT undergone the official digital issuance ceremony. So the truthful
 * outcome for them is "unissued": found, archived, awaiting issuance. This page
 * never implies failure or invalidity — issuance is a separate institutional act.
 *
 * FUTURE-PROOF: the trust ledger below is a lifecycle. Each act is `sealed`,
 * `pending` (awaiting issuance), or `planned`. When the Genesis Issuance Ceremony
 * occurs, the same rows light up — canonical hash sealed, Passport attached, QR
 * active, on-chain anchor, issuance date — with no redesign of this page.
 * ────────────────────────────────────────────────────────────────────────── */

type Tone = "verified" | "clay" | "stone" | "accent";

const TONE: Record<Tone, { text: string; ring: string; dot: string }> = {
  verified: { text: "text-verified", ring: "border-verified/45", dot: "bg-verified" },
  clay: { text: "text-clay", ring: "border-clay/45", dot: "bg-clay" },
  stone: { text: "text-stone", ring: "border-stone/45", dot: "bg-stone" },
  accent: { text: "text-accent", ring: "border-accent/45", dot: "bg-accent" },
};

/** How each verify outcome is spoken — truthful, never alarming. */
const STATUS: Record<VerifyStatus, { eyebrow: string; headline: string; tone: Tone; lead: string }> = {
  verified: {
    eyebrow: "Authenticated",
    headline: "Verified",
    tone: "verified",
    lead: "This record's canonical hash matches the value sealed at issuance. Its authenticity is confirmed against the permanent archive.",
  },
  unissued: {
    eyebrow: "In the archive",
    headline: "Archived · Awaiting issuance",
    tone: "clay",
    lead: "This certificate exists in the Planet Registry and is preserved in the permanent archive. It has not yet undergone the official digital issuance ceremony — a separate institutional act. The record is authentic; its issuance is still to come.",
  },
  reserved: {
    eyebrow: "Reserved",
    headline: "Reserved in the registry",
    tone: "stone",
    lead: "This identifier is intentionally held in the registry and not yet assigned. Accuracy over completeness — Planet B reserves a place before it is filled.",
  },
  mismatch: {
    eyebrow: "Needs review",
    headline: "Record needs review",
    tone: "accent",
    lead: "This record does not match its sealed hash. Please contact Planet B before relying on it; the archive has noted the discrepancy.",
  },
  revoked: {
    eyebrow: "Revoked",
    headline: "Revoked",
    tone: "accent",
    lead: "This certificate has been revoked. Its place in the historical record is preserved for transparency, as the archive never erases.",
  },
  not_found: {
    eyebrow: "No match",
    headline: "No record found",
    tone: "stone",
    lead: "No record in the Planet Registry matches that mark. Check the identifier and look again — the public ID and the registry ID both resolve here.",
  },
};

type LedgerState = "sealed" | "pending" | "planned";

interface LedgerRow {
  act: string;
  detail: string;
  state: LedgerState;
}

const LEDGER_MARK: Record<LedgerState, { label: string; tone: Tone; filled: boolean }> = {
  sealed: { label: "Sealed", tone: "verified", filled: true },
  pending: { label: "Awaiting issuance", tone: "clay", filled: false },
  planned: { label: "Planned", tone: "stone", filled: false },
};

/**
 * The institutional lifecycle of a record, read from its live state. Today the
 * Genesis records show the first acts sealed and the rest awaiting the ceremony;
 * the very same function lights them up once issuance has occurred.
 */
function buildLedger(r: VerifyOutcome): LedgerRow[] {
  const c = r.certificate!;
  const issued = r.status === "verified";
  const issuedOn = c.issuedOn ? c.issuedOn.slice(0, 10) : null;
  return [
    {
      act: "Registry record",
      detail: c.registryId ? `Catalogued as ${c.registryId}` : `Catalogued as ${c.publicId}`,
      state: "sealed",
    },
    {
      act: "Archived",
      detail: "Preserved in Planet B's permanent archive",
      state: "sealed",
    },
    {
      act: "Canonical hash",
      detail: issued && r.hashValid ? "Sealed — matches the record" : "Sealed at the issuance ceremony",
      state: issued && r.hashValid ? "sealed" : "pending",
    },
    {
      act: "Official issuance",
      detail: issued && issuedOn ? `Issued ${issuedOn}` : "Awaiting the Genesis Issuance Ceremony",
      state: issued ? "sealed" : "pending",
    },
    {
      act: "Planet Passport",
      detail: r.soulboundRef ? "Attached to the recipient's Passport" : "Activated at issuance",
      state: r.soulboundRef ? "sealed" : "pending",
    },
    {
      act: "On-chain trust anchor",
      detail: r.onChain ? "Anchored on Solana" : "Solana trust layer · planned",
      state: r.onChain ? "sealed" : "planned",
    },
  ];
}

function RecordField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border-t border-border pt-3">
      <dt className="text-xs uppercase tracking-[0.18em] text-text-muted">{label}</dt>
      <dd className={`mt-1 ${mono ? "font-mono text-sm" : "text-text"}`}>{value}</dd>
    </div>
  );
}

function TrustLedger({ rows }: { rows: LedgerRow[] }) {
  return (
    <Reveal as="section" delay={0.1} className="mt-12">
      <h2 className="text-xs uppercase tracking-[0.22em] text-text-muted">The institutional record</h2>
      <ol className="mt-6 space-y-0">
        {rows.map((row, i) => {
          const mark = LEDGER_MARK[row.state];
          const tone = TONE[mark.tone];
          return (
            <li
              key={row.act}
              className={`flex items-baseline gap-4 py-4 ${i > 0 ? "border-t border-border" : ""}`}
            >
              {/* the mark — filled when an act is sealed, a quiet ring while it waits */}
              <span
                aria-hidden
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full border ${
                  mark.filled ? `${tone.dot} border-transparent` : `border-current ${tone.text}`
                }`}
              />
              <div className="flex-1">
                <p className="font-display text-lg leading-tight text-text">{row.act}</p>
                <p className="mt-0.5 text-sm text-text-muted">{row.detail}</p>
              </div>
              <span className={`shrink-0 text-xs uppercase tracking-[0.14em] ${tone.text}`}>
                {mark.label}
              </span>
            </li>
          );
        })}
      </ol>
    </Reveal>
  );
}

function Outcome({ r }: { r: VerifyOutcome }) {
  const s = STATUS[r.status];
  const tone = TONE[s.tone];
  const c = r.certificate;

  return (
    <div className="mt-14">
      {/* UNDERSTANDING — the status, spoken plainly and without alarm */}
      <Reveal>
        <div className={`border-l-2 pl-5 ${tone.ring}`}>
          <p className={`text-xs uppercase tracking-[0.22em] ${tone.text}`}>{s.eyebrow}</p>
          <h2 className="mt-2 font-display text-3xl leading-tight text-text">{s.headline}</h2>
          <p className="mt-4 max-w-measure text-text-muted">{s.lead}</p>
        </div>
      </Reveal>

      {/* TRUST + INSTITUTIONAL RECORD — the artifact's archival label */}
      {c && (
        <Reveal delay={0.06}>
          <div className="mt-12">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xs uppercase tracking-[0.22em] text-text-muted">The record</h2>
              {c.isGenesisCollection && (
                <span className="text-xs uppercase tracking-[0.22em] text-accent">Genesis Collection</span>
              )}
            </div>
            <dl className="mt-6 grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
              <RecordField label="Recipient" value={c.recipientName ?? "—"} />
              <RecordField label="Role / contribution" value={c.roleAtIssue} />
              <RecordField label="Chapter" value={c.chapterName ?? "—"} />
              <RecordField
                label="Issued"
                value={c.issuedOn ? c.issuedOn.slice(0, 10) : "Not yet issued"}
              />
              <RecordField label="Public ID" value={c.publicId} mono />
              <RecordField label="Registry ID" value={c.registryId ?? "—"} mono />
            </dl>
          </div>

          <TrustLedger rows={buildLedger(r)} />

          {/* The teaching line — issuance is a separate institutional act. */}
          {r.status === "unissued" && (
            <p className="mt-10 max-w-measure border-t border-border pt-6 text-sm text-text-muted">
              When the Genesis Issuance Ceremony takes place, this record's canonical hash will be
              sealed, its Planet Passport activated, its QR made live, and a Solana trust anchor made
              available — each act recorded above, on this same page. Until then, what you see is the
              honest state of the archive.
            </p>
          )}
        </Reveal>
      )}

      {/* No record — a quiet redirection, never a dead end */}
      {!c && (
        <Reveal delay={0.06}>
          <p className="mt-10 max-w-measure border-t border-border pt-6 text-sm text-text-muted">
            Every record carries a public mark in the form{" "}
            <span className="font-mono text-text">PB-ABJ-2026-001</span>. If you are holding a physical
            certificate, its mark is printed beneath the seal.
          </p>
        </Reveal>
      )}
    </div>
  );
}

export default async function VerifyPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();
  const result = q ? await verificationService.verify(q) : null;

  return (
    <main id="main">
      {/* ── ARRIVAL ─────────────────────────────────────────────────────────── */}
      <section
        data-theme="ink"
        className="relative overflow-hidden bg-bg text-text"
      >
        <div
          aria-hidden
          className="pb-settle pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 60% at 50% 30%, rgba(123,92,62,0.12), transparent 70%), radial-gradient(40% 40% at 50% 95%, rgba(110,20,20,0.10), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-measure px-5 pt-20 pb-16 text-center">
          <AliveEye size={108} className="mx-auto text-accent" title="The Planet B seal" />
          <Reveal delay={0.7}>
            <p className="mt-10 text-xs uppercase tracking-[0.3em] text-text-muted">
              Planet B · The Trust Layer
            </p>
          </Reveal>
          <Reveal delay={0.9}>
            <h1 className="mt-4 font-display text-4xl leading-[1.1] tracking-[-0.015em] sm:text-5xl">
              Examine the record.
            </h1>
          </Reveal>
          <Reveal delay={1.1}>
            <p className="mx-auto mt-5 max-w-md text-text-muted">
              Every Planet B certificate is a permanent record of a contribution. Hold one to the
              light here — its authenticity confirmed against the archive, independent of any chain.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── VERIFICATION ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-measure px-5 py-16">
        <form className="group">
          <label
            htmlFor="verify-q"
            className="text-xs uppercase tracking-[0.22em] text-text-muted"
          >
            Enter a record's mark
          </label>
          <div className="mt-3 flex items-end gap-4 border-b border-border pb-3 transition-colors focus-within:border-accent">
            <input
              id="verify-q"
              name="q"
              defaultValue={q}
              placeholder="PB-ABJ-2026-001"
              autoComplete="off"
              spellCheck={false}
              aria-label="Certificate public ID or registry ID"
              className="flex-1 bg-transparent font-mono text-lg outline-none placeholder:text-stone/60"
            />
            <button
              type="submit"
              className="shrink-0 text-sm uppercase tracking-[0.18em] text-accent transition-opacity hover:opacity-70"
            >
              Examine →
            </button>
          </div>
          <p className="mt-3 text-sm text-text-muted">
            Enter a public ID (e.g. <span className="font-mono text-text">PB-ABJ-2026-001</span>) or a
            registry ID. Verification works independently of any blockchain.
          </p>
        </form>

        {result && <Outcome r={result} />}

        {!result && (
          <Reveal delay={0.2}>
            <p className="mt-14 max-w-measure border-t border-border pt-8 text-sm leading-relaxed text-text-muted">
              The certificates of the{" "}
              <Link href="/certificates" className="text-accent hover:underline">
                Genesis Collection
              </Link>{" "}
              are archived and preserved, awaiting their official digital issuance ceremony — a
              milestone in Planet B's history still to come. Until then, each record verifies
              truthfully as held in the archive. Meet the{" "}
              <Link href="/artists" className="text-accent hover:underline">
                founding artists
              </Link>{" "}
              and the{" "}
              <Link href="/chapters/abuja-2026" className="text-accent hover:underline">
                Genesis Chapter
              </Link>{" "}
              behind them.
            </p>
          </Reveal>
        )}
      </section>
    </main>
  );
}
