import Link from "next/link";
import { PlanetBMark } from "@/components/PlanetBMark";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-measure flex-col items-center justify-center px-5 text-center">
      <PlanetBMark size={64} className="text-accent" />
      <h1 className="mt-6 font-display text-4xl">This record isn&rsquo;t here</h1>
      <p className="mt-3 text-text-muted">
        It may not be preserved yet, or it may be intentionally incomplete until verified.
      </p>
      <Link href="/" className="mt-6 text-accent underline-offset-4 hover:underline">
        Return to Planet B
      </Link>
    </div>
  );
}
