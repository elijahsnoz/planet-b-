import { artistOptions } from "@/lib/admin";
import { requirePermission } from "@/lib/auth";
import { Field, PageHeader, PrimaryButton, STATUS_OPTIONS, Select, TextArea } from "@/components/admin/ui";
import { createArtworkAction } from "../actions";

export default async function NewArtwork() {
  await requirePermission("artwork.create");
  const artists = artistOptions();
  return (
    <div className="max-w-2xl">
      <PageHeader title="New artwork" subtitle="A permanent registry ID is minted on save." />
      <form action={createArtworkAction} className="space-y-4">
        <Field label="Title" name="title" required />
        <Select label="Artist" name="artistId" options={artists.map((a) => ({ value: a.id, label: a.name }))} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Medium" name="medium" defaultValue="Discarded items assemblage" />
          <Field label="Dimensions" name="dimensions" defaultValue="61cm x 61cm" />
        </div>
        <Field label="Year" name="year" type="number" defaultValue={2026} />
        <Field label="Materials (comma-separated)" name="materials" hint="plastics, drink cans, …" />
        <TextArea label="Artist statement" name="statement" />
        <TextArea label="Significance" name="significance" rows={3} />
        <Select label="Status" name="status" options={STATUS_OPTIONS} defaultValue="draft" />
        <PrimaryButton>Create artwork</PrimaryButton>
      </form>
    </div>
  );
}
