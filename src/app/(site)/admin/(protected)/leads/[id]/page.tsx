import { notFound } from "next/navigation";
import { getScan } from "@/lib/quickscan/scans";
import { getLeadById } from "@/lib/quickscan/leads";
import { LeadDetail } from "@/components/admin/LeadDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminLeadPage({ params }: PageProps) {
  const { id } = await params;
  const leadId = Number(id);
  if (!Number.isInteger(leadId)) notFound();

  const lead = await getLeadById(leadId);
  if (!lead) notFound();

  const scan = await getScan(lead.scanSlug);
  if (!scan) notFound();

  return <LeadDetail scan={scan} lead={lead} />;
}
