import Link from "next/link";
import { notFound } from "next/navigation";
import { can, requirePermission } from "@/lib/auth";
import { revisionsFor } from "@/lib/admin";
import { trustEventsFor } from "@platform/preservation";
import { PageHeader, StatusPill } from "@/components/admin/ui";
import {
  certificateService,
  issueCertificateAction,
  revokeCertificateAction,
  relateCertificateAction,
  unrelateCertificateAction,
} from "@domains/certificate";

const RELATIONS = [
  { value: "has_master", label: "Master scan (media)" },
  { value: "related_story", label: "Related story" },
  { value: "related_press", label: "Related press" },
  { value: "related_media", label: "Related media" },
  { value: "related_timeline", label: "Related timeline event" },
  { value: "signed_by", label: "Signatory (person/org)" },
];

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-text-muted">{label}</dt>
      <dd className={mono ? "font-mono text-xs" : ""}>{value ?? "—"}</dd>
    </div>
  );
}

export default async function CertificateDetail({ params }: { params: { id: string } }) {
  const user = await requirePermission("certificate.read");
  const cert = certificateService.getById(params.id);
  if (!cert) notFound();

  const revisions = revisionsFor("certificate", cert.id);
  const events = trustEventsFor("certificate", cert.id, 25);
  const canIssue = can(user, "certificate.issue") && cert.status === "draft";
  const canRevoke = can(user, "certificate.revoke") && cert.status === "issued";
  const canUpdate = can(user, "certificate.update");

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={cert.publicId}
        subtitle={`${cert.registryId ?? "—"}${cert.isGenesisCollection ? " · ★ Genesis Collection" : ""}`}
        action={<StatusPill status={cert.status} />}
      />

      {/* Immutable artifact */}
      <section className="rounded-sm border border-border p-5">
        <h2 className="mb-3 font-display text-lg">Historical artifact <span className="text-xs font-normal text-stone">· immutable</span></h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Row label="Recipient" value={cert.recipientName} />
          <Row label="Recipient type" value={cert.recipientType} />
          <Row label="Role / contribution" value={cert.roleAtIssue} />
          <Row label="Chapter" value={cert.chapterName} />
          <Row label="Artwork" value={cert.artworkTitle} />
          <Row label="Issued on" value={cert.issuedOn ? cert.issuedOn.slice(0, 10) : "—"} />
          <Row label="Verification hash" value={cert.verificationHash ? `${cert.verificationHash.slice(0, 16)}…` : "—"} mono />
          <Row label="On-chain ref" value={cert.soulboundRef ?? "planned (Solana)"} mono />
        </dl>
        {cert.note && <p className="mt-3 text-xs text-stone">{cert.note}</p>}
        <p className="mt-4 text-xs text-text-muted">
          The artifact's identity (recipient, role, chapter, artwork, public ID) can never be edited
          here — only issuance, revocation, and digital relationships evolve.
        </p>
      </section>

      {/* Lifecycle actions */}
      <section className="mt-6 flex flex-wrap items-center gap-3">
        {canIssue && (
          <form action={issueCertificateAction}>
            <input type="hidden" name="id" value={cert.id} />
            <button type="submit" className="rounded-sm bg-accent px-4 py-2 text-sm text-paper">
              Complete issuance (seal hash)
            </button>
          </form>
        )}
        {canRevoke && (
          <form action={revokeCertificateAction}>
            <input type="hidden" name="id" value={cert.id} />
            <button type="submit" className="rounded-sm border border-border px-4 py-2 text-sm hover:border-accent hover:text-accent">
              Revoke
            </button>
          </form>
        )}
        {cert.status === "reserved" && (
          <p className="text-sm text-stone">Reserved slot — intentionally not issued (Principle VI).</p>
        )}
        <Link href={`/verify?q=${encodeURIComponent(cert.publicId)}`} className="text-sm text-text-muted hover:text-accent">
          Verify publicly ↗
        </Link>
      </section>

      {/* Preservation layer */}
      <section className="mt-8">
        <h2 className="font-display text-lg">Preservation layer</h2>
        <p className="mt-1 text-sm text-text-muted">
          Archive status: <span className="text-text">{cert.archiveStatus}</span> ·{" "}
          {cert.masterAsset ? "master scan linked" : "no master scan yet"} ·{" "}
          {cert.relations.length} relationship(s)
        </p>

        <ul className="mt-3 space-y-1 text-sm">
          {cert.relations.length === 0 && (
            <li className="text-stone">No digital relationships yet (signatories, story, press, media, timeline).</li>
          )}
          {cert.relations.map((r) => (
            <li key={`${r.relation}:${r.toType}:${r.toId}`} className="flex items-center justify-between gap-3 border-b border-border/50 py-1">
              <span>
                <span className="text-text-muted">{r.relation}</span> → {r.toType}:<span className="font-mono text-xs">{r.toId}</span>
              </span>
              {canUpdate && (
                <form action={unrelateCertificateAction}>
                  <input type="hidden" name="id" value={cert.id} />
                  <input type="hidden" name="relation" value={r.relation} />
                  <input type="hidden" name="toType" value={r.toType} />
                  <input type="hidden" name="toId" value={r.toId} />
                  <button type="submit" className="text-xs text-stone hover:text-accent">remove</button>
                </form>
              )}
            </li>
          ))}
        </ul>

        {canUpdate && (
          <form action={relateCertificateAction} className="mt-4 flex flex-wrap items-end gap-2 text-sm">
            <input type="hidden" name="id" value={cert.id} />
            <label className="text-text-muted">
              Relation
              <select name="relation" aria-label="Relation type" className="ml-2 rounded-sm border border-border bg-transparent px-2 py-1.5 outline-none focus:border-accent">
                {RELATIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </label>
            <input name="toType" placeholder="toType (media, story…)" aria-label="Target type" className="w-40 rounded-sm border border-border bg-transparent px-2 py-1.5 outline-none focus:border-accent" />
            <input name="toId" placeholder="target id" aria-label="Target id" className="w-56 rounded-sm border border-border bg-transparent px-2 py-1.5 outline-none focus:border-accent" />
            <button type="submit" className="rounded-sm border border-border px-3 py-1.5 hover:border-accent">Add relationship</button>
          </form>
        )}
      </section>

      {/* Trust log + version history */}
      <section className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-lg">Verification log</h2>
          <ul className="mt-3 space-y-1 text-sm text-text-muted">
            {events.length === 0 && <li>No verification events yet.</li>}
            {events.map((e) => (
              <li key={e.id} className="flex justify-between gap-3">
                <span>{e.eventType}</span>
                <span className="text-stone">{e.createdAt.slice(0, 16).replace("T", " ")}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-lg">Version history</h2>
          <ul className="mt-3 space-y-1 text-sm text-text-muted">
            {revisions.length === 0 && <li>No revisions yet.</li>}
            {revisions.map((r) => (
              <li key={r.id} className="flex justify-between gap-3">
                <span>v{r.version} · {r.changeSummary ?? "—"}</span>
                <span className="text-stone">{r.createdAt.slice(0, 16).replace("T", " ")}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
