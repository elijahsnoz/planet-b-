import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { PageHeader, StatusPill } from "@/components/admin/ui";
import { verificationService } from "@domains/verification";
import type { ClaimStatus } from "@domains/verification";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "needs_review", label: "Needs review" },
  { value: "matched", label: "Matched" },
  { value: "ocr_done", label: "OCR done" },
  { value: "uploaded", label: "Uploaded" },
  { value: "claimed", label: "Claimed" },
  { value: "rejected", label: "Rejected" },
];

function pct(n: number | null): string {
  return n == null ? "—" : `${Math.round(n * 100)}%`;
}

export default async function VerificationQueue({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requirePermission("verification.read");
  const status = (searchParams.status || undefined) as ClaimStatus | undefined;
  const rows = verificationService.listClaims({ status });

  return (
    <div>
      <PageHeader
        title="Verification Queue"
        subtitle={`${rows.length} claim request(s) — connecting people to their certificates`}
      />

      <form className="mb-4 flex items-center gap-3 text-sm">
        <select
          name="status"
          aria-label="Filter by claim status"
          defaultValue={searchParams.status ?? ""}
          className="rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-sm border border-border px-3 py-2 hover:border-accent">Apply</button>
      </form>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-text-muted">
            <th className="py-2 pr-4 font-normal">Submitted</th>
            <th className="py-2 pr-4 font-normal">Asserted ID</th>
            <th className="py-2 pr-4 font-normal">Matched</th>
            <th className="py-2 pr-4 font-normal">OCR conf.</th>
            <th className="py-2 pr-4 font-normal">Match conf.</th>
            <th className="py-2 pr-4 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-center text-text-muted">
                No claim requests yet.
              </td>
            </tr>
          )}
          {rows.map((c) => (
            <tr key={c.id} className="border-b border-border/60 hover:bg-mist/40">
              <td className="py-2 pr-4 text-text-muted">{c.createdAt.slice(0, 16).replace("T", " ")}</td>
              <td className="py-2 pr-4 font-mono text-xs">
                <Link href={`/admin/verifications/${c.id}`} className="hover:text-accent">
                  {c.submittedPublicId ?? "(none)"}
                </Link>
              </td>
              <td className="py-2 pr-4">
                {c.matchedPublicId ? (
                  <span>
                    {c.matchedPublicId}
                    {c.matchedRecipientName ? <span className="text-text-muted"> · {c.matchedRecipientName}</span> : null}
                  </span>
                ) : (
                  <span className="text-stone">—</span>
                )}
              </td>
              <td className="py-2 pr-4 text-text-muted">{pct(c.ocrConfidence)}</td>
              <td className="py-2 pr-4 text-text-muted">{pct(c.confidence)}</td>
              <td className="py-2 pr-4">
                <StatusPill status={c.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
