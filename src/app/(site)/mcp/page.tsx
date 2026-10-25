import type { Metadata } from "next";
import { BASE_OPEN_GRAPH, BASE_TWITTER } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Financial MCP Hub — AppWizer",
  description: "Koppel je financiële systeem aan Claude.",
  alternates: { canonical: "/mcp" },
  openGraph: { ...BASE_OPEN_GRAPH, title: "Financial MCP Hub — AppWizer", description: "Koppel je financiële systeem aan Claude.", url: "/mcp" },
  twitter: { ...BASE_TWITTER, title: "Financial MCP Hub — AppWizer", description: "Koppel je financiële systeem aan Claude." },
};

const SYSTEMS = [
  {
    name: "Exact Online",
    icon: "/img/exact-icon.png",
    description:
      "Koppel je Exact Online-administraties. Alleen-lezen toegang tot financiële gegevens, orders en meer.",
    href: "https://eol.appwizer.com/aanmelden",
    available: true,
  },
  {
    name: "Twinfield",
    icon: "/img/twinfield-icon.png",
    description:
      "Koppel je Twinfield-administratie via de Cube API. Alleen-lezen toegang tot balans, winst- en verliesrekening en openstaande posten.",
    href: "https://twf.appwizer.com/aanmelden",
    // In ontwikkeling: de kaart blijft zichtbaar maar is niet klikbaar. Zet op true zodra de connector live is.
    available: false,
  },
];

const STEPS = [
  "Kies hierboven je systeem",
  "Registreer een app in het ontwikkelaarsportaal van je systeem",
  "Rond de aanmelding af",
  "Gebruik de connector-URL in Claude met je financiële gegevens",
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
          Koppel je financiële gegevens aan Claude. Kies je systeem:
        </p>

        <div className="mt-8 space-y-4">
          {SYSTEMS.map((system) => {
            const content = (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- vast icoonbestand, geen externe bron */}
                <img src={system.icon} alt="" className="h-14 w-14 shrink-0" />
                <div>
                  <h2 className="m-0 mb-2 flex flex-wrap items-center gap-2 text-lg font-semibold text-appwizer-orange">
                    {system.name}
                    {!system.available && (
                      <span className="rounded-full bg-appwizer-blue/15 px-2.5 py-0.5 text-xs font-semibold text-appwizer-blue">
                        In ontwikkeling
                      </span>
                    )}
                  </h2>
                  <p className="m-0 text-sm text-muted-foreground">{system.description}</p>
                </div>
              </>
            );
            return system.available ? (
              <a
                key={system.name}
                href={system.href}
                className="flex items-start gap-4 rounded-xl border border-border bg-surface p-6 no-underline transition hover:border-appwizer-blue"
              >
                {content}
              </a>
            ) : (
              <div
                key={system.name}
                aria-disabled="true"
                className="flex items-start gap-4 rounded-xl border border-border bg-surface p-6 opacity-60"
              >
                {content}
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">
          <p className="m-0 mb-2 font-semibold text-foreground">Zo werkt het:</p>
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
