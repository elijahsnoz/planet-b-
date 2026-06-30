import Image from "next/image";
import { notFound } from "next/navigation";
import { getMediaById, revisionsFor } from "@/lib/admin";
import { can, requirePermission } from "@/lib/auth";
import {
  Field,
  PageHeader,
  PrimaryButton,
  STATUS_OPTIONS,
  Select,
  StatusPill,
  TextArea,
} from "@/components/admin/ui";
import {
  archiveMediaAction,
  replaceMediaImageAction,
  restoreMediaAction,
  updateMediaAction,
} from "../actions";

function fmtBytes(n?: number | null) {
  if (!n) return "—";
  return n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function EditMedia({ params }: { params: { id: string } }) {
  const user = await requirePermission("media.read");
  const m = getMediaById(params.id);
  if (!m) notFound();
  const revisions = revisionsFor("media", m.id);
  const canUpdate = can(user, "media.update");
  const canUpload = can(user, "media.upload");
  const isImage = m.kind === "image" && !!m.storagePath;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={m.title ?? m.slug ?? "Untitled asset"}
        subtitle={`${m.registryId ?? ""} · ${m.kind}`}
        action={<StatusPill status={m.status} archived={!!m.archivedAt} />}
      />

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        {/* Preview + technical facts */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-sm border border-border bg-mist">
            {isImage && m.width && m.height ? (
              <Image
                src={m.storagePath!}
                alt={m.altText ?? m.title ?? "Media preview"}
                fill
                sizes="(max-width: 1024px) 90vw, 16rem"
                className="object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs uppercase tracking-widest text-text-muted">
                {m.kind} · no preview
              </div>
            )}
          </div>
          <dl className="mt-4 space-y-1.5 text-xs text-text-muted">
            <div className="flex justify-between gap-3"><dt>Dimensions</dt><dd>{m.width && m.height ? `${m.width}×${m.height}` : "—"}</dd></div>
            <div className="flex justify-between gap-3"><dt>Size</dt><dd>{fmtBytes(m.bytes)}</dd></div>
            <div className="flex justify-between gap-3"><dt>Type</dt><dd>{m.mime ?? "—"}</dd></div>
            <div className="flex justify-between gap-3"><dt>Path</dt><dd className="truncate font-mono">{m.storagePath ?? "—"}</dd></div>
            {m.sha256 && <div className="flex justify-between gap-3"><dt>SHA-256</dt><dd className="truncate font-mono">{m.sha256.slice(0, 12)}…</dd></div>}
          </dl>

          {canUpload && isImage && (
            <form action={replaceMediaImageAction} className="mt-5 border-t border-border pt-4">
              <input type="hidden" name="id" value={m.id} />
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Replace picture</p>
              <input
                type="file"
                name="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                required
                className="mt-2 block w-full rounded-sm border border-border bg-transparent text-xs text-text-muted file:mr-3 file:min-h-[40px] file:cursor-pointer file:border-0 file:border-r file:border-border file:bg-mist/50 file:px-3 file:text-xs file:text-text hover:file:bg-mist"
              />
              <button className="mt-3 inline-flex min-h-[40px] items-center rounded-sm border border-border px-4 text-sm transition-colors hover:border-accent hover:text-accent">
                Replace &amp; optimise
              </button>
            </form>
          )}
        </div>

        {/* Details */}
        <form action={updateMediaAction} className="space-y-4">
          <input type="hidden" name="id" value={m.id} />
          <Field label="Title" name="title" defaultValue={m.title} />
          <TextArea label="Alt text — describes the image for screen readers" name="altText" rows={2} defaultValue={m.altText} />
          <TextArea label="Caption" name="caption" rows={2} defaultValue={m.caption} />
          <TextArea label="Description" name="description" rows={3} defaultValue={m.description} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Credit" name="credit" defaultValue={m.credit} />
            <Field label="Source" name="source" defaultValue={m.source} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Author / photographer" name="author" defaultValue={m.author} />
            <Field label="Capture date" name="captureDate" defaultValue={m.captureDate} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="License" name="license" defaultValue={m.license} />
            <Field label="Copyright" name="copyright" defaultValue={m.copyright} />
          </div>
          <Field label="Location" name="location" defaultValue={m.location} />
          <Field label="Tags" name="tags" defaultValue={(m.tags ?? []).join(", ")} hint="Comma-separated." />
          <Select label="Status" name="status" options={STATUS_OPTIONS} defaultValue={m.status} />
          {canUpdate ? (
            <PrimaryButton>Save changes</PrimaryButton>
          ) : (
            <p className="text-sm text-stone">Read-only (no update permission).</p>
          )}
        </form>
      </div>

      <div className="mt-8 flex items-center gap-3">
        {m.archivedAt ? (
          <form action={restoreMediaAction}>
            <input type="hidden" name="id" value={m.id} />
            <button className="inline-flex min-h-[44px] items-center rounded-sm border border-border px-4 text-sm hover:border-verified hover:text-verified">
              Restore
            </button>
          </form>
        ) : (
          <form action={archiveMediaAction}>
            <input type="hidden" name="id" value={m.id} />
            <button className="inline-flex min-h-[44px] items-center rounded-sm border border-border px-4 text-sm hover:border-accent hover:text-accent">
              Archive
            </button>
          </form>
        )}
      </div>

      <section className="mt-10">
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
      </section>
    </div>
  );
}
