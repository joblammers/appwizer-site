import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getScan } from "@/lib/quickscan/scans";
import { decodeAnswers } from "@/lib/quickscan/resultLink";
import { ScanRunner } from "@/components/quickscan/ScanRunner";

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
    openGraph: {
      title: scan.title,
      description: scan.subtitle,
      type: "website",
    },
  };
}

export default async function QuickscanPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { r } = await searchParams;
  const scan = await getScan(slug);
  if (!scan) notFound();

  const sharedAnswers = r ? decodeAnswers(r) : null;

  return (
    <main className="min-h-screen bg-background">
      <ScanRunner scan={scan} initialAnswers={sharedAnswers} />
    </main>
  );
}
