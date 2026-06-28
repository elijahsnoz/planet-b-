import type { Metadata } from "next";
import { PlanetBMark } from "@/components/PlanetBMark";
import { Reveal } from "@/components/Reveal";
import { getCertificates, getOrganization, getPerson } from "@/lib/data";

export const metadata: Metadata = {
  title: "Certificates",
  description: "Permanent Planet B identities — contribution, not attendance. Blockchain-ready.",
};

export default function CertificatesPage() {
  const certificates = getCertificates();
  return (
    <div className="mx-auto max-w-container px-5 py-14">
      <Reveal>
        <h1 className="font-display text-5xl">Certificates</h1>
        <p className="mt-3 max-w-measure text-text-muted">
          Every verified contributor receives a permanent Planet B identity — honoring contribution,
          not attendance. Certificates are designed to become verifiable digital credentials
          (Soulbound, non-transferable) — no wallet or fee required to receive or verify one.
        </p>
      </Reveal>
      <ul className="mt-10 divide-y divide-border border-y border-border">
        {certificates.map((c) => {
          const subject = c.person ? getPerson(c.person)?.full_name : null;
          return (
            <li key={c.public_id} className="flex items-center gap-4 py-4">
              <PlanetBMark size={28} className="shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg">
                  {subject ?? (c.person === null ? "— reserved —" : c.person)}
                </p>
                <p className="text-sm text-text-muted">{c.role_at_issue}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm">{c.public_id}</p>
                <p className="text-xs uppercase tracking-wide text-stone">{c.status}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-xs text-text-muted">
        Status <code>draft</code> until consent is granted and issuance is confirmed; one seat is
        <code> reserved</code> for the unverified fifteenth founding artist.
      </p>
    </div>
  );
}
