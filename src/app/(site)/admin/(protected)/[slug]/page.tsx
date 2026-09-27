import { notFound } from "next/navigation";
import { getScan } from "@/lib/quickscan/scans";
import { ScanEditor } from "@/components/admin/ScanEditor";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminScanPage({ params }: PageProps) {
  const { slug } = await params;
  const scan = await getScan(slug);
  if (!scan) notFound();

  return <ScanEditor key={scan.slug} scan={scan} />;
}
