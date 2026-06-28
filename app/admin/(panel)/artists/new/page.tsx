import { requirePermission } from "@/lib/auth";
import { CONSENT_OPTIONS, Field, PageHeader, PrimaryButton, STATUS_OPTIONS, Select, TextArea } from "@/components/admin/ui";
import { createPersonAction } from "../actions";

export default async function NewPerson() {
  await requirePermission("artist.create");
  return (
    <div className="max-w-2xl">
      <PageHeader title="New person" subtitle="A permanent registry ID is minted on save." />
      <form action={createPersonAction} className="space-y-4">
        <Field label="Full name" name="fullName" required />
        <Field label="Display name" name="displayName" />
        <Field label="Primary role" name="primaryRole" hint="e.g. Founding Artist" />
        <Field label="Roles (comma-separated)" name="roles" hint="Founding Artist, Storyteller, …" />
        <TextArea label="Short bio" name="shortBio" />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Consent" name="consentStatus" options={CONSENT_OPTIONS} defaultValue="pending" />
          <Select label="Status" name="status" options={STATUS_OPTIONS} defaultValue="draft" />
        </div>
        <PrimaryButton>Create person</PrimaryButton>
      </form>
    </div>
  );
}
