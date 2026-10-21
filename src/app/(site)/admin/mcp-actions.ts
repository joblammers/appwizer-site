"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin/auth";
import { approveKvTenant, deleteKvTenant, suspendKvTenant } from "@/lib/mcp-kv-tenants";

export async function approveMcpTenantAction(slug: string): Promise<void> {
  await requireAdminSession();
  await approveKvTenant(slug);
  revalidatePath("/admin");
}

export async function suspendMcpTenantAction(slug: string): Promise<void> {
  await requireAdminSession();
  await suspendKvTenant(slug);
  revalidatePath("/admin");
}

export async function deleteMcpTenantAction(slug: string): Promise<void> {
  await requireAdminSession();
  await deleteKvTenant(slug);
  revalidatePath("/admin");
}
