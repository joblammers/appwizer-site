"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { KvTenantRecord, KvTenantStatus } from "@/lib/mcp-kv-tenants";
import {
  approveMcpTenantAction,
  deleteMcpTenantAction,
  suspendMcpTenantAction,
} from "@/app/(site)/admin/mcp-actions";

/** Zelfde icoonbestanden als /mcp en de systemen-grid op de homepage. */
const SYSTEM_ICON: Record<string, string> = {
  "Exact Online": "/img/exact-online-icon.png",
  Twinfield: "/img/twinfield-icon.png",
};

const STATUS: Record<KvTenantStatus, { label: string; className: string }> = {
  pending: {
    label: "Wacht op goedkeuring",
    className: "bg-appwizer-orange/10 text-appwizer-orange",
  },
  active: {
    label: "Actief",
    className: "bg-green-500/10 text-green-600",
  },
  suspended: {
    label: "Gepauzeerd",
    className: "bg-muted text-muted-foreground",
  },
};

/**
 * Overzicht van MCP-aanmeldingen (Exact Online / Twinfield-connector) — leest
 * uit de `kv_store`-tabel, want de losse exact-online-mcp-app (eol.appwizer.com)
 * schrijft daar met zijn eigen, oorspronkelijke sleutelschema naartoe
 * (`tenant:<slug>`/`tenants:index`), niet naar de nieuwere `mcp_tenants`-tabel
 * uit mcp-db.ts — die laatste schrijft nog niemand naartoe. Zie
 * src/lib/mcp-kv-tenants.ts.
 */
export function McpTenantList({ tenants }: { tenants: KvTenantRecord[] }) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();

  function refresh() {
    startRefresh(() => {
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={refresh}
          disabled={isRefreshing}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-appwizer-orange disabled:opacity-60"
        >
          {isRefreshing ? "Vernieuwen…" : "Vernieuwen"}
        </button>
      </div>

      {tenants.map((tenant) => (
        <TenantRow key={tenant.slug} tenant={tenant} />
      ))}
      {tenants.length === 0 && (
        <p className="text-muted-foreground">
          Nog geen MCP-aanmeldingen. Zodra iemand zich aanmeldt voor de Exact Online- of
          Twinfield-connector, verschijnt die hier.
        </p>
      )}
    </div>
  );
}

function TenantRow({ tenant }: { tenant: KvTenantRecord }) {
  const [isPending, startTransition] = useTransition();
  const status = STATUS[tenant.status];
  const primarySystem = tenant.exact ? "Exact Online" : tenant.twinfield ? "Twinfield" : null;
  const systems = [
    tenant.exact && `Exact Online (${new URL(tenant.exact.baseUrl).host})`,
    tenant.twinfield && `Twinfield (${new URL(tenant.twinfield.baseUrl).host})`,
  ].filter(Boolean);

  function approve() {
    startTransition(async () => {
      await approveMcpTenantAction(tenant.slug);
    });
  }

  function suspend() {
    startTransition(async () => {
      await suspendMcpTenantAction(tenant.slug);
    });
  }

  function remove() {
    if (!window.confirm(`Aanmelding "${tenant.name}" definitief verwijderen?`)) return;
    startTransition(async () => {
      await deleteMcpTenantAction(tenant.slug);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
            {status.label}
          </span>
          <div className="mt-1 flex items-center gap-2">
            {primarySystem && (
              // eslint-disable-next-line @next/next/no-img-element -- vast icoonbestand, geen externe bron
              <img src={SYSTEM_ICON[primarySystem]} alt="" className="h-6 w-6 shrink-0" />
            )}
            <p className="text-lg font-semibold text-foreground">{tenant.name}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {tenant.contactEmail || "Geen e-mailadres"} · /{tenant.slug}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {systems.length > 0 ? systems.join(", ") : "Geen systeem gekoppeld"}
            {" · "}
            Aangemeld {new Date(tenant.createdAt).toLocaleDateString("nl-NL")}
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          {tenant.status !== "active" && (
            <button
              type="button"
              onClick={approve}
              disabled={isPending}
              className="rounded-lg bg-appwizer-orange px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
            >
              Goedkeuren
            </button>
          )}
          {tenant.status === "active" && (
            <button
              type="button"
              onClick={suspend}
              disabled={isPending}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-appwizer-orange disabled:opacity-60"
            >
              Pauzeren
            </button>
          )}
          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:border-appwizer-orange hover:text-appwizer-orange disabled:opacity-60"
          >
            Verwijderen
          </button>
        </div>
      </div>
    </div>
  );
}
