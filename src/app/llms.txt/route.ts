import { getScans } from "@/lib/quickscan/scans";
import { SITE_URL } from "@/lib/structuredData";

// Scans kunnen via /admin wijzigen zonder redeploy.
export const dynamic = "force-dynamic";

/**
 * /llms.txt — compacte, door AI-systemen leesbare samenvatting van de site
 * (llmstxt.org-formaat). Houd de feiten gelijk aan de homepage, de footer en
 * lib/faq.ts.
 */
export async function GET() {
  const scans = (await getScans()).filter((s) => s.visible !== false);

  const body = `# AppWizer

> AppWizer B.V. analyseert en optimaliseert administratieve processen (facturatie, boekhouding, salaris) in NetSuite, Odoo, Exact Online en Twinfield, en gebruikt AI om herhalend werk te automatiseren. Voor finance & controllers in het MKB, accountants- en administratiekantoren en huisartsenpraktijken. We werken binnen de software die je al gebruikt, zonder migratie. Onze basis is NetSuite, Odoo, Exact Online en Twinfield; daarnaast kennen en gebruiken we diverse andere applicaties om tot een zo goed mogelijk geautomatiseerd proces te komen.

## Quickscans (gratis, online)

De quickscan haalt in hoofdlijnen de knelpunten in je financiële proces boven tafel; daarna volgt een diepgaande analyse.

${scans.map((s) => `- [${s.title}](${SITE_URL}/${s.slug}): ${s.subtitle.replace(/[.!?]+$/, "")} (${s.audience.replace(/^Voor /, "voor ")})`).join("\n")}

## Meer

- [Werkwijze in vier stappen](${SITE_URL}/#werkwijze): quickscan en analyse, rapport en advies, implementatie, continue optimalisatie.
- [Klantcases per applicatie](${SITE_URL}/#software): procesoptimalisatie in o.a. NetSuite, Odoo, Exact Online en Twinfield.
- [Veelgestelde vragen](${SITE_URL}/#faq)
- [Financial MCP Hub](${SITE_URL}/mcp): alleen-lezen connectoren om je financiële systeem aan Claude te koppelen. Exact Online is beschikbaar, Twinfield is in ontwikkeling.
- [Privacyverklaring](${SITE_URL}/privacyverklaring)
- [Algemene voorwaarden](${SITE_URL}/algemene-voorwaarden)

## Bedrijf

AppWizer B.V., Florence Nightingalelaan 18, 6721 BJ Bennekom. KVK 80625614. support@appwizer.com.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
