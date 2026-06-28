import type { Metadata } from "next";
import Link from "next/link";
import { verificationService } from "@domains/verification";
import type { VerifyOutcome, VerifyStatus } from "@domains/verification";

export const metadata: Metadata = {
  title: "Verify a certificate",
  description:
    "Confirm the authenticity of a Planet B certificate by its public ID or registry ID. Verification is independent of any blockchain.",
};

const PRESENTATION: Record<
  VerifyStatus,
  { label: string; tone: string; blurb: string }
> = {
  verified: {
    label: "Verified",
    tone: "text-verified border-verified",
    blurb: "This certificate's record matches its sealed verification hash.",
  },
  mismatch: {
    label: "Hash mismatch",
    tone: "text-accent border-accent",
    blurb: "The record does not match its sealed hash. Treat with caution and contact Planet B.",
  },
  unissued: {
    label: "Not yet issued",
    tone: "text-clay border-clay",
    blurb: "This certificate exists in the registry but has not completed its issuance ceremony.",
  },
  revoked: {
    label: "Revoked",
    tone: "text-accent border-accent",
    blurb: "This certificate has been revoked. The historical record is preserved.",
  },
  reserved: {
    label: "Reserved",
    tone: "text-stone border-stone",
    blurb: "This slot is intentionally reserved and not yet assigned (accuracy over completeness).",
  },
  not_found: {
    label: "Not found",
    tone: "text-stone border-stone",
    blurb: "No certificate in the Planet Registry matches that identifier.",
  },
};

function Result({ r }: { r: VerifyOutcome }) {
  const p = PRESENTATION[r.status];
  const c = r.certificate;
  return (
    <div className="mt-8 rounded-sm border border-border p-6">
      <div className="flex items-center justify-between gap-4">
        <span className={`rounded-full border px-3 py-1 text-sm ${p.tone}`}>{p.label}</span>
        {c?.isGenesisCollection && (
          <span className="text-xs uppercase tracking-widest text-accent">Genesis Collection</span>
        )}
      </div>
      <p className="mt-3 text-sm text-text-muted">{p.blurb}</p>

      {c && (
        <dl className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-text-muted">Recipient</dt>
            <dd>{c.recipientName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Role / contribution</dt>
            <dd>{c.roleAtIssue}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Chapter</dt>
            <dd>{c.chapterName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Issued</dt>
            <dd>{c.issuedOn ? c.issuedOn.slice(0, 10) : "—"}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Public ID</dt>
            <dd className="font-mono text-xs">{c.publicId}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Registry ID</dt>
            <dd className="font-mono text-xs">{c.registryId ?? "—"}</dd>
          </div>
        </dl>
      )}

      <div className="mt-6 flex flex-wrap gap-4 text-xs text-text-muted">
        <span>Off-chain hash: {r.hashValid ? "✓ valid" : "—"}</span>
        <span>On-chain: {r.onChain ? "✓ anchored" : "planned (Solana)"}</span>
      </div>
    </div>
  );
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const result = q ? await verificationService.verify(q) : null;

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 py-16">
      <p className="text-xs uppercase tracking-widest text-text-muted">Planet B · Trust</p>
      <h1 className="mt-2 font-display text-4xl">Verify a certificate</h1>
      <p className="mt-3 text-text-muted">
        Every Planet B certificate is a permanent, verifiable record of a contribution. Enter a
        public ID (e.g. <span className="font-mono text-sm">PB-ABJ-2026-001</span>) or a registry ID to
        confirm it. Verification works independently of any blockchain.
      </p>

      <form className="mt-8 flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="PB-ABJ-2026-001"
          aria-label="Certificate public ID or registry ID"
          className="flex-1 rounded-sm border border-border bg-transparent px-4 py-3 outline-none focus:border-accent"
        />
        <button className="rounded-sm bg-accent px-5 py-3 text-sm text-paper">Verify</button>
      </form>

      {result && <Result r={result} />}

      <p className="mt-10 text-sm text-text-muted">
        Looking for the people and works behind these certificates? Explore the{" "}
        <Link href="/artists" className="text-accent hover:underline">
          founding artists
        </Link>{" "}
        and the{" "}
        <Link href="/chapters/abuja-2026" className="text-accent hover:underline">
          Genesis Chapter
        </Link>
        .
      </p>
    </main>
  );
}
