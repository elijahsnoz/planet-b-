import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { passportService } from "@domains/passport";
import { buildPassportView } from "@/lib/passport-view";
import { PrintablePassport } from "@/components/passport/PrintablePassport";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const a = passportService.publicArchive(decodeURIComponent(params.id));
  if (!a) return { title: "Printable Planet Passport" };
  return {
    title: `${a.person.fullName} — Printable Planet Passport`,
    description: `A museum-quality printable Planet Passport for ${a.person.fullName} (${a.passport.passportId}).`,
    robots: { index: false },
  };
}

export default async function PrintPassport({ params }: { params: { id: string } }) {
  const view = await buildPassportView(decodeURIComponent(params.id));
  if (!view) notFound();
  return <PrintablePassport v={view} />;
}
