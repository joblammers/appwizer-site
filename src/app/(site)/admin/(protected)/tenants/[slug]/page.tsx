import { mcp } from "@/lib/mcp-db";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TenantDetailPage({ params }: { params: { slug: string } }) {
  const tenant = await mcp.tenants.get(params.slug);

  if (!tenant) {
    redirect("/admin/tenants");
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/tenants" className="text-appwizer-orange hover:underline text-sm">
          ← Back to Tenants
        </Link>
      </div>

      <div className="bg-background border border-border rounded-lg p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">{tenant.name}</h1>
          <p className="text-muted-foreground text-sm">{tenant.slug}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <p className="text-foreground">{tenant.email || "-"}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <p>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  tenant.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : tenant.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {tenant.status}
              </span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Created</label>
            <p className="text-foreground">
              {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString("nl-NL") : "-"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Approved</label>
            <p className="text-foreground">
              {tenant.approvedAt ? new Date(tenant.approvedAt).toLocaleDateString("nl-NL") : "-"}
            </p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Exact Online Config</label>
          <div className="bg-muted p-3 rounded text-sm font-mono">
            <p>Client ID: {tenant.exactClientId || "-"}</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Twinfield Config</label>
          <div className="bg-muted p-3 rounded text-sm font-mono">
            <p>Client ID: {tenant.twinfieldClientId || "-"}</p>
            <p>Base URL: {tenant.twinfieldBaseUrl || "-"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
