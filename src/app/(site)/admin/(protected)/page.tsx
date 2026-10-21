import { isDatabaseConfigured } from "@/lib/db";
import { getScans } from "@/lib/quickscan/scans";
import { getAllLeadRows, getLeadStatsByScan } from "@/lib/quickscan/leads";
import { getAllCases } from "@/lib/cases";
import { listKvTenants } from "@/lib/mcp-kv-tenants";
import { ScanList } from "@/components/admin/ScanList";
import { LeadOverview } from "@/components/admin/LeadOverview";
import { CaseList } from "@/components/admin/CaseList";
import { McpTenantList } from "@/components/admin/McpTenantList";
import { AdminTabs } from "@/components/admin/AdminTabs";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [scans, leadStats, leadRows, cases, mcpTenants] = await Promise.all([
    getScans(),
    getLeadStatsByScan(),
    getAllLeadRows(),
    getAllCases(),
    listKvTenants(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Admin</h1>

      {!isDatabaseConfigured && (
        <p className="mt-4 rounded-lg border border-appwizer-orange/40 bg-appwizer-orange/5 p-4 text-sm text-foreground">
          Geen database geconfigureerd (DATABASE_URL ontbreekt). Je ziet de
          scans uit <code>src/lib/quickscan/scans/*.ts</code>, maar
          wijzigingen hier kunnen niet worden opgeslagen. Zet DATABASE_URL op
          een Neon/Postgres-connectiestring om te bewerken.
        </p>
      )}

      <div className="mt-8">
        <AdminTabs
          resultsPanel={<LeadOverview scans={scans} stats={leadStats} leads={leadRows} />}
          scansPanel={<ScanList scans={scans} />}
          casesPanel={<CaseList cases={cases} />}
          mcpPanel={<McpTenantList tenants={mcpTenants} />}
        />
      </div>
    </div>
  );
}
