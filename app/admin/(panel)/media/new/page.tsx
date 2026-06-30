import { requirePermission } from "@/lib/auth";
import {
  Field,
  PageHeader,
  PrimaryButton,
  STATUS_OPTIONS,
  Select,
  TextArea,
} from "@/components/admin/ui";
import { uploadMediaAction } from "../actions";

export default async function NewMedia() {
  await requirePermission("media.upload");

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Upload a picture"
        subtitle="Images are auto-rotated, capped to 2400px on the long edge, and optimised to high-quality JPEG on upload."
      />

      <form action={uploadMediaAction} className="space-y-4">
        <label className="block text-sm">
          <span className="text-text-muted">Image file</span>
          <input
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            required
            className="mt-1 block w-full rounded-sm border border-border bg-transparent text-sm text-text-muted file:mr-4 file:min-h-[44px] file:cursor-pointer file:border-0 file:border-r file:border-border file:bg-mist/50 file:px-4 file:text-sm file:text-text hover:file:bg-mist"
          />
          <span className="mt-1 block text-xs text-stone">JPEG, PNG, WebP, or AVIF · up to 25 MB.</span>
        </label>

        <Field label="Title" name="title" hint="A short name for the asset (optional)." />
        <TextArea label="Alt text — describes the image for screen readers" name="altText" rows={2} />
        <TextArea label="Caption" name="caption" rows={2} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Credit" name="credit" />
          <Field label="Source" name="source" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Author / photographer" name="author" />
          <Field label="Capture date" name="captureDate" hint="e.g. 2026-06-05" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="License" name="license" />
          <Field label="Location" name="location" />
        </div>
        <Field label="Tags" name="tags" hint="Comma-separated." />
        <Select label="Status" name="status" options={STATUS_OPTIONS} defaultValue="draft" />

        <div className="pt-2">
          <PrimaryButton>Upload picture</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
