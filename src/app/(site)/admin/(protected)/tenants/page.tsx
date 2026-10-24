import { mcp } from "@/lib/mcp-db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const tenants = await mcp.tenants.list();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">MCP Tenants</h1>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-border rounded-lg">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 text-left">Slug</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Created</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant: any) => (
              <tr key={tenant.slug} className="border-t border-border hover:bg-muted/50">
                <td className="px-4 py-2 font-mono text-sm">{tenant.slug}</td>
                <td className="px-4 py-2">{tenant.name}</td>
                <td className="px-4 py-2 text-sm">{tenant.email}</td>
                <td className="px-4 py-2">
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
                </td>
                <td className="px-4 py-2 text-sm text-muted-foreground">
                  {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString("nl-NL") : "-"}
                </td>
                <td className="px-4 py-2">
                  <Link href={`/admin/tenants/${tenant.slug}`} className="text-appwizer-orange hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tenants.length === 0 && <p className="text-muted-foreground mt-4">No tenants found.</p>}
    </div>
  );
}
