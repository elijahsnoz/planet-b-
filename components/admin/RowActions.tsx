"use client";

import Link from "next/link";

/**
 * Per-row action cluster for admin list tables: View (public) · Edit · Delete.
 * Delete is a permanent, server-side action guarded by a confirm() so it can
 * never be a one-click accident. Archive (soft-delete) lives on the edit page.
 */
export function RowActions({
  editHref,
  viewHref,
  deleteAction,
  id,
  name,
}: {
  editHref: string;
  viewHref?: string | null;
  deleteAction: (formData: FormData) => void;
  id: string;
  name: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {viewHref ? (
        <Link href={viewHref} target="_blank" className="text-text-muted hover:text-accent">
          View
        </Link>
      ) : (
        <span className="text-stone/50">View</span>
      )}
      <Link href={editHref} className="text-text-muted hover:text-accent">
        Edit
      </Link>
      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (!confirm(`Permanently delete “${name}”?\n\nThis cannot be undone. To keep the record but hide it, use Archive instead.`)) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="text-text-muted hover:text-accent">
          Delete
        </button>
      </form>
    </div>
  );
}
