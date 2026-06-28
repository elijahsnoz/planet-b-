import Link from "next/link";
import { notFound } from "next/navigation";
import { can, requirePermission } from "@/lib/auth";
import { PageHeader, StatusPill } from "@/components/admin/ui";
import {
  verificationService,
  matchClaimAction,
  reviewClaimAction,
} from "@domains/verification";

function pct(n: number | null): string {
  return n == null ? "—" : `${Math.round(n * 100)}%`;
}

export default async function ClaimReview({ params }: { params: { id: string } }) {
  const user = await requirePermission("verification.read");
  const claim = verificationService.getClaim(params.id);
  if (!claim) notFound();

  const canManage = can(user, "verification.manage");
  const decided = claim.status === "claimed" || claim.status === "rejected";

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Claim review"
        subtitle={`Submitted ${claim.createdAt.slice(0, 16).replace("T", " ")}`}
        action={<StatusPill status={claim.status} />}
      />

      <section className="rounded-sm border border-border p-5">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-text-muted">Asserted public ID</dt>
            <dd className="font-mono text-xs">{claim.submittedPublicId ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Uploaded file</dt>
            <dd className="font-mono text-xs">{claim.fileRef ?? "— (none) —"}</dd>
          </div>
          <div>
            <dt className="text-text-muted">OCR confidence</dt>
            <dd>{pct(claim.ocrConfidence)}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Match confidence</dt>
            <dd>{pct(claim.confidence)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-text-muted">Matched certificate</dt>
            <dd>
              {claim.matchedCertificateId ? (
                <Link href={`/admin/certificates/${claim.matchedCertificateId}`} className="text-accent hover:underline">
                  {claim.matchedPublicId} {claim.matchedRecipientName ? `· ${claim.matchedRecipientName}` : ""}
                </Link>
              ) : (
                <span className="text-stone">No match yet</span>
              )}
            </dd>
          </div>
        </dl>

        {claim.ocrText && (
          <div className="mt-4">
            <p className="text-text-muted text-sm">OCR text</p>
            <pre className="mt-1 max-h-40 overflow-auto rounded-sm border border-border bg-mist/30 p-3 text-xs">{claim.ocrText}</pre>
          </div>
        )}
        {claim.reviewNote && <p className="mt-3 text-xs text-stone">Reviewer note: {claim.reviewNote}</p>}
      </section>

      {canManage && !decided && (
        <section className="mt-6 space-y-4">
          <form action={matchClaimAction}>
            <input type="hidden" name="id" value={claim.id} />
            <button type="submit" className="rounded-sm border border-border px-4 py-2 text-sm hover:border-accent hover:text-accent">
              Re-run registry match
            </button>
          </form>

          <form action={reviewClaimAction} className="space-y-3 rounded-sm border border-border p-4">
            <input type="hidden" name="id" value={claim.id} />
            <label className="block text-sm">
              <span className="text-text-muted">Reviewer note (optional)</span>
              <textarea
                name="note"
                rows={2}
                className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
              />
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                name="decision"
                value="approve"
                className="rounded-sm bg-accent px-4 py-2 text-sm text-paper disabled:opacity-50"
              >
                Approve &amp; attach to Passport
              </button>
              <button
                type="submit"
                name="decision"
                value="reject"
                className="rounded-sm border border-border px-4 py-2 text-sm hover:border-accent hover:text-accent"
              >
                Reject
              </button>
            </div>
            <p className="text-xs text-text-muted">
              Approving connects this certificate to its recipient&apos;s future Planet Passport
              (via the certificate&apos;s recipient identity). The historical artifact is never altered.
            </p>
          </form>
        </section>
      )}

      {decided && (
        <p className="mt-6 text-sm text-text-muted">
          This claim was <strong>{claim.status}</strong>
          {claim.decidedAt ? ` on ${claim.decidedAt.slice(0, 10)}` : ""}. Decisions are preserved in
          the verification log.
        </p>
      )}
    </div>
  );
}
