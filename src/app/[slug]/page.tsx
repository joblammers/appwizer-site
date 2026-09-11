import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getScan } from "@/lib/quickscan/scans";
import { ScanRunner } from "@/components/quickscan/ScanRunner";

interface PageProps {
  params: Promise<{ slug: string }>;
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

export default async function QuickscanPage({ params }: PageProps) {
  const { slug } = await params;
  const scan = await getScan(slug);
  if (!scan) notFound();

  return (
    <main className="min-h-screen bg-background">
      <ScanRunner scan={scan} />
    </main>
  );
}
