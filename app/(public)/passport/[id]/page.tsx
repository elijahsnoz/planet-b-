import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { passportService } from "@domains/passport";
import { buildPassportView } from "@/lib/passport-view";
import { PassportDocument } from "@/components/passport/PassportDocument";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const a = passportService.publicArchive(decodeURIComponent(params.id));
  if (!a) return { title: "Planet Passport" };
  return {
    title: `${a.person.fullName} — Planet Passport`,
    description: `The lifelong Planet B contribution record of ${a.person.fullName} (${a.passport.passportId}). A record of contribution, not a profile — it grows for a lifetime.`,
  };
}

export default async function PublicPassport({ params }: { params: { id: string } }) {
  const view = await buildPassportView(decodeURIComponent(params.id));
  if (!view) notFound();
  return <PassportDocument v={view} />;
}
