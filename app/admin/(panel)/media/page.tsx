import Image from "next/image";
import Link from "next/link";
import { listMedia } from "@/lib/admin";
import { can, requirePermission } from "@/lib/auth";
import { GhostLink, PageHeader, StatusPill } from "@/components/admin/ui";

export default async function MediaLibrary() {
  const user = await requirePermission("media.read");
  const rows = listMedia();
  const canUpload = can(user, "media.upload");

  return (
    <div>
      <PageHeader
        title="Media Library"
        subtitle={`${rows.length} asset(s) · masters preserved, derivatives regenerable`}
        action={canUpload ? <GhostLink href="/admin/media/new">Upload picture</GhostLink> : undefined}
      />

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-text-muted">
            <th className="py-2 pr-4 font-normal">Preview</th>
            <th className="py-2 pr-4 font-normal">Title</th>
            <th className="py-2 pr-4 font-normal">Kind</th>
            <th className="py-2 pr-4 font-normal">Dimensions</th>
            <th className="py-2 pr-4 font-normal">Source</th>
            <th className="py-2 pr-4 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => {
            const isImage = m.kind === "image" && !!m.storagePath;
            const title = m.title ?? m.slug ?? "Untitled";
            return (
              <tr key={m.id} className="border-b border-border/60 hover:bg-mist/40">
                <td className="py-2 pr-4">
                  <Link href={`/admin/media/${m.id}`} className="block" aria-label={`Edit ${title}`}>
                    <span className="relative block h-12 w-12 overflow-hidden rounded-sm border border-border bg-mist">
                      {isImage ? (
                        <Image src={m.storagePath!} alt="" fill sizes="48px" className="object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[0.55rem] uppercase tracking-wide text-text-muted">
                          {m.kind}
                        </span>
                      )}
                    </span>
                  </Link>
                </td>
                <td className="py-2 pr-4">
                  <Link href={`/admin/media/${m.id}`} className="hover:text-accent">
                    {title}
                  </Link>
                  <span className="block font-mono text-[0.7rem] text-text-muted">{m.registryId}</span>
                </td>
                <td className="py-2 pr-4 text-text-muted">{m.kind}</td>
                <td className="py-2 pr-4 text-text-muted">{m.width && m.height ? `${m.width}×${m.height}` : "—"}</td>
                <td className="py-2 pr-4 text-text-muted">{m.source ?? "—"}</td>
                <td className="py-2 pr-4"><StatusPill status={m.status} archived={!!m.archivedAt} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="mt-6 text-xs text-text-muted">
        Uploaded pictures are EXIF-rotated, capped to 2400px, and optimised on ingest; next/image still
        serves AVIF/WebP derivatives on the wire.
      </p>
    </div>
  );
}
