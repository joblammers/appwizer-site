import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financial MCP Hub — appwizer",
  description: "Connect your financial system to Claude.",
};

const SYSTEMS = [
  {
    name: "Exact Online",
    icon: "/img/exact-icon.png",
    description:
      "Connect your Exact Online administraties. Read-only access to financials, orders, and more.",
    href: "https://eol.appwizer.com/aanmelden",
  },
  {
    name: "Twinfield",
    icon: "/img/twinfield-icon.png",
    description:
      "Connect your Twinfield administration via Cube API. Read-only access to balance sheet, P&L, and open items.",
    href: "https://twf.appwizer.com/aanmelden",
  },
];

const STEPS = [
  "Choose your system above",
  "Register an app in your system's developer portal",
  "Complete the signup process",
  "Use the connector URL in Claude with your financial data",
];

/**
 * Overgenomen uit het losse mcp-hub-project (voorheen op mcp.appwizer.com) —
 * zelfde inhoud en kaarten, nu met de header/footer van de centrale site via
 * de (site)-route group, en herbouwd met de bestaande theme-tokens in plaats
 * van mcp-hub's eigen inline <style>-tag. De kaarten linken naar de publieke
 * aanmeldpagina's van elk connector-project zelf, niet naar de /mcp/exact of
 * /mcp/twinfield rewrite-paden — die zijn voor JSON-RPC/OAuth-verkeer, geen
 * menselijke navigatie.
 */
export default function McpHubPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-appwizer-orange sm:text-4xl">
          Financial MCP Hub
        </h1>
        <p className="mt-3 text-muted-foreground">
          Connect your financial data to Claude. Choose your system:
        </p>

        <div className="mt-8 space-y-4">
          {SYSTEMS.map((system) => (
            <a
              key={system.name}
              href={system.href}
              className="flex items-start gap-4 rounded-xl border border-border bg-surface p-6 no-underline transition hover:border-appwizer-blue"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- vast icoonbestand, geen externe bron */}
              <img src={system.icon} alt="" className="h-14 w-14 shrink-0" />
              <div>
                <h2 className="m-0 mb-2 text-lg font-semibold text-appwizer-orange">
                  {system.name}
                </h2>
                <p className="m-0 text-sm text-muted-foreground">{system.description}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">
          <p className="m-0 mb-2 font-semibold text-foreground">How it works:</p>
          <ol className="m-0 space-y-1 pl-5">
            {STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
