import { isDatabaseConfigured } from "@/lib/db";
import { getScans } from "@/lib/quickscan/scans";
import { getAllLeadRows, getLeadStatsByScan } from "@/lib/quickscan/leads";
import { ScanList } from "@/components/admin/ScanList";
import { LeadOverview } from "@/components/admin/LeadOverview";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [scans, leadStats, leadRows] = await Promise.all([
    getScans(),
    getLeadStatsByScan(),
    getAllLeadRows(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Scans</h1>

      {!isDatabaseConfigured && (
        <p className="mt-4 rounded-lg border border-appwizer-orange/40 bg-appwizer-orange/5 p-4 text-sm text-foreground">
          Geen database geconfigureerd (DATABASE_URL ontbreekt). Je ziet de
          scans uit <code>src/lib/quickscan/scans/*.ts</code>, maar
          wijzigingen hier kunnen niet worden opgeslagen. Zet DATABASE_URL op
          een Neon/Postgres-connectiestring om te bewerken.
        </p>
      )}

      <div className="mt-8">
        <LeadOverview scans={scans} stats={leadStats} leads={leadRows} />
      </div>

      <div className="mt-6">
        <ScanList scans={scans} />
      </div>
    </div>
  );
}
