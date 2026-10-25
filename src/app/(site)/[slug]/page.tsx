import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getScan } from "@/lib/quickscan/scans";
import { getCategoryAverages } from "@/lib/quickscan/leads";
import { decodeAnswers } from "@/lib/quickscan/resultLink";
import { ScanRunner } from "@/components/quickscan/ScanRunner";
import { JsonLd } from "@/components/JsonLd";
import { BASE_OPEN_GRAPH, BASE_TWITTER } from "@/lib/seo";
import { SITE_URL } from "@/lib/structuredData";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ r?: string }>;
}

// Niet statisch cachen: scaninhoud kan via /admin wijzigen zonder redeploy.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const scan = await getScan(slug);
  if (!scan) return {};

  return {
    title: scan.title,
    description: scan.subtitle,
    alternates: { canonical: `/${scan.slug}` },
    openGraph: { ...BASE_OPEN_GRAPH, title: scan.title, description: scan.subtitle, url: `/${scan.slug}` },
    twitter: { ...BASE_TWITTER, title: scan.title, description: scan.subtitle },
  };
}

export default async function QuickscanPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { r } = await searchParams;
  const scan = await getScan(slug);
  if (!scan) notFound();

  const sharedAnswers = r ? decodeAnswers(r) : null;
  const peerScores = await getCategoryAverages(scan.slug);

  return (
    <main className="min-h-screen bg-background">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: scan.title,
          description: scan.subtitle,
          url: `${SITE_URL}/${scan.slug}`,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          inLanguage: "nl-NL",
          audience: { "@type": "Audience", audienceType: scan.audience },
          offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
          provider: { "@id": `${SITE_URL}/#organization` },
        }}
      />
      <ScanRunner scan={scan} initialAnswers={sharedAnswers} peerScores={peerScores} />
    </main>
  );
}
