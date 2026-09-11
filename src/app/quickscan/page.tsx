import type { Metadata } from "next";
import Link from "next/link";
import { getScans } from "@/lib/quickscan/scans";

export const metadata: Metadata = {
  title: "Quickscan administratieve processen",
  description:
    "Ontdek in zes minuten waar in je administratieve proces tijd en geld weglekken.",
};

// Niet statisch cachen: scaninhoud kan via /admin wijzigen zonder redeploy.
export const dynamic = "force-dynamic";

export default async function QuickscanIndexPage() {
  const scans = await getScans();

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Doe de quickscan
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Twee scans, elk zes minuten. Kies de scan die bij jouw situatie past —
          je krijgt direct je score per onderdeel en een verbeterrapport in je
          mailbox.
        </p>

        <div className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2">
          {scans.map((scan) => (
            <Link
              key={scan.slug}
              href={`/quickscan/${scan.slug}`}
              className="group rounded-xl border border-border bg-surface p-6 transition hover:border-appwizer-orange sm:p-8"
            >
              <p className="text-sm font-semibold uppercase tracking-widest text-appwizer-blue">
                {scan.audience}
              </p>
              <h2 className="mt-3 text-xl font-semibold text-foreground">
                {scan.title}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {scan.subtitle}
              </p>
              <span className="mt-6 inline-block text-sm font-semibold text-appwizer-orange">
                Start de scan →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
