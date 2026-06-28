import { requirePermission } from "@/lib/auth";
import { Field, PageHeader, PrimaryButton, STATUS_OPTIONS, Select, TextArea } from "@/components/admin/ui";
import { createOrganizationAction } from "../actions";

export default async function NewOrganization() {
  await requirePermission("organization.create");
  return (
    <div className="max-w-2xl">
      <PageHeader title="New organization" subtitle="A permanent registry ID is minted on save." />
      <form action={createOrganizationAction} className="space-y-4">
        <Field label="Name" name="name" required />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type" name="type" hint="e.g. Embassy, Foundation, Sponsor" />
          <Field label="Role" name="role" hint="e.g. Host, Partner, Funder" />
        </div>
        <TextArea label="About" name="about" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Website" name="website" hint="https://…" />
          <Field label="Established" name="established" hint="e.g. 1983" />
        </div>
        <Field label="Logo media" name="logoMedia" hint="Media slug or /media/… path" />
        <Select label="Status" name="status" options={STATUS_OPTIONS} defaultValue="draft" />
        <PrimaryButton>Create organization</PrimaryButton>
      </form>
    </div>
  );
}
